use tauri::{Manager, Emitter};
use serde::Serialize;
use std::fs;
use std::path::PathBuf;
use futures_util::StreamExt;
use std::io::Write;

#[derive(Serialize, Clone)]
struct ProgressPayload {
    state: String,
    progress: f64,
    #[serde(rename = "downloadedBytes")]
    downloaded_bytes: u64,
    #[serde(rename = "totalBytes")]
    total_bytes: u64,
    message: String,
}

#[derive(Serialize)]
struct InstallResult {
    state: String,
    success: bool,
    message: String,
    #[serde(rename = "errorDetail")]
    error_detail: Option<String>,
    #[serde(rename = "absolutePath")]
    absolute_path: Option<String>,
}

#[tauri::command]
async fn install_starter_model(app_handle: tauri::AppHandle, window: tauri::Window) -> Result<InstallResult, String> {
    let url = "https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF/resolve/main/qwen2.5-0.5b-instruct-q4_k_m.gguf";
    let filename = "qwen2.5-0.5b-instruct-q4_k_m.gguf";
    let expected_size: u64 = 491_400_032;
    let tolerance: u64 = 5_000_000;

    let app_data_dir = match app_handle.path().app_data_dir() {
        Ok(dir) => dir,
        Err(_) => return Err("Could not resolve app_data_dir".to_string()),
    };

    if !app_data_dir.exists() {
        if let Err(e) = fs::create_dir_all(&app_data_dir) {
            return Err(format!("Could not create app data dir: {}", e));
        }
    }

    let file_path = app_data_dir.join(filename);

    let emit_progress = |state: &str, progress: f64, down: u64, total: u64, msg: &str| {
        let _ = window.emit("llm-download-progress", ProgressPayload {
            state: state.to_string(),
            progress,
            downloaded_bytes: down,
            total_bytes: total,
            message: msg.to_string(),
        });
    };

    emit_progress("checking", 0.0, 0, 0, "Checking local model...");
    
    if file_path.exists() {
        let metadata = fs::metadata(&file_path).map_err(|e| e.to_string())?;
        let size_on_disk = metadata.len();
        let diff = if expected_size > size_on_disk { expected_size - size_on_disk } else { size_on_disk - expected_size };
        
        if diff <= tolerance {
            register_with_ollama(&file_path, &app_data_dir);
            emit_progress("ready", 100.0, size_on_disk, size_on_disk, "Model ready");
            return Ok(InstallResult {
                state: "ready".to_string(),
                success: true,
                message: "Model already installed and valid".to_string(),
                error_detail: None,
                absolute_path: Some(file_path.to_string_lossy().to_string()),
            });
        } else {
            let _ = fs::remove_file(&file_path);
        }
    }

    emit_progress("downloading", 0.0, 0, 0, "Connecting...");

    let res = match reqwest::get(url).await {
        Ok(r) => r,
        Err(e) => {
            emit_progress("controlled_error", 0.0, 0, 0, "Download failed");
            return Ok(InstallResult {
                state: "controlled_error".to_string(),
                success: false,
                message: "Download failed".to_string(),
                error_detail: Some(format!("Request failed: {}", e)),
                absolute_path: None,
            });
        }
    };
    
    if !res.status().is_success() {
        emit_progress("controlled_error", 0.0, 0, 0, "Download failed");
        return Ok(InstallResult {
            state: "controlled_error".to_string(),
            success: false,
            message: "Download failed".to_string(),
            error_detail: Some(format!("Status code: {}", res.status())),
            absolute_path: None,
        });
    }

    let total_size = res.content_length().unwrap_or(expected_size);
    let mut file = fs::File::create(&file_path).map_err(|e| format!("Failed to create file: {}", e))?;
    let mut downloaded: u64 = 0;
    let mut stream = res.bytes_stream();

    // To prevent spamming the frontend with too many events, we only emit progress every N bytes
    let emit_threshold = 1024 * 1024; // 1 MB
    let mut last_emitted = 0;

    while let Some(chunk) = stream.next().await {
        let chunk = chunk.map_err(|e| format!("Error downloading chunk: {}", e))?;
        file.write_all(&chunk).map_err(|e| format!("Error writing chunk: {}", e))?;
        downloaded += chunk.len() as u64;
        
        if downloaded - last_emitted >= emit_threshold || downloaded == total_size {
            let pct = (downloaded as f64 / total_size as f64) * 100.0;
            emit_progress("downloading", pct, downloaded, total_size, "Downloading model...");
            last_emitted = downloaded;
        }
    }

    emit_progress("validating", 100.0, downloaded, total_size, "Validating...");
    
    let diff = if expected_size > downloaded { expected_size - downloaded } else { downloaded - expected_size };
    if diff > tolerance {
        let _ = fs::remove_file(&file_path);
        return Ok(InstallResult {
            state: "controlled_error".to_string(),
            success: false,
            message: "Validation failed after download".to_string(),
            error_detail: Some(format!("Size mismatch: expected {}, got {}", expected_size, downloaded)),
            absolute_path: None,
        });
    }

    register_with_ollama(&file_path, &app_data_dir);
    emit_progress("ready", 100.0, downloaded, total_size, "Model ready");
    Ok(InstallResult {
        state: "ready".to_string(),
        success: true,
        message: "Model downloaded and validated".to_string(),
        error_detail: None,
        absolute_path: Some(file_path.to_string_lossy().to_string()),
    })
}

fn register_with_ollama(file_path: &PathBuf, app_data_dir: &PathBuf) {
    if let Some(path_str) = file_path.to_str() {
        let modelfile_content = format!(
            "FROM {}\nTEMPLATE \"\"\"{{{{ if .System }}}}<|im_start|>system\n{{{{ .System }}}}<|im_end|>\n{{{{ end }}}}{{{{ if .Prompt }}}}<|im_start|>user\n{{{{ .Prompt }}}}<|im_end|>\n{{{{ end }}}}<|im_start|>assistant\n\"\"\"\nPARAMETER stop \"<|im_start|>\"\nPARAMETER stop \"<|im_end|>\"\n",
            path_str
        );
        let modelfile_path = app_data_dir.join("Modelfile");
        if std::fs::write(&modelfile_path, modelfile_content).is_ok() {
            let _ = std::process::Command::new("ollama")
                .arg("create")
                .arg("qwen2.5-0.5b")
                .arg("-f")
                .arg(&modelfile_path)
                .status();
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![install_starter_model])
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            let window = tauri::WebviewWindowBuilder::new(
                app,
                "main",
                tauri::WebviewUrl::App("index.html".into())
            )
            .title("Entity")
            .inner_size(1280.0, 800.0)
            .decorations(false)
            .transparent(true)
            .visible(false)
            .build()?;

            if let Ok(Some(monitor)) = window.primary_monitor() {
                let m_size = monitor.size();
                let m_pos = monitor.position();
                let scale = monitor.scale_factor();
                
                // Convert logical window size to physical pixels
                let win_w = (1280.0 * scale) as i32;
                let win_h = (800.0 * scale) as i32;
                
                // Calculate geometric center on the primary monitor
                let mut x = m_pos.x + ((m_size.width as i32 - win_w) / 2);
                let mut y = m_pos.y + ((m_size.height as i32 - win_h) / 2);
                
                // Apply a slight optical offset upwards (golden ratio visual centering)
                y -= (40.0 * scale) as i32;
                
                if x < 0 { x = 0; }
                if y < 0 { y = 0; }
                
                let _ = window.set_position(tauri::Position::Physical(tauri::PhysicalPosition::new(x, y)));
            } else {
                let _ = window.center();
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

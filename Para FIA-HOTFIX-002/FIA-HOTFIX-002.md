# FIA-HOTFIX-002: Corrección de Compilación macOS en GitHub Actions

## Objetivo
Solucionar el fallo en GitHub Actions (`run failed`) que ocurre al intentar compilar la aplicación para macOS (`macos-latest`).

## Alcance Estricto
- Resolver el error de Rust `error[E0599]: no method named 'transparent' found for struct 'WebviewWindowBuilder'`.
- Añadir el feature flag `macos-private-api` a la dependencia `tauri` en `src-tauri/Cargo.toml` para que el método `transparent` esté disponible en macOS.
- Mantener las compilaciones de Windows y Linux intactas y funcionales.
- NO realizar cambios funcionales en la UI ni en la lógica de dominio.

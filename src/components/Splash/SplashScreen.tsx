import React, { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import type { SplashLifecycleState } from '../../platform/desktop/splash';
import type { LLMDownloadProgressEvent, LLMInstallResult } from '../../platform/desktop/llm-auto-installer';
import ghostImg from '../../assets/ghost.jpeg';
import './SplashScreen.css';

export const SplashScreen: React.FC<{ onComplete?: () => void }> = ({ onComplete }) => {
  const [, setStatus] = useState<SplashLifecycleState>('initializing');
  const [message, setMessage] = useState<string>('Preparando entorno...');
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let unlisten: (() => void) | undefined;
    
    const setupListener = async () => {
      unlisten = await listen<LLMDownloadProgressEvent>('llm-download-progress', (event) => {
        if (!isMounted) return;
        const payload = event.payload;
        
        setStatus(payload.state as SplashLifecycleState);
        if (payload.message) {
          setMessage(payload.message);
        }
        
        if (payload.state === 'downloading') {
          // You could show a progress bar here using payload.progress
          const pct = payload.progress.toFixed(1);
          const dl = ((payload.downloadedBytes || 0) / (1024*1024)).toFixed(1);
          const tot = ((payload.totalBytes || 0) / (1024*1024)).toFixed(1);
          setMessage(`Descargando IA local (Qwen 2.5 0.5B)... ${pct}% (${dl}MB / ${tot}MB)`);
        }
      });
    };

    const runInstaller = async () => {
      if (!isMounted) return;
      
      try {
        const result = await invoke<LLMInstallResult>('install_starter_model');
        if (!isMounted) return;
        
        if (result.success) {
          setStatus('ready');
          setMessage('Todo listo. Iniciando Entity...');
          await new Promise(resolve => setTimeout(resolve, 1500));
          if (!isMounted) return;
          
          setFadingOut(true);
          await new Promise(resolve => setTimeout(resolve, 1000));
          if (!isMounted) return;
          if (onComplete) onComplete();
        } else {
          setStatus('controlled_error');
          setMessage(`Error en la instalación: ${result.message}`);
        }
      } catch (err) {
        if (!isMounted) return;
        setStatus('controlled_error');
        setMessage(`Error interno: ${err}`);
      }
    };
    
    setupListener().then(() => {
      runInstaller();
    });
    
    return () => {
      isMounted = false;
      if (unlisten) unlisten();
    };
  }, [onComplete]);

  return (
    <div className={`splash-container ${fadingOut ? 'fading-out' : ''}`} data-tauri-drag-region>
      <img src={ghostImg} alt="Entity Ghost" className="splash-ghost" data-tauri-drag-region />
      <h1 className="splash-title" data-tauri-drag-region>ENTITY</h1>
      <div className="splash-status">{message}</div>
    </div>
  );
};

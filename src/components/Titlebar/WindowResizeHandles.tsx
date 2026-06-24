import { useEffect, useState } from 'react';
import { checkIsTauri } from '../../utils/isTauri';
import './WindowResizeHandles.css';

export function WindowResizeHandles() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [appWindow, setAppWindow] = useState<any>(null);

  useEffect(() => {
    if (checkIsTauri()) {
      import('@tauri-apps/api/window').then(({ getCurrentWindow }) => {
        setAppWindow(getCurrentWindow());
      });
    }
  }, []);

  useEffect(() => {
    const attach = (className: string, direction: string) => {
      const el = document.querySelector(`.resize-handle.${className}`);
      const handler = (e: Event) => {
        const mouseEvent = e as MouseEvent;
        if (mouseEvent.button === 0 && appWindow) {
          mouseEvent.stopPropagation();
          mouseEvent.preventDefault();
          appWindow.startResizeDragging(direction).catch((err: unknown) => console.error("Resize error:", err));
        }
      };
      if (el) el.addEventListener('mousedown', handler);
      return () => {
        if (el) el.removeEventListener('mousedown', handler);
      };
    };

    const cleanups = [
      attach('n', 'North'),
      attach('s', 'South'),
      attach('e', 'East'),
      attach('w', 'West'),
      attach('ne', 'NorthEast'),
      attach('nw', 'NorthWest'),
      attach('se', 'SouthEast'),
      attach('sw', 'SouthWest')
    ];

    return () => cleanups.forEach(c => c());
  }, [appWindow]);

  if (!checkIsTauri()) return null;

  return (
    <>
      <div className="resize-handle n" />
      <div className="resize-handle s" />
      <div className="resize-handle e" />
      <div className="resize-handle w" />
      <div className="resize-handle ne" />
      <div className="resize-handle nw" />
      <div className="resize-handle se" />
      <div className="resize-handle sw" />
    </>
  );
}

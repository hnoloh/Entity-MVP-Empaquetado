import { describe, it, expect, beforeEach } from 'vitest';
import { openChatWindowFlow } from '../openChatWindowFlow';
import { createChatWindowRegistry, type ChatWindowRegistry } from '../ChatWindowRegistry';
import * as fs from 'fs';
import * as path from 'path';

describe('openChatWindowFlow - RV-04/FIA-003', () => {
  let registry: ChatWindowRegistry;

  beforeEach(() => {
    registry = createChatWindowRegistry();
  });

  it('TEST-FIA003-01: crea ChatWindow visible con windowId, chatId y geometry', () => {
    const win = openChatWindowFlow('chat-1', registry, 'win-1', { x: 10, y: 20, width: 100, height: 100 });
    expect(win.windowId).toBe('win-1');
    expect(win.chatId).toBe('chat-1');
    expect(win.state).toBe('visible');
    expect(win.geometry.x).toBe(10);
  });

  it('TEST-FIA003-02: la ChatWindow queda registrada en ChatWindowRegistry', () => {
    openChatWindowFlow('chat-1', registry, 'win-1');
    const retrieved = registry.getByWindowId('win-1');
    expect(retrieved).not.toBeNull();
    expect(retrieved?.chatId).toBe('chat-1');
    // Generación automática de uuid si no se especifica windowId
    const autoWin = openChatWindowFlow('chat-2', registry);
    expect(autoWin.windowId).toBeDefined();
    expect(registry.getByWindowId(autoWin.windowId)).not.toBeNull();
  });

  it('TEST-FIA003-03: chatId vacío produce rechazo controlado', () => {
    expect(() => openChatWindowFlow('', registry)).toThrow(/chatId is required/);
    expect(registry.list().length).toBe(0); // Sin mutación
  });

  it('TEST-FIA003-04: registry ausente produce rechazo controlado', () => {
    // @ts-expect-error - testing invalid args
    expect(() => openChatWindowFlow('chat-1', null)).toThrow(/ChatWindowRegistry is required/);
  });

  it('TEST-FIA003-05: windowId duplicado produce rechazo por contrato', () => {
    openChatWindowFlow('chat-1', registry, 'win-1');
    expect(() => openChatWindowFlow('chat-2', registry, 'win-1')).toThrow(/already registered/);
  });

  it('TEST-FIA003-06: abrir ventana no incluye datos conversacionales', () => {
    const win = openChatWindowFlow('chat-1', registry);
    const keys = Object.keys(win);
    expect(keys).not.toContain('history');
    expect(keys).not.toContain('messages');
    expect(keys).not.toContain('owner');
    expect(keys).not.toContain('runtime');
  });

  it('TEST-FIA003-07: múltiples ventanas para el mismo chatId comparten chatId pero distinto windowId', () => {
    const win1 = openChatWindowFlow('chat-1', registry, 'win-1');
    const win2 = openChatWindowFlow('chat-1', registry, 'win-2');
    
    expect(win1.chatId).toBe('chat-1');
    expect(win2.chatId).toBe('chat-1');
    expect(win1.windowId).not.toBe(win2.windowId);
    expect(registry.list().length).toBe(2);
  });

  it('TEST-FIA003-08: lecturas del registry siguen siendo defensivas tras apertura', () => {
    const win = openChatWindowFlow('chat-1', registry, 'win-1');
    win.geometry.x = 999; // Intento de mutación sobre la referencia devuelta
    const fromRegistry = registry.getByWindowId('win-1');
    expect(fromRegistry?.geometry.x).not.toBe(999);
  });

  it('TEST-FIA003-09 & 10: Anti-drift y forbidden units', () => {
    const code = fs.readFileSync(path.join(__dirname, '../openChatWindowFlow.ts'), 'utf-8');
    
    // No imports UI
    expect(code).not.toContain('WorkspaceShell');
    expect(code).not.toContain('WorkbenchRegion');
    expect(code).not.toContain('ChatView');
    
    // No persistencia ni window manager
    expect(code).not.toContain('localStorage');
    expect(code).not.toContain('WindowManager');
    expect(code).not.toContain('Runtime');
    expect(code).not.toContain('PromptEngine');
    expect(code).not.toContain('BrainProvider');
  });
});

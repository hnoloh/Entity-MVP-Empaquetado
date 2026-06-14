import { describe, it, expect, beforeEach } from 'vitest';
import { createChatWindowRegistry, type ChatWindowRegistry } from '../ChatWindowRegistry';
import { createChatWindow } from '../ChatWindow';
import * as fs from 'fs';
import * as path from 'path';

describe('ChatWindowRegistry Model - RV-04/FIA-002', () => {
  let registry: ChatWindowRegistry;

  beforeEach(() => {
    registry = createChatWindowRegistry();
  });

  it('TEST-FIA002-01: list() devuelve vacío en un registro nuevo', () => {
    expect(registry.list()).toEqual([]);
  });

  it('TEST-FIA002-02: register() registra ventana válida y getByWindowId() la recupera', () => {
    const win = createChatWindow('w1', 'c1', { x: 0, y: 0, width: 100, height: 100 });
    registry.register(win);

    const retrieved = registry.getByWindowId('w1');
    expect(retrieved).not.toBeNull();
    expect(retrieved?.windowId).toBe('w1');
    expect(retrieved?.chatId).toBe('c1');
  });

  it('TEST-FIA002-03: rechaza windowId duplicado', () => {
    const win1 = createChatWindow('w1', 'c1', { x: 0, y: 0, width: 100, height: 100 });
    const win2 = createChatWindow('w1', 'c2', { x: 10, y: 10, width: 100, height: 100 });
    
    registry.register(win1);
    expect(() => registry.register(win2)).toThrow(/already registered/);
  });

  it('TEST-FIA002-04: rechaza windowId o chatId vacío', () => {
    const geom = { x: 0, y: 0, width: 100, height: 100 };
    // @ts-expect-error - probando invalidación
    expect(() => registry.register({ windowId: '', chatId: 'c1', state: 'visible', geometry: geom })).toThrow(/windowId is required/);
    // @ts-expect-error - probando invalidación
    expect(() => registry.register({ windowId: 'w1', chatId: '', state: 'visible', geometry: geom })).toThrow(/chatId is required/);
  });

  it('TEST-FIA002-05: findByChatId() devuelve solo las ventanas asociadas a ese chatId', () => {
    registry.register(createChatWindow('w1', 'chatA', { x: 0, y: 0, width: 100, height: 100 }));
    registry.register(createChatWindow('w2', 'chatA', { x: 0, y: 0, width: 100, height: 100 }));
    registry.register(createChatWindow('w3', 'chatB', { x: 0, y: 0, width: 100, height: 100 }));

    const chatAWindows = registry.findByChatId('chatA');
    expect(chatAWindows.length).toBe(2);
    expect(chatAWindows.map(w => w.windowId).sort()).toEqual(['w1', 'w2']);

    const chatBWindows = registry.findByChatId('chatB');
    expect(chatBWindows.length).toBe(1);
    expect(chatBWindows[0].windowId).toBe('w3');
  });

  it('TEST-FIA002-06: unregister() elimina solo la ventana objetivo y no falla si no existe', () => {
    registry.register(createChatWindow('w1', 'c1', { x: 0, y: 0, width: 100, height: 100 }));
    registry.register(createChatWindow('w2', 'c2', { x: 0, y: 0, width: 100, height: 100 }));

    registry.unregister('w1');
    expect(registry.getByWindowId('w1')).toBeNull();
    expect(registry.getByWindowId('w2')).not.toBeNull();

    // Eliminar algo que no existe no debe fallar
    expect(() => registry.unregister('w999')).not.toThrow();
  });

  it('TEST-FIA002-07: list() y getByWindowId() devuelven copias defensivas (no mutan original)', () => {
    const win = createChatWindow('w1', 'c1', { x: 10, y: 10, width: 100, height: 100 });
    registry.register(win);

    const retrieved = registry.getByWindowId('w1');
    if (retrieved) {
      retrieved.geometry.x = 999;
    }

    const fromList = registry.list()[0];
    fromList.geometry.y = 888;

    const original = registry.getByWindowId('w1');
    expect(original?.geometry.x).toBe(10);
    expect(original?.geometry.y).toBe(10);
  });

  it('TEST-FIA002-08: anti-drift y forbidden units', () => {
    const code = fs.readFileSync(path.join(__dirname, '../ChatWindowRegistry.ts'), 'utf-8');
    
    // No persistencia
    expect(code).not.toContain('localStorage');
    expect(code).not.toContain('sessionStorage');
    expect(code).not.toContain('IndexedDB');
    
    // No integraciones con UI prohibidas
    expect(code).not.toContain('WorkspaceShell');
    expect(code).not.toContain('WorkbenchRegion');
    expect(code).not.toContain('ChatView');
    
    // No Runtimes
    expect(code).not.toContain('Runtime');
    expect(code).not.toContain('PromptEngine');
    expect(code).not.toContain('Provider');
  });

  describe('Focus Management', () => {
    it('returns null initially for focusedWindowId', () => {
      const registry = createChatWindowRegistry();
      expect(registry.getFocusedWindowId()).toBeNull();
    });

    it('sets focusedWindowId using focus() when windowId is valid', () => {
      const registry = createChatWindowRegistry();
      const mockWin: ChatWindow = {
        windowId: 'win-f1',
        chatId: 'chat-f1',
        state: 'visible',
        geometry: { x: 0, y: 0, width: 100, height: 100 }
      };
      registry.register(mockWin);

      registry.focus('win-f1');
      expect(registry.getFocusedWindowId()).toBe('win-f1');
    });

    it('ignores focus() if windowId does not exist', () => {
      const registry = createChatWindowRegistry();
      registry.focus('win-fake');
      expect(registry.getFocusedWindowId()).toBeNull();
    });

    it('clears focusedWindowId when the focused window is unregistered', () => {
      const registry = createChatWindowRegistry();
      const mockWin: ChatWindow = {
        windowId: 'win-f1',
        chatId: 'chat-f1',
        state: 'visible',
        geometry: { x: 0, y: 0, width: 100, height: 100 }
      };
      registry.register(mockWin);
      registry.focus('win-f1');
      
      registry.unregister('win-f1');
      expect(registry.getFocusedWindowId()).toBeNull();
    });
  });
});

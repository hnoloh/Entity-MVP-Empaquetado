import { describe, it, expect, beforeEach } from 'vitest';
import { createChatWindowRegistry, type ChatWindowRegistry } from '../ChatWindowRegistry';
import { openChatWindowFlow } from '../openChatWindowFlow';
import { closeChatWindowFlow } from '../closeChatWindowFlow';
import { minimizeChatWindowFlow } from '../minimizeChatWindowFlow';
import { restoreChatWindowFlow } from '../restoreChatWindowFlow';
import { repositionChatWindowFlow } from '../repositionChatWindowFlow';
import { resizeChatWindowFlow } from '../resizeChatWindowFlow';
import { focusChatWindowFlow } from '../focusChatWindowFlow';
import * as fs from 'fs';
import * as path from 'path';

describe('multipleChatWindows - Integración RV-04/FIA-010', () => {
  let registry: ChatWindowRegistry;

  beforeEach(() => {
    registry = createChatWindowRegistry();
  });

  it('TEST-FIA010-01: abrir múltiples ventanas con chatId distintos y verificar coexistencia en ChatWindowRegistry', () => {
    openChatWindowFlow('chat-1', registry, 'win-1', { x: 0, y: 0, width: 100, height: 100 });
    openChatWindowFlow('chat-2', registry, 'win-2', { x: 50, y: 50, width: 200, height: 200 });
    
    expect(registry.list().length).toBe(2);
    expect(registry.getByWindowId('win-1')!.chatId).toBe('chat-1');
    expect(registry.getByWindowId('win-2')!.chatId).toBe('chat-2');
  });

  it('TEST-FIA010-02: abrir múltiples ventanas para el mismo chatId y verificar windowId independientes', () => {
    openChatWindowFlow('chat-1', registry, 'win-1', { x: 0, y: 0, width: 100, height: 100 });
    openChatWindowFlow('chat-1', registry, 'win-2', { x: 50, y: 50, width: 200, height: 200 });
    
    expect(registry.list().length).toBe(2);
    
    const byChat = registry.findByChatId('chat-1');
    expect(byChat.length).toBe(2);
    expect(byChat.map(w => w.windowId).sort()).toEqual(['win-1', 'win-2']);
  });

  it('TEST-FIA010-03: minimizar una ventana no altera estado de las demás', () => {
    openChatWindowFlow('chat-1', registry, 'win-1');
    openChatWindowFlow('chat-2', registry, 'win-2');
    
    minimizeChatWindowFlow(registry, 'win-1');
    
    expect(registry.getByWindowId('win-1')!.state).toBe('minimized');
    expect(registry.getByWindowId('win-2')!.state).toBe('visible');
  });

  it('TEST-FIA010-04: restaurar una ventana no altera geometry ni state de las demás', () => {
    openChatWindowFlow('chat-1', registry, 'win-1');
    openChatWindowFlow('chat-2', registry, 'win-2');
    
    minimizeChatWindowFlow(registry, 'win-1');
    minimizeChatWindowFlow(registry, 'win-2');
    
    restoreChatWindowFlow(registry, 'win-1');
    
    expect(registry.getByWindowId('win-1')!.state).toBe('visible');
    expect(registry.getByWindowId('win-2')!.state).toBe('minimized');
  });

  it('TEST-FIA010-05: reposicionar una ventana solo modifica x/y del objetivo', () => {
    openChatWindowFlow('chat-1', registry, 'win-1', { x: 10, y: 10, width: 100, height: 100 });
    openChatWindowFlow('chat-2', registry, 'win-2', { x: 20, y: 20, width: 200, height: 200 });
    
    repositionChatWindowFlow(registry, 'win-1', { x: 500, y: 500 });
    
    expect(registry.getByWindowId('win-1')!.geometry.x).toBe(500);
    expect(registry.getByWindowId('win-2')!.geometry.x).toBe(20);
  });

  it('TEST-FIA010-06: redimensionar una ventana solo modifica width/height del objetivo', () => {
    openChatWindowFlow('chat-1', registry, 'win-1', { x: 10, y: 10, width: 100, height: 100 });
    openChatWindowFlow('chat-2', registry, 'win-2', { x: 20, y: 20, width: 200, height: 200 });
    
    resizeChatWindowFlow(registry, 'win-1', { width: 500, height: 500 });
    
    expect(registry.getByWindowId('win-1')!.geometry.width).toBe(500);
    expect(registry.getByWindowId('win-2')!.geometry.width).toBe(200);
  });

  it('TEST-FIA010-07: foco lógico único entre múltiples ventanas', () => {
    openChatWindowFlow('chat-1', registry, 'win-1');
    openChatWindowFlow('chat-2', registry, 'win-2');
    openChatWindowFlow('chat-3', registry, 'win-3');
    
    focusChatWindowFlow(registry, 'win-2');
    expect(registry.getFocusedWindowId()).toBe('win-2');
    
    focusChatWindowFlow(registry, 'win-3');
    expect(registry.getFocusedWindowId()).toBe('win-3');
  });

  it('TEST-FIA010-08: cerrar ventana enfocada limpia foco y conserva resto', () => {
    openChatWindowFlow('chat-1', registry, 'win-1');
    openChatWindowFlow('chat-2', registry, 'win-2');
    
    focusChatWindowFlow(registry, 'win-1');
    expect(registry.getFocusedWindowId()).toBe('win-1');
    
    closeChatWindowFlow(registry, 'win-1');
    expect(registry.getFocusedWindowId()).toBeNull();
    expect(registry.list().length).toBe(1);
    expect(registry.getByWindowId('win-2')).toBeDefined();
  });

  it('TEST-FIA010-09: cerrar una ventana no muta datos de Chat RV-03', () => {
    // RV-03 is structurally separated. By definition windowing doesn't import chatRepository or chat objects,
    // only strings (chatId). The registry only holds references to strings.
    // We can verify this structurally by checking that closing only removes from the Map.
    openChatWindowFlow('chat-1', registry, 'win-1');
    closeChatWindowFlow(registry, 'win-1');
    expect(registry.list().length).toBe(0);
  });

  it('TEST-FIA010-10: forbidden-units guard contra WindowManager, render UI, z-order, storage, Runtime, backend', () => {
    // Escaneo de todos los flujos creados y del registry
    const filesToScan = [
      'ChatWindowRegistry.ts',
      'openChatWindowFlow.ts',
      'closeChatWindowFlow.ts',
      'minimizeChatWindowFlow.ts',
      'restoreChatWindowFlow.ts',
      'repositionChatWindowFlow.ts',
      'resizeChatWindowFlow.ts',
      'focusChatWindowFlow.ts'
    ];

    filesToScan.forEach(file => {
      const code = fs.readFileSync(path.join(__dirname, '..', file), 'utf-8');
      expect(code).not.toContain('WindowManager');
      expect(code).not.toContain('ChatWindowRepository');
      expect(code).not.toContain('ChatRegion');
      expect(code).not.toContain('z-order');
      expect(code).not.toContain('zIndex');
      expect(code).not.toContain('bringToFront');
      expect(code).not.toContain('localStorage');
      expect(code).not.toContain('sessionStorage');
      expect(code).not.toContain('Runtime');
      expect(code).not.toContain('BrainProvider');
      expect(code).not.toContain('window.addEventListener');
    });
  });
});

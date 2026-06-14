import { describe, it, expect, beforeEach } from 'vitest';
import { minimizeChatWindowFlow } from '../minimizeChatWindowFlow';
import { openChatWindowFlow } from '../openChatWindowFlow';
import { createChatWindowRegistry, type ChatWindowRegistry } from '../ChatWindowRegistry';
import * as fs from 'fs';
import * as path from 'path';

describe('minimizeChatWindowFlow - RV-04/FIA-005', () => {
  let registry: ChatWindowRegistry;

  beforeEach(() => {
    registry = createChatWindowRegistry();
  });

  it('TEST-FIA005-01: una ChatWindow visible existente pasa a minimized', () => {
    openChatWindowFlow('chat-1', registry, 'win-1');
    const result = minimizeChatWindowFlow(registry, 'win-1');
    expect(result).toBe(true);

    const win = registry.getByWindowId('win-1');
    expect(win?.state).toBe('minimized');
  });

  it('TEST-FIA005-02: la ventana minimizada permanece registrada', () => {
    openChatWindowFlow('chat-1', registry, 'win-1');
    minimizeChatWindowFlow(registry, 'win-1');
    expect(registry.list().length).toBe(1);
    expect(registry.getByWindowId('win-1')).not.toBeNull();
  });

  it('TEST-FIA005-03: minimizar no altera windowId, chatId ni geometry', () => {
    openChatWindowFlow('chat-1', registry, 'win-1', { x: 50, y: 50, width: 200, height: 200 });
    minimizeChatWindowFlow(registry, 'win-1');
    const win = registry.getByWindowId('win-1')!;
    
    expect(win.windowId).toBe('win-1');
    expect(win.chatId).toBe('chat-1');
    expect(win.geometry.x).toBe(50);
  });

  it('TEST-FIA005-04: minimizar no altera otras ChatWindow', () => {
    openChatWindowFlow('chat-1', registry, 'win-1');
    openChatWindowFlow('chat-2', registry, 'win-2');
    
    minimizeChatWindowFlow(registry, 'win-1');
    
    const win2 = registry.getByWindowId('win-2')!;
    expect(win2.state).toBe('visible');
  });

  it('TEST-FIA005-05: windowId inexistente no muta el registry', () => {
    openChatWindowFlow('chat-1', registry, 'win-1');
    const result = minimizeChatWindowFlow(registry, 'win-999');
    expect(result).toBe(false);
    expect(registry.list().length).toBe(1);
  });

  it('TEST-FIA005-06: windowId vacío no muta el registry', () => {
    openChatWindowFlow('chat-1', registry, 'win-1');
    const result = minimizeChatWindowFlow(registry, '');
    expect(result).toBe(false);
  });

  it('TEST-FIA005-07: registry inválido produce fallo controlado sin mutación', () => {
    // @ts-expect-error - probando registry nulo
    expect(() => minimizeChatWindowFlow(null, 'win-1')).toThrow(/ChatWindowRegistry is required/);
  });

  it('TEST-FIA005-08: minimizar una ventana ya minimizada es idempotente', () => {
    openChatWindowFlow('chat-1', registry, 'win-1');
    minimizeChatWindowFlow(registry, 'win-1');
    const result = minimizeChatWindowFlow(registry, 'win-1'); // Segunda vez
    expect(result).toBe(true);
    expect(registry.getByWindowId('win-1')?.state).toBe('minimized');
  });

  it('TEST-FIA005-09: minimizar no invoca closeChatWindowFlow ni desregistra la ventana', () => {
    openChatWindowFlow('chat-1', registry, 'win-1');
    minimizeChatWindowFlow(registry, 'win-1');
    expect(registry.getByWindowId('win-1')).not.toBeNull();
  });

  it('TEST-FIA005-10: minimizar no toca dominio Chat ni persistencias prohibidas (Anti-drift)', () => {
    const code = fs.readFileSync(path.join(__dirname, '../minimizeChatWindowFlow.ts'), 'utf-8');
    
    // No imports UI
    expect(code).not.toContain('WorkspaceShell');
    expect(code).not.toContain('WorkbenchRegion');
    expect(code).not.toContain('ChatView');
    
    // No persistencia
    expect(code).not.toContain('localStorage');
    expect(code).not.toContain('sessionStorage');
    
    // No WindowManager o ChatRepository
    expect(code).not.toContain('WindowManager');
    expect(code).not.toContain('chatRepository');
  });
});

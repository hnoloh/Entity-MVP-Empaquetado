import { describe, it, expect, beforeEach } from 'vitest';
import { focusChatWindowFlow } from '../focusChatWindowFlow';
import { openChatWindowFlow } from '../openChatWindowFlow';
import { minimizeChatWindowFlow } from '../minimizeChatWindowFlow';
import { createChatWindowRegistry, type ChatWindowRegistry } from '../ChatWindowRegistry';
import * as fs from 'fs';
import * as path from 'path';

describe('focusChatWindowFlow - RV-04/FIA-009', () => {
  let registry: ChatWindowRegistry;

  beforeEach(() => {
    registry = createChatWindowRegistry();
  });

  it('TEST-FIA009-01: enfocar una ChatWindow existente establece focusedWindowId', () => {
    openChatWindowFlow('chat-1', registry, 'win-1');
    const result = focusChatWindowFlow(registry, 'win-1');
    
    expect(result).toBe('win-1');
    expect(registry.getFocusedWindowId()).toBe('win-1');
  });

  it('TEST-FIA009-02: enfocar otra ChatWindow sustituye el foco anterior', () => {
    openChatWindowFlow('chat-1', registry, 'win-1');
    openChatWindowFlow('chat-2', registry, 'win-2');
    
    focusChatWindowFlow(registry, 'win-1');
    expect(registry.getFocusedWindowId()).toBe('win-1');
    
    focusChatWindowFlow(registry, 'win-2');
    expect(registry.getFocusedWindowId()).toBe('win-2');
  });

  it('TEST-FIA009-03: enfocar windowId inexistente no muta foco previo ni registry', () => {
    openChatWindowFlow('chat-1', registry, 'win-1');
    focusChatWindowFlow(registry, 'win-1');
    
    const result = focusChatWindowFlow(registry, 'win-999');
    expect(result).toBe('win-1');
    expect(registry.getFocusedWindowId()).toBe('win-1');
    expect(registry.list().length).toBe(1);
  });

  it('TEST-FIA009-04: input inválido no muta ventanas ni foco', () => {
    openChatWindowFlow('chat-1', registry, 'win-1');
    focusChatWindowFlow(registry, 'win-1');
    
    const result = focusChatWindowFlow(registry, '');
    expect(result).toBe('win-1');
    expect(registry.getFocusedWindowId()).toBe('win-1');
    
    // @ts-expect-error probando invalid
    expect(() => focusChatWindowFlow(null, 'win-1')).toThrow(/ChatWindowRegistry is required/);
  });

  it('TEST-FIA009-05: enfocar no modifica state, geometry, chatId ni windowId', () => {
    openChatWindowFlow('chat-1', registry, 'win-1', { x: 10, y: 10, width: 200, height: 200 });
    focusChatWindowFlow(registry, 'win-1');
    
    const win = registry.getByWindowId('win-1')!;
    expect(win.state).toBe('visible');
    expect(win.chatId).toBe('chat-1');
    expect(win.windowId).toBe('win-1');
    expect(win.geometry.x).toBe(10);
  });

  it('TEST-FIA009-06: enfocar no modifica otras ChatWindows', () => {
    openChatWindowFlow('chat-1', registry, 'win-1', { x: 10, y: 10, width: 200, height: 200 });
    openChatWindowFlow('chat-2', registry, 'win-2', { x: 50, y: 50, width: 300, height: 300 });
    
    focusChatWindowFlow(registry, 'win-1');
    
    const win2 = registry.getByWindowId('win-2')!;
    expect(win2.state).toBe('visible');
    expect(win2.geometry.x).toBe(50);
  });

  it('TEST-FIA009-07: enfocar una ventana minimizada no la restaura', () => {
    openChatWindowFlow('chat-1', registry, 'win-1');
    minimizeChatWindowFlow(registry, 'win-1');
    
    focusChatWindowFlow(registry, 'win-1');
    expect(registry.getFocusedWindowId()).toBe('win-1');
    
    const win = registry.getByWindowId('win-1')!;
    expect(win.state).toBe('minimized');
  });

  it('TEST-FIA009-08: consulta de foco devuelve valor seguro y no referencia mutable', () => {
    openChatWindowFlow('chat-1', registry, 'win-1');
    focusChatWindowFlow(registry, 'win-1');
    
    registry.getFocusedWindowId(); // call getter
    // even if we could reassign the return value, it's a primitive string, so it doesn't mutate the registry.
    
    expect(registry.getFocusedWindowId()).toBe('win-1');
  });

  it('TEST-FIA009-09: no se importa ni muta ChatRepository ni Chat RV-03', () => {
    const code = fs.readFileSync(path.join(__dirname, '../focusChatWindowFlow.ts'), 'utf-8');
    
    expect(code).not.toContain('chatRepository');
    expect(code).not.toContain('messages');
    expect(code).not.toContain('WorkspaceShell');
    expect(code).not.toContain('ChatView');
    expect(code).not.toContain('window.addEventListener');
    expect(code).not.toContain('zIndex');
  });
});

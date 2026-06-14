import { describe, it, expect, beforeEach } from 'vitest';
import { resizeChatWindowFlow } from '../resizeChatWindowFlow';
import { openChatWindowFlow } from '../openChatWindowFlow';
import { createChatWindowRegistry, type ChatWindowRegistry } from '../ChatWindowRegistry';
import * as fs from 'fs';
import * as path from 'path';

describe('resizeChatWindowFlow - RV-04/FIA-008', () => {
  let registry: ChatWindowRegistry;

  beforeEach(() => {
    registry = createChatWindowRegistry();
  });

  it('TEST-FIA008-01: redimensiona una ChatWindow visible y actualiza solo width/height', () => {
    openChatWindowFlow('chat-1', registry, 'win-1', { x: 50, y: 50, width: 200, height: 200 });
    const result = resizeChatWindowFlow(registry, 'win-1', { width: 400, height: 500 });
    expect(result).toBe(true);

    const win = registry.getByWindowId('win-1')!;
    expect(win.geometry.width).toBe(400);
    expect(win.geometry.height).toBe(500);
  });

  it('TEST-FIA008-02: preserva geometry.x/y', () => {
    openChatWindowFlow('chat-1', registry, 'win-1', { x: 50, y: 50, width: 200, height: 200 });
    resizeChatWindowFlow(registry, 'win-1', { width: 400, height: 500 });
    
    const win = registry.getByWindowId('win-1')!;
    expect(win.geometry.x).toBe(50);
    expect(win.geometry.y).toBe(50);
  });

  it('TEST-FIA008-03: preserva windowId y chatId', () => {
    openChatWindowFlow('chat-1', registry, 'win-1', { x: 50, y: 50, width: 200, height: 200 });
    resizeChatWindowFlow(registry, 'win-1', { width: 400, height: 500 });
    
    const win = registry.getByWindowId('win-1')!;
    expect(win.windowId).toBe('win-1');
    expect(win.chatId).toBe('chat-1');
  });

  it('TEST-FIA008-04: preserva state', () => {
    openChatWindowFlow('chat-1', registry, 'win-1');
    resizeChatWindowFlow(registry, 'win-1', { width: 400, height: 500 });
    expect(registry.getByWindowId('win-1')!.state).toBe('visible');
  });

  it('TEST-FIA008-05: no modifica otras ChatWindows registradas', () => {
    openChatWindowFlow('chat-1', registry, 'win-1', { x: 0, y: 0, width: 200, height: 200 });
    openChatWindowFlow('chat-2', registry, 'win-2', { x: 0, y: 0, width: 100, height: 100 });
    
    resizeChatWindowFlow(registry, 'win-1', { width: 999, height: 999 });
    
    const win2 = registry.getByWindowId('win-2')!;
    expect(win2.geometry.width).toBe(100);
    expect(win2.geometry.height).toBe(100);
  });

  it('TEST-FIA008-06: no muta ante windowId vacío o inexistente', () => {
    openChatWindowFlow('chat-1', registry, 'win-1', { x: 0, y: 0, width: 200, height: 200 });
    expect(resizeChatWindowFlow(registry, '', { width: 100, height: 100 })).toBe(false);
    expect(resizeChatWindowFlow(registry, 'win-999', { width: 100, height: 100 })).toBe(false);
    
    expect(registry.list().length).toBe(1);
    expect(registry.getByWindowId('win-1')!.geometry.width).toBe(200);
  });

  it('TEST-FIA008-07: no muta ante registry inválido', () => {
    // @ts-expect-error test
    expect(() => resizeChatWindowFlow(null, 'win-1', { width: 100, height: 100 })).toThrow(/ChatWindowRegistry is required/);
  });

  it('TEST-FIA008-08: no muta ante width/height nulos, NaN, infinitos, negativos o no numéricos', () => {
    openChatWindowFlow('chat-1', registry, 'win-1', { x: 0, y: 0, width: 200, height: 200 });
    
    // @ts-expect-error test
    expect(resizeChatWindowFlow(registry, 'win-1', null)).toBe(false);
    // @ts-expect-error test
    expect(resizeChatWindowFlow(registry, 'win-1', { width: 100 })).toBe(false);
    expect(resizeChatWindowFlow(registry, 'win-1', { width: NaN, height: 100 })).toBe(false);
    expect(resizeChatWindowFlow(registry, 'win-1', { width: 100, height: Infinity })).toBe(false);
    expect(resizeChatWindowFlow(registry, 'win-1', { width: -10, height: 100 })).toBe(false);
    // @ts-expect-error test
    expect(resizeChatWindowFlow(registry, 'win-1', { width: '100', height: 100 })).toBe(false);

    expect(registry.getByWindowId('win-1')!.geometry.width).toBe(200);
  });

  it('TEST-FIA008-09: mantiene lecturas defensivas/inmutabilidad del registro después del resize', () => {
    openChatWindowFlow('chat-1', registry, 'win-1', { x: 0, y: 0, width: 200, height: 200 });
    
    const size = { width: 500, height: 500 };
    resizeChatWindowFlow(registry, 'win-1', size);
    
    const win = registry.getByWindowId('win-1')!;
    win.geometry.width = 999; // Intento de mutación externa
    
    expect(registry.getByWindowId('win-1')!.geometry.width).toBe(500);
  });

  it('TEST-FIA008-10: no importa ni toca ChatRepository, ChatView, Workspace o Runtime (Anti-drift)', () => {
    const code = fs.readFileSync(path.join(__dirname, '../resizeChatWindowFlow.ts'), 'utf-8');
    
    expect(code).not.toContain('chatRepository');
    expect(code).not.toContain('messages');
    expect(code).not.toContain('WorkspaceShell');
    expect(code).not.toContain('ChatView');
    expect(code).not.toContain('window.addEventListener');
  });
});

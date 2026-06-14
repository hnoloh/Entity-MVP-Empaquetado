import { describe, it, expect, beforeEach } from 'vitest';
import { restoreChatWindowFlow } from '../restoreChatWindowFlow';
import { openChatWindowFlow } from '../openChatWindowFlow';
import { minimizeChatWindowFlow } from '../minimizeChatWindowFlow';
import { createChatWindowRegistry, type ChatWindowRegistry } from '../ChatWindowRegistry';
import * as fs from 'fs';
import * as path from 'path';

describe('restoreChatWindowFlow - RV-04/FIA-006', () => {
  let registry: ChatWindowRegistry;

  beforeEach(() => {
    registry = createChatWindowRegistry();
  });

  it('TEST-FIA006-01: restaura ChatWindow minimized a visible', () => {
    openChatWindowFlow('chat-1', registry, 'win-1');
    minimizeChatWindowFlow(registry, 'win-1');
    
    expect(registry.getByWindowId('win-1')?.state).toBe('minimized');
    
    const result = restoreChatWindowFlow(registry, 'win-1');
    expect(result).toBe(true);

    const win = registry.getByWindowId('win-1');
    expect(win?.state).toBe('visible');
  });

  it('TEST-FIA006-02: preserva windowId, chatId y geometry', () => {
    openChatWindowFlow('chat-1', registry, 'win-1', { x: 50, y: 50, width: 200, height: 200 });
    minimizeChatWindowFlow(registry, 'win-1');
    restoreChatWindowFlow(registry, 'win-1');
    
    const win = registry.getByWindowId('win-1')!;
    
    expect(win.windowId).toBe('win-1');
    expect(win.chatId).toBe('chat-1');
    expect(win.geometry.x).toBe(50);
  });

  it('TEST-FIA006-03: no muta Chat subyacente ni copia datos conversacionales (Anti-drift)', () => {
    const code = fs.readFileSync(path.join(__dirname, '../restoreChatWindowFlow.ts'), 'utf-8');
    
    expect(code).not.toContain('chatRepository');
    expect(code).not.toContain('messages');
    expect(code).not.toContain('history');
  });

  it('TEST-FIA006-04: no muta otras ChatWindows', () => {
    openChatWindowFlow('chat-1', registry, 'win-1');
    openChatWindowFlow('chat-2', registry, 'win-2');
    minimizeChatWindowFlow(registry, 'win-1');
    minimizeChatWindowFlow(registry, 'win-2');
    
    restoreChatWindowFlow(registry, 'win-1');
    
    const win2 = registry.getByWindowId('win-2')!;
    expect(win2.state).toBe('minimized');
  });

  it('TEST-FIA006-05: windowId vacío/inválido no muta registry', () => {
    openChatWindowFlow('chat-1', registry, 'win-1');
    minimizeChatWindowFlow(registry, 'win-1');
    
    const result = restoreChatWindowFlow(registry, '');
    expect(result).toBe(false);
    expect(registry.getByWindowId('win-1')?.state).toBe('minimized');
  });

  it('TEST-FIA006-06: windowId inexistente no muta registry', () => {
    openChatWindowFlow('chat-1', registry, 'win-1');
    const result = restoreChatWindowFlow(registry, 'win-999');
    expect(result).toBe(false);
    expect(registry.list().length).toBe(1);
  });

  it('TEST-FIA006-07: registry ausente/inválido falla controladamente sin mutación', () => {
    // @ts-expect-error - probando registry nulo
    expect(() => restoreChatWindowFlow(null, 'win-1')).toThrow(/ChatWindowRegistry is required/);
  });

  it('TEST-FIA006-08: operación sobre ventana ya visible es idempotente/no destructiva', () => {
    openChatWindowFlow('chat-1', registry, 'win-1');
    const result = restoreChatWindowFlow(registry, 'win-1'); // Ya es visible
    expect(result).toBe(true);
    expect(registry.getByWindowId('win-1')?.state).toBe('visible');
  });

  it('TEST-FIA006-09: operación sobre ventana closed no restaura ni muta', () => {
    // Simulamos un estado closed que por algún motivo siga en registro o intentamos restaurar algo que ya no existe.
    // Como closeChatWindowFlow desregistra, lo probaremos inyectando el estado manualmente a través de update.
    openChatWindowFlow('chat-1', registry, 'win-1');
    const win = registry.getByWindowId('win-1')!;
    win.state = 'closed';
    registry.update(win);
    
    const result = restoreChatWindowFlow(registry, 'win-1');
    expect(result).toBe(false);
    expect(registry.getByWindowId('win-1')?.state).toBe('closed');
  });

  it('TEST-FIA006-10: el registry mantiene defensas contra fuga mutable', () => {
    openChatWindowFlow('chat-1', registry, 'win-1');
    minimizeChatWindowFlow(registry, 'win-1');
    restoreChatWindowFlow(registry, 'win-1');
    
    const win = registry.getByWindowId('win-1')!;
    win.geometry.x = 999; // Mutación externa
    
    const win2 = registry.getByWindowId('win-1')!;
    expect(win2.geometry.x).not.toBe(999); // La mutación no afectó al original
  });
});

import { describe, it, expect, beforeEach } from 'vitest';
import { repositionChatWindowFlow } from '../repositionChatWindowFlow';
import { openChatWindowFlow } from '../openChatWindowFlow';
import { minimizeChatWindowFlow } from '../minimizeChatWindowFlow';
import { createChatWindowRegistry, type ChatWindowRegistry } from '../ChatWindowRegistry';
import * as fs from 'fs';
import * as path from 'path';

describe('repositionChatWindowFlow - RV-04/FIA-007', () => {
  let registry: ChatWindowRegistry;

  beforeEach(() => {
    registry = createChatWindowRegistry();
  });

  it('TEST-FIA007-01: reposiciona una ChatWindow visible actualizando solo geometry.x/y', () => {
    openChatWindowFlow('chat-1', registry, 'win-1', { x: 50, y: 50, width: 200, height: 200 });
    const result = repositionChatWindowFlow(registry, 'win-1', { x: 150, y: 300 });
    expect(result).toBe(true);

    const win = registry.getByWindowId('win-1')!;
    expect(win.geometry.x).toBe(150);
    expect(win.geometry.y).toBe(300);
  });

  it('TEST-FIA007-02: preserva windowId, chatId, state, geometry.width y geometry.height', () => {
    openChatWindowFlow('chat-1', registry, 'win-1', { x: 50, y: 50, width: 200, height: 300 });
    repositionChatWindowFlow(registry, 'win-1', { x: 150, y: 300 });
    
    const win = registry.getByWindowId('win-1')!;
    expect(win.windowId).toBe('win-1');
    expect(win.chatId).toBe('chat-1');
    expect(win.state).toBe('visible');
    expect(win.geometry.width).toBe(200);
    expect(win.geometry.height).toBe(300);
  });

  it('TEST-FIA007-03: no modifica otras ChatWindows', () => {
    openChatWindowFlow('chat-1', registry, 'win-1', { x: 50, y: 50, width: 200, height: 200 });
    openChatWindowFlow('chat-2', registry, 'win-2', { x: 10, y: 10, width: 100, height: 100 });
    
    repositionChatWindowFlow(registry, 'win-1', { x: 99, y: 99 });
    
    const win2 = registry.getByWindowId('win-2')!;
    expect(win2.geometry.x).toBe(10);
    expect(win2.geometry.y).toBe(10);
  });

  it('TEST-FIA007-04: no muta ante windowId vacío', () => {
    openChatWindowFlow('chat-1', registry, 'win-1', { x: 50, y: 50, width: 200, height: 200 });
    const result = repositionChatWindowFlow(registry, '', { x: 100, y: 100 });
    expect(result).toBe(false);
    expect(registry.getByWindowId('win-1')!.geometry.x).toBe(50);
  });

  it('TEST-FIA007-05: no muta ante windowId inexistente', () => {
    openChatWindowFlow('chat-1', registry, 'win-1');
    const result = repositionChatWindowFlow(registry, 'win-999', { x: 100, y: 100 });
    expect(result).toBe(false);
    expect(registry.list().length).toBe(1);
  });

  it('TEST-FIA007-06: no muta ante registry inválido', () => {
    // @ts-expect-error probando input invalido
    expect(() => repositionChatWindowFlow(null, 'win-1', { x: 100, y: 100 })).toThrow(/ChatWindowRegistry is required/);
  });

  it('TEST-FIA007-07: no muta ante posición nula, incompleta, NaN, infinita o no numérica', () => {
    openChatWindowFlow('chat-1', registry, 'win-1', { x: 50, y: 50, width: 200, height: 200 });
    
    // @ts-expect-error test
    expect(repositionChatWindowFlow(registry, 'win-1', null)).toBe(false);
    // @ts-expect-error test
    expect(repositionChatWindowFlow(registry, 'win-1', { x: 100 })).toBe(false);
    // @ts-expect-error test
    expect(repositionChatWindowFlow(registry, 'win-1', { y: 100 })).toBe(false);
    
    expect(repositionChatWindowFlow(registry, 'win-1', { x: NaN, y: 100 })).toBe(false);
    expect(repositionChatWindowFlow(registry, 'win-1', { x: 100, y: Infinity })).toBe(false);
    
    // @ts-expect-error test
    expect(repositionChatWindowFlow(registry, 'win-1', { x: '100', y: 100 })).toBe(false);

    expect(registry.getByWindowId('win-1')!.geometry.x).toBe(50); // Mantuvo el original
  });

  it('TEST-FIA007-08: reposiciona una ventana minimized sin restaurarla automáticamente', () => {
    openChatWindowFlow('chat-1', registry, 'win-1', { x: 50, y: 50, width: 200, height: 200 });
    minimizeChatWindowFlow(registry, 'win-1');
    
    const result = repositionChatWindowFlow(registry, 'win-1', { x: 500, y: 500 });
    expect(result).toBe(true);
    
    const win = registry.getByWindowId('win-1')!;
    expect(win.state).toBe('minimized');
    expect(win.geometry.x).toBe(500);
  });

  it('TEST-FIA007-09: reposiciona una ventana visible sin cambiar su estado', () => {
    openChatWindowFlow('chat-1', registry, 'win-1', { x: 50, y: 50, width: 200, height: 200 });
    repositionChatWindowFlow(registry, 'win-1', { x: 500, y: 500 });
    
    const win = registry.getByWindowId('win-1')!;
    expect(win.state).toBe('visible');
  });

  it('TEST-FIA007-10: mantiene copias defensivas o inmutabilidad tras reposicionar', () => {
    openChatWindowFlow('chat-1', registry, 'win-1', { x: 50, y: 50, width: 200, height: 200 });
    
    const pos = { x: 100, y: 100 };
    repositionChatWindowFlow(registry, 'win-1', pos);
    
    // Si muto pos externamente no debe afectar a la ventana, 
    // pero reposition no guarda pos entera, guarda pos.x/pos.y individualmente
    // Validemos que el registry devuelve una copia defensiva
    const win = registry.getByWindowId('win-1')!;
    win.geometry.x = 999;
    
    expect(registry.getByWindowId('win-1')!.geometry.x).toBe(100);
  });

  it('TEST-FIA007-11: no importa ni muta Chat RV-03 ni UI (Anti-drift)', () => {
    const code = fs.readFileSync(path.join(__dirname, '../repositionChatWindowFlow.ts'), 'utf-8');
    
    expect(code).not.toContain('chatRepository');
    expect(code).not.toContain('messages');
    expect(code).not.toContain('WorkspaceShell');
    expect(code).not.toContain('ChatView');
    expect(code).not.toContain('window.addEventListener');
    expect(code).not.toContain('onPointerDown');
  });
});

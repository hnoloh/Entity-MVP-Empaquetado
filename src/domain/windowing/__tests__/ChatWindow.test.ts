import { describe, it, expect } from 'vitest';
import { createChatWindow, type ChatWindow } from '../ChatWindow';
import * as fs from 'fs';
import * as path from 'path';

describe('ChatWindow Model - RV-04/FIA-001', () => {
  it('TEST-FIA001-01: crea ChatWindow válido con windowId, chatId, state y geometry', () => {
    const geom = { x: 10, y: 20, width: 300, height: 400 };
    const win = createChatWindow('win-1', 'chat-1', geom);
    
    expect(win.windowId).toBe('win-1');
    expect(win.chatId).toBe('chat-1');
    expect(win.state).toBe('visible');
    expect(win.geometry).toEqual(geom);
  });

  it('TEST-FIA001-02: permite estado closed explícito', () => {
    const geom = { x: 0, y: 0, width: 100, height: 100 };
    const win = createChatWindow('w2', 'c2', geom, 'closed');
    expect(win.state).toBe('closed');
  });

  it('TEST-FIA001-03: rechaza windowId o chatId vacío', () => {
    const geom = { x: 0, y: 0, width: 100, height: 100 };
    expect(() => createChatWindow('', 'chat-1', geom)).toThrow('windowId is required');
    expect(() => createChatWindow('   ', 'chat-1', geom)).toThrow('windowId is required');
    expect(() => createChatWindow('win-1', '', geom)).toThrow('chatId is required');
  });

  it('TEST-FIA001-04: rechaza estado fuera de visible | closed', () => {
    const geom = { x: 0, y: 0, width: 100, height: 100 };
    // @ts-expect-error - testing invalid state for runtime validation
    expect(() => createChatWindow('w1', 'c1', geom, 'minimized')).toThrow('state must be visible or closed');
  });

  it('TEST-FIA001-05: geometry no muta el original si se altera el retorno (es clónica superficial)', () => {
    const geom = { x: 10, y: 20, width: 300, height: 400 };
    const win = createChatWindow('w1', 'c1', geom);
    
    win.geometry.x = 999;
    expect(geom.x).toBe(10);
  });

  it('TEST-FIA001-06: ChatWindow no contiene history, owner, ni runtime', () => {
    const win: ChatWindow = createChatWindow('w1', 'c1', { x: 0, y: 0, width: 10, height: 10 });
    const keys = Object.keys(win);
    
    expect(keys).not.toContain('history');
    expect(keys).not.toContain('messages');
    expect(keys).not.toContain('owner');
    expect(keys).not.toContain('draft');
    expect(keys).not.toContain('runtime');
    expect(keys).not.toContain('provider');
    expect(keys).not.toContain('brain');
  });

  it('TEST-FIA001-07: ChatWindow.ts no importa módulos UI ni ChatRepository', () => {
    const code = fs.readFileSync(path.join(__dirname, '../ChatWindow.ts'), 'utf-8');
    expect(code).not.toContain('WorkspaceShell');
    expect(code).not.toContain('WorkbenchRegion');
    expect(code).not.toContain('EntiEditor');
    expect(code).not.toContain('EntitiesColumnRegion');
    expect(code).not.toContain('GhostRegion');
    expect(code).not.toContain('chatRepository');
    expect(code).not.toContain('localStorage');
    expect(code).not.toContain('IndexedDB');
  });
});

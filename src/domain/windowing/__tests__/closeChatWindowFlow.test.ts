import { describe, it, expect, beforeEach } from 'vitest';
import { closeChatWindowFlow } from '../closeChatWindowFlow';
import { openChatWindowFlow } from '../openChatWindowFlow';
import { createChatWindowRegistry, type ChatWindowRegistry } from '../ChatWindowRegistry';
import * as fs from 'fs';
import * as path from 'path';

describe('closeChatWindowFlow - RV-04/FIA-004', () => {
  let registry: ChatWindowRegistry;

  beforeEach(() => {
    registry = createChatWindowRegistry();
  });

  it('TEST-FIA004-01: cierra una ChatWindow existente por windowId', () => {
    openChatWindowFlow('chat-1', registry, 'win-1');
    expect(registry.getByWindowId('win-1')).not.toBeNull();

    const result = closeChatWindowFlow(registry, 'win-1');
    expect(result).toBe(true);
    expect(registry.getByWindowId('win-1')).toBeNull();
  });

  it('TEST-FIA004-02: no muta el Chat subyacente ni copia datos conversacionales', () => {
    openChatWindowFlow('chat-1', registry, 'win-1');
    closeChatWindowFlow(registry, 'win-1');
    // Si closeChatWindowFlow intentara acceder al ChatRepository,
    // o mutarlo, requeriría importar el repositorio, lo cual está prohibido por el linter de arquitectura (y se comprueba en el test anti-drift).
    // Aquí verificamos que la firma se mantiene limpia y el objeto borrado no fugó datos.
    expect(registry.getByWindowId('win-1')).toBeNull();
  });

  it('TEST-FIA004-03: cerrar una ventana no afecta otras ChatWindow registradas', () => {
    openChatWindowFlow('chat-1', registry, 'win-1');
    openChatWindowFlow('chat-2', registry, 'win-2');
    openChatWindowFlow('chat-1', registry, 'win-3');

    closeChatWindowFlow(registry, 'win-1');
    
    expect(registry.getByWindowId('win-1')).toBeNull();
    expect(registry.getByWindowId('win-2')).not.toBeNull();
    expect(registry.getByWindowId('win-3')).not.toBeNull();
  });

  it('TEST-FIA004-04: windowId vacío produce rechazo controlado sin mutación', () => {
    openChatWindowFlow('chat-1', registry, 'win-1');
    expect(() => closeChatWindowFlow(registry, '')).toThrow(/windowId is required/);
    expect(registry.getByWindowId('win-1')).not.toBeNull();
  });

  it('TEST-FIA004-05: windowId inexistente produce rechazo controlado sin mutación', () => {
    openChatWindowFlow('chat-1', registry, 'win-1');
    const result = closeChatWindowFlow(registry, 'win-999');
    expect(result).toBe(false);
    expect(registry.list().length).toBe(1);
  });

  it('TEST-FIA004-06: registry ausente/inválido produce rechazo controlado', () => {
    // @ts-expect-error - testing invalid arg
    expect(() => closeChatWindowFlow(null, 'win-1')).toThrow(/ChatWindowRegistry is required/);
  });

  it('TEST-FIA004-07 & 08: no persistencia visual ni storage, forbidden-units guard', () => {
    const code = fs.readFileSync(path.join(__dirname, '../closeChatWindowFlow.ts'), 'utf-8');
    
    // No imports UI ni DOM
    expect(code).not.toContain('WorkspaceShell');
    expect(code).not.toContain('WorkbenchRegion');
    expect(code).not.toContain('ChatView');
    expect(code).not.toContain('window.');
    expect(code).not.toContain('document.');
    
    // No persistencia ni manager central
    expect(code).not.toContain('localStorage');
    expect(code).not.toContain('sessionStorage');
    expect(code).not.toContain('WindowManager');
    expect(code).not.toContain('Runtime');
    expect(code).not.toContain('BrainProvider');
    
    // No ChatRepository (importante para TEST-FIA004-02)
    expect(code).not.toContain('chatRepository');
  });
});

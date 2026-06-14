import { describe, it, expect, beforeEach } from 'vitest';
import { createChatFlow } from '../createChatFlow';
import { chatRepository } from '../chatRepository';
import * as fs from 'fs';
import * as path from 'path';

describe('CreateChatFlow - RV-03/FIA-003', () => {
  beforeEach(() => {
    chatRepository.clear();
  });

  it('TEST-FIA003-01: crear Chat con owner Enti explícito produce id estable, owner correcto e history inicial inerte', () => {
    const chat = createChatFlow('enti', 'E1');
    expect(chat.id).toBeDefined();
    expect(typeof chat.id).toBe('string');
    expect(chat.owner.type).toBe('enti');
    expect(chat.owner.id).toBe('E1');
    expect(chat.history).toHaveLength(0);
  });

  it('TEST-FIA003-02: crear Chat con owner Grupo produce Chat válido sin activar UI de Grupo ni Chat', () => {
    const chat = createChatFlow('grupo', 'G1');
    expect(chat.id).toBeDefined();
    expect(chat.owner.type).toBe('grupo');
    expect(chat.owner.id).toBe('G1');
    expect(chat.history).toHaveLength(0);
  });

  it('TEST-FIA003-03: Chat creado se guarda en ChatRepository y puede recuperarse por id', () => {
    const chat = createChatFlow('enti', 'E1');
    const saved = chatRepository.getById(chat.id);
    expect(saved).toBeDefined();
    expect(saved?.id).toBe(chat.id);
    expect(saved?.owner.id).toBe('E1');
  });

  it('TEST-FIA003-04: múltiples Chats creados no comparten identidad ni historial accidental', () => {
    const chat1 = createChatFlow('enti', 'E1');
    const chat2 = createChatFlow('enti', 'E2');

    expect(chat1.id).not.toBe(chat2.id);

    // Modify history to ensure they are isolated
    chat1.history.push({ id: 'msg1', content: 'test', role: 'user', timestamp: 123 });
    chatRepository.save(chat1);

    const saved1 = chatRepository.getById(chat1.id);
    const saved2 = chatRepository.getById(chat2.id);
    
    expect(saved1?.history).toHaveLength(1);
    expect(saved2?.history).toHaveLength(0);
  });

  it('TEST-FIA003-05: ausencia de owner bloquea creación y no guarda Chat parcial', () => {
    expect(() => createChatFlow('enti', '')).toThrow('Owner ID is required');
    expect(chatRepository.list()).toHaveLength(0); // Nada se guardó
  });

  it('TEST-FIA003-06: owner inválido bloquea creación y no guarda Chat parcial', () => {
    // @ts-expect-error probando entrada invalida
    expect(() => createChatFlow('invalid', 'E1')).toThrow('Invalid owner type');
    expect(chatRepository.list()).toHaveLength(0); // Nada se guardó
  });

  it('Anti-drift & Forbidden units: Verificar no implementa UI, persistencia ni llamadas a red', () => {
    const code = fs.readFileSync(path.join(__dirname, '../createChatFlow.ts'), 'utf-8');
    expect(code).not.toContain('EntiRepository');
    expect(code).not.toContain('Workspace');
    expect(code).not.toContain('EntiEditor');
    expect(code).not.toContain('ChatWindow');
    expect(code).not.toContain('ChatRegion');
    expect(code).not.toContain('Runtime');
    expect(code).not.toContain('PromptEngine');
    expect(code).not.toContain('localStorage');
    expect(code).not.toContain('sessionStorage');
    expect(code).not.toContain('IndexedDB');
    expect(code).not.toContain('sendMessage'); // RV-03/FIA-004 prohibido
  });
});

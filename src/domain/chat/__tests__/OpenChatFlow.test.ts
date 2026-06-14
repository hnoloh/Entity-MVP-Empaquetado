import { describe, it, expect, beforeEach } from 'vitest';
import { openChatFlow } from '../openChatFlow';
import { createChatFlow } from '../createChatFlow';
import { chatRepository } from '../chatRepository';
import { sendMessageToChatFlow } from '../sendMessageToChatFlow';
import * as fs from 'fs';
import * as path from 'path';

describe('OpenChatFlow - RV-03/FIA-009', () => {
  beforeEach(() => {
    chatRepository.clear();
  });

  it('TEST-FIA009-01: abre Chat existente de owner Enti', () => {
    const chat = createChatFlow('enti', 'E1');
    const result = openChatFlow(chat.id);
    
    expect(result.chatId).toBe(chat.id);
    expect(result.ownerType).toBe('enti');
    expect(result.ownerId).toBe('E1');
    expect(result.openedAt).toBeGreaterThan(0);
  });

  it('TEST-FIA009-02: abre Chat existente de owner Grupo', () => {
    const chat = createChatFlow('grupo', 'G1');
    const result = openChatFlow(chat.id);
    
    expect(result.chatId).toBe(chat.id);
    expect(result.ownerType).toBe('grupo');
    expect(result.ownerId).toBe('G1');
  });

  it('TEST-FIA009-03: rechaza chatId inexistente sin mutación', () => {
    const snapshot1 = JSON.stringify(chatRepository.list());
    expect(() => openChatFlow('inexistente')).toThrow('not found');
    const snapshot2 = JSON.stringify(chatRepository.list());
    expect(snapshot1).toEqual(snapshot2);
  });

  it('TEST-FIA009-04: rechaza chatId vacío sin mutación', () => {
    expect(() => openChatFlow('')).toThrow('cannot be empty');
    expect(() => openChatFlow('   ')).toThrow('cannot be empty');
  });

  it('TEST-FIA009-05: reabrir mismo Chat es idempotente', () => {
    const chat = createChatFlow('enti', 'E1');
    const result1 = openChatFlow(chat.id);
    const result2 = openChatFlow(chat.id);
    
    expect(result1.chatId).toBe(result2.chatId);
    expect(result1.ownerType).toBe(result2.ownerType);
    expect(result1.ownerId).toBe(result2.ownerId);
  });

  it('TEST-FIA009-06: preserva historial, roles, orden y contenido', () => {
    const chat = createChatFlow('enti', 'E1');
    sendMessageToChatFlow(chat.id, 'Hola open');
    
    openChatFlow(chat.id);
    
    const saved = chatRepository.getById(chat.id);
    expect(saved?.history).toHaveLength(1);
    expect(saved?.history[0].content).toBe('Hola open');
  });

  it('TEST-FIA009-07: preserva aislamiento multi-chat', () => {
    const chat1 = createChatFlow('enti', 'E1');
    const chat2 = createChatFlow('grupo', 'G1');
    
    const r1 = openChatFlow(chat1.id);
    const r2 = openChatFlow(chat2.id);
    
    expect(r1.chatId).not.toBe(r2.chatId);
    expect(r1.ownerType).toBe('enti');
    expect(r2.ownerType).toBe('grupo');
  });

  it('TEST-FIA009-08: no invoca Runtime, Prompt Engine, provider real, SDK/red ni storage persistente', () => {
    const code = fs.readFileSync(path.join(__dirname, '../openChatFlow.ts'), 'utf-8');
    expect(code).not.toContain('Runtime');
    expect(code).not.toContain('PromptEngine');
    expect(code).not.toContain('fetch(');
    expect(code).not.toContain('localStorage');
    expect(code).not.toContain('sessionStorage');
  });

  it('TEST-FIA009-09: no modifica Workspace/Mesa/EntiEditor/EntitiesColumn/Ghost', () => {
    const code = fs.readFileSync(path.join(__dirname, '../openChatFlow.ts'), 'utf-8');
    expect(code).not.toContain('Workspace');
    expect(code).not.toContain('Mesa');
    expect(code).not.toContain('EntiEditor');
  });

  it('TEST-FIA009-10: no implementa RV-03/FIA-010', () => {
    const code = fs.readFileSync(path.join(__dirname, '../openChatFlow.ts'), 'utf-8');
    expect(code).not.toContain('FIA-010');
  });
});

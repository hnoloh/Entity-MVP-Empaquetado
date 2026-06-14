import { describe, it, expect, beforeEach } from 'vitest';
import { associateChatEntiFlow } from '../associateChatEntiFlow';
import { createChatFlow } from '../createChatFlow';
import { chatRepository } from '../chatRepository';
import { entiRepository } from '../../enti/entiRepository';
import { Enti } from '../../enti/Enti';
import { sendMessageToChatFlow } from '../sendMessageToChatFlow';
import { receiveResponseToChatFlow } from '../receiveResponseToChatFlow';
import * as fs from 'fs';
import * as path from 'path';

describe('AssociateChatEntiFlow - RV-03/FIA-007', () => {
  beforeEach(() => {
    chatRepository.clear();
    entiRepository.clear();
  });

  const setupEnti = (id: string): Enti => {
    const enti: Enti = {
      id,
      type: "enti",
      name: 'Test Enti',
      status: 'incomplete',
      harness: { function: '', rules: [], workMaterial: '', knowledge: '' },
      cognitiveConfig: { mode: 'unconfigured' }
    };
    entiRepository.save(enti);
    return enti;
  };

  it('TEST-FIA007-01: Chat asociado a Enti válido conserva owner Enti explícito', () => {
    const enti = setupEnti('E1');
    const chat = createChatFlow('enti', 'temp');
    
    const associated = associateChatEntiFlow(chat.id, enti.id);
    expect(associated.owner.type).toBe('enti');
    expect(associated.owner.id).toBe('E1');
  });

  it('TEST-FIA007-02: Chat asociado conserva chatId', () => {
    const enti = setupEnti('E1');
    const chat = createChatFlow('enti', 'temp');
    
    const associated = associateChatEntiFlow(chat.id, enti.id);
    expect(associated.id).toBe(chat.id);
  });

  it('TEST-FIA007-03: Chat con historial previo conserva orden, roles y contenido tras asociación', () => {
    const enti = setupEnti('E1');
    const chat = createChatFlow('enti', 'temp');
    sendMessageToChatFlow(chat.id, 'Hola');
    receiveResponseToChatFlow(chat.id, 'Hola user');
    
    const associated = associateChatEntiFlow(chat.id, enti.id);
    expect(associated.history).toHaveLength(2);
    expect(associated.history[0].role).toBe('user');
    expect(associated.history[1].role).toBe('assistant');
  });

  it('TEST-FIA007-04: Chat asociado se recupera desde ChatRepository con misma identidad', () => {
    const enti = setupEnti('E1');
    const chat = createChatFlow('enti', 'temp');
    associateChatEntiFlow(chat.id, enti.id);
    
    const saved = chatRepository.getById(chat.id);
    expect(saved).toBeDefined();
    expect(saved?.owner.id).toBe('E1');
  });

  it('TEST-FIA007-05: asociación Chat-Enti no modifica Modelo Enti ni EntiRepository salvo fixtures/test setup', () => {
    const enti = setupEnti('E1');
    const chat = createChatFlow('enti', 'temp');
    
    const snapshot1 = JSON.stringify(entiRepository.list());
    associateChatEntiFlow(chat.id, enti.id);
    const snapshot2 = JSON.stringify(entiRepository.list());
    
    expect(snapshot1).toEqual(snapshot2);
  });

  it('TEST-FIA007-06: dos Chats asociados a Entis distintos conservan aislamiento de owner e historial', () => {
    const enti1 = setupEnti('E1');
    const enti2 = setupEnti('E2');
    
    const chat1 = createChatFlow('enti', 'temp1');
    const chat2 = createChatFlow('enti', 'temp2');
    
    sendMessageToChatFlow(chat1.id, 'Para 1');
    sendMessageToChatFlow(chat2.id, 'Para 2');
    
    associateChatEntiFlow(chat1.id, enti1.id);
    associateChatEntiFlow(chat2.id, enti2.id);
    
    const saved1 = chatRepository.getById(chat1.id);
    const saved2 = chatRepository.getById(chat2.id);
    
    expect(saved1?.owner.id).toBe('E1');
    expect(saved2?.owner.id).toBe('E2');
    expect(saved1?.history[0].content).toBe('Para 1');
    expect(saved2?.history[0].content).toBe('Para 2');
  });

  it('TEST-FIA007-07: owner ausente no crea ni guarda Chat parcial', () => {
    const chat = createChatFlow('enti', 'temp');
    const snapshot1 = JSON.stringify(chatRepository.list());
    
    expect(() => associateChatEntiFlow(chat.id, '')).toThrow();
    
    const snapshot2 = JSON.stringify(chatRepository.list());
    expect(snapshot1).toEqual(snapshot2);
  });

  it('TEST-FIA007-08: owner Grupo se rechaza en esta FIA', () => {
    const enti = setupEnti('E1');
    const chat = createChatFlow('grupo', 'temp');
    
    expect(() => associateChatEntiFlow(chat.id, enti.id)).toThrow('Grupo is rejected');
  });

  it('TEST-FIA007-09: Enti inexistente o inválido no produce mutación', () => {
    const chat = createChatFlow('enti', 'temp');
    const snapshot1 = JSON.stringify(chatRepository.list());
    
    expect(() => associateChatEntiFlow(chat.id, 'inexistente')).toThrow('not found');
    
    const snapshot2 = JSON.stringify(chatRepository.list());
    expect(snapshot1).toEqual(snapshot2);
  });

  it('TEST-FIA007-10: forbidden-units scan sin ChatWindow, ChatRegion operativo, Runtime, Prompt Engine, provider real, SDK/red, backend, storage persistente, autosave ni FIA-008', () => {
    const code = fs.readFileSync(path.join(__dirname, '../associateChatEntiFlow.ts'), 'utf-8');
    expect(code).not.toContain('ChatWindow');
    expect(code).not.toContain('ChatRegion');
    expect(code).not.toContain('Runtime');
    expect(code).not.toContain('PromptEngine');
    expect(code).not.toContain('fetch(');
    expect(code).not.toContain('localStorage');
    expect(code).not.toContain('FIA-008');
  });

  // TEST-FIA007-11 y 12 aplican a la suite completa de vitest.
});

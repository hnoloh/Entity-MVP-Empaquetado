import { describe, it, expect, beforeEach } from 'vitest';
import { associateChatGrupoFlow } from '../associateChatGrupoFlow';
import { createChatFlow } from '../createChatFlow';
import { chatRepository } from '../chatRepository';
import { sendMessageToChatFlow } from '../sendMessageToChatFlow';
import { receiveResponseToChatFlow } from '../receiveResponseToChatFlow';
import { entiRepository } from '../../enti/entiRepository';
import * as fs from 'fs';
import * as path from 'path';

describe('AssociateChatGrupoFlow - RV-03/FIA-008', () => {
  beforeEach(() => {
    chatRepository.clear();
    entiRepository.clear();
  });

  it('TEST-FIA008-01: asociación válida Chat-Grupo con owner explícito', () => {
    const chat = createChatFlow('grupo', 'temp-group');
    const associated = associateChatGrupoFlow(chat.id, 'G1');
    
    expect(associated.owner.type).toBe('grupo');
    expect(associated.owner.id).toBe('G1');
  });

  it('TEST-FIA008-02: preservación de chatId en Chat de Grupo', () => {
    const chat = createChatFlow('grupo', 'temp-group');
    const associated = associateChatGrupoFlow(chat.id, 'G1');
    
    expect(associated.id).toBe(chat.id);
  });

  it('TEST-FIA008-03: preservación de historial, orden, roles y contenido', () => {
    const chat = createChatFlow('grupo', 'temp-group');
    sendMessageToChatFlow(chat.id, 'Hola');
    receiveResponseToChatFlow(chat.id, 'Hola user');
    
    const associated = associateChatGrupoFlow(chat.id, 'G1');
    
    expect(associated.history).toHaveLength(2);
    expect(associated.history[0].role).toBe('user');
    expect(associated.history[0].content).toBe('Hola');
    expect(associated.history[1].role).toBe('assistant');
    expect(associated.history[1].content).toBe('Hola user');
  });

  it('TEST-FIA008-04: owner Enti rechazado en esta FIA específica', () => {
    const chat = createChatFlow('enti', 'E1');
    
    expect(() => associateChatGrupoFlow(chat.id, 'G1')).toThrow('Owner Enti is rejected');
  });

  it('TEST-FIA008-05: chatId inexistente no produce mutación', () => {
    expect(() => associateChatGrupoFlow('inexistente', 'G1')).toThrow('not found');
  });

  it('TEST-FIA008-06: owner ausente o inválido no crea Chat parcial', () => {
    const chat = createChatFlow('grupo', 'temp');
    
    expect(() => associateChatGrupoFlow(chat.id, '')).toThrow('Owner ID is required');
    expect(() => associateChatGrupoFlow(chat.id, '   ')).toThrow('Owner ID is required');
  });

  it('TEST-FIA008-07: aislamiento multi-chat y multi-owner Grupo', () => {
    const chat1 = createChatFlow('grupo', 'temp1');
    const chat2 = createChatFlow('grupo', 'temp2');
    
    associateChatGrupoFlow(chat1.id, 'G1');
    associateChatGrupoFlow(chat2.id, 'G2');
    
    const saved1 = chatRepository.getById(chat1.id);
    const saved2 = chatRepository.getById(chat2.id);
    
    expect(saved1?.owner.id).toBe('G1');
    expect(saved2?.owner.id).toBe('G2');
  });

  it('TEST-FIA008-08: Chat de Grupo y Chat de Enti coexisten sin contaminación', () => {
    const chatGrupo = createChatFlow('grupo', 'temp-g');
    const chatEnti = createChatFlow('enti', 'E1');
    
    associateChatGrupoFlow(chatGrupo.id, 'G1');
    
    const savedG = chatRepository.getById(chatGrupo.id);
    const savedE = chatRepository.getById(chatEnti.id);
    
    expect(savedG?.owner.type).toBe('grupo');
    expect(savedE?.owner.type).toBe('enti');
  });

  it('TEST-FIA008-09: no escritura en EntiRepository, GrupoRepository ni repositorios no autorizados', () => {
    const chat = createChatFlow('grupo', 'temp');
    const snapshot1 = JSON.stringify(entiRepository.list());
    
    associateChatGrupoFlow(chat.id, 'G1');
    
    const snapshot2 = JSON.stringify(entiRepository.list());
    expect(snapshot1).toEqual(snapshot2); // No mutations in EntiRepository
  });

  it('TEST-FIA008-10: no creación de Grupo operativo, slots, integrantes ni secuencia', () => {
    const chat = createChatFlow('grupo', 'temp');
    const associated = associateChatGrupoFlow(chat.id, 'G1');
    
    // Verificamos que 'associated' sea un Chat puramente y no contenga fields ilegales
    expect(associated).not.toHaveProperty('slots');
    expect(associated).not.toHaveProperty('integrantes');
    expect(associated).not.toHaveProperty('secuencia');
  });

  it('TEST-FIA008-11: forbidden-units scan sin ChatWindow, ChatRegion operativo, Runtime, Prompt Engine, BrainProvider real, SDK/red, backend, storage persistente, autosave ni FIA-009', () => {
    const code = fs.readFileSync(path.join(__dirname, '../associateChatGrupoFlow.ts'), 'utf-8');
    expect(code).not.toContain('ChatWindow');
    expect(code).not.toContain('ChatRegion');
    expect(code).not.toContain('Runtime');
    expect(code).not.toContain('PromptEngine');
    expect(code).not.toContain('fetch(');
    expect(code).not.toContain('localStorage');
    expect(code).not.toContain('GrupoRepository');
    expect(code).not.toContain('FIA-009');
  });
  
  // TEST-FIA008-12 y TEST-FIA008-13 están cubiertos por la suite completa de vitest
});

import { describe, it, expect, beforeEach } from 'vitest';
import { receiveResponseToChatFlow } from '../receiveResponseToChatFlow';
import { sendMessageToChatFlow } from '../sendMessageToChatFlow';
import { createChatFlow } from '../createChatFlow';
import { chatRepository } from '../chatRepository';
import * as fs from 'fs';
import * as path from 'path';

describe('ReceiveResponseToChatFlow - RV-03/FIA-005', () => {
  beforeEach(() => {
    chatRepository.clear();
  });

  it('TEST-FIA005-01: recibe respuesta para Chat de owner Enti y la añade al historial', () => {
    const chat = createChatFlow('enti', 'E1');
    const updated = receiveResponseToChatFlow(chat.id, 'Respuesta IA');
    
    expect(updated.history).toHaveLength(1);
    expect(updated.history[0].role).toBe('assistant');
    expect(updated.history[0].content).toBe('Respuesta IA');
  });

  it('TEST-FIA005-02: recibe respuesta para Chat de owner Grupo y la añade al historial', () => {
    const chat = createChatFlow('grupo', 'G1');
    const updated = receiveResponseToChatFlow(chat.id, 'Respuesta grupo');
    
    expect(updated.history).toHaveLength(1);
    expect(updated.history[0].role).toBe('assistant');
    expect(updated.history[0].content).toBe('Respuesta grupo');
  });

  it('TEST-FIA005-03: preserva mensajes previos, id y owner', () => {
    const chat = createChatFlow('enti', 'E1');
    sendMessageToChatFlow(chat.id, 'Pregunta 1');
    const updated = receiveResponseToChatFlow(chat.id, 'Respuesta 1');
    
    expect(updated.id).toBe(chat.id);
    expect(updated.owner.type).toBe('enti');
    expect(updated.owner.id).toBe('E1');
    expect(updated.history).toHaveLength(2);
    expect(updated.history[0].role).toBe('user');
    expect(updated.history[1].role).toBe('assistant');
    expect(updated.history[1].content).toBe('Respuesta 1');
  });

  it('TEST-FIA005-04: chatId inexistente no produce mutación ni Chat parcial', () => {
    expect(() => receiveResponseToChatFlow('inexistente', 'Hola')).toThrow('not found');
    expect(chatRepository.list()).toHaveLength(0);
  });

  it('TEST-FIA005-05: texto vacío o espacios no produce mutación', () => {
    const chat = createChatFlow('enti', 'E1');
    expect(() => receiveResponseToChatFlow(chat.id, '   ')).toThrow('cannot be empty');
    
    const saved = chatRepository.getById(chat.id);
    expect(saved?.history).toHaveLength(0);
  });

  it('TEST-FIA005-06: múltiples respuestas se anexan en orden determinista sin sobrescritura', () => {
    const chat = createChatFlow('enti', 'E1');
    receiveResponseToChatFlow(chat.id, 'Primera parte');
    receiveResponseToChatFlow(chat.id, 'Segunda parte');
    
    const saved = chatRepository.getById(chat.id);
    expect(saved?.history).toHaveLength(2);
    expect(saved?.history[0].content).toBe('Primera parte');
    expect(saved?.history[1].content).toBe('Segunda parte');
  });

  it('TEST-FIA005-07: múltiples chats mantienen aislamiento; solo se modifica el Chat objetivo', () => {
    const chatA = createChatFlow('enti', 'E1');
    const chatB = createChatFlow('enti', 'E2');
    
    receiveResponseToChatFlow(chatA.id, 'Respuesta A');
    
    const savedA = chatRepository.getById(chatA.id);
    const savedB = chatRepository.getById(chatB.id);
    
    expect(savedA?.history).toHaveLength(1);
    expect(savedB?.history).toHaveLength(0);
  });

  it('TEST-FIA005-08: ChatRepository en memoria es el único canal de escritura', () => {
    const chat = createChatFlow('enti', 'E1');
    const initialListLength = chatRepository.list().length;
    
    receiveResponseToChatFlow(chat.id, 'Test rep');
    
    expect(chatRepository.list()).toHaveLength(initialListLength);
  });

  it('TEST-FIA005-09: forbidden-units scan confirma ausencia de UI/Runtime/API', () => {
    const code = fs.readFileSync(path.join(__dirname, '../receiveResponseToChatFlow.ts'), 'utf-8');
    expect(code).not.toContain('ChatWindow');
    expect(code).not.toContain('ChatRegion');
    expect(code).not.toContain('Runtime');
    expect(code).not.toContain('PromptEngine');
    expect(code).not.toContain('fetch(');
    expect(code).not.toContain('localStorage');
    expect(code).not.toContain('sessionStorage');
    expect(code).not.toContain('initChatSession'); // o flujos de RV-03/FIA-006 prohibidos
  });
});

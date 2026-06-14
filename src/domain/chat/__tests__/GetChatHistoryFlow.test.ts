import { describe, it, expect, beforeEach } from 'vitest';
import { getChatHistoryFlow } from '../getChatHistoryFlow';
import { createChatFlow } from '../createChatFlow';
import { sendMessageToChatFlow } from '../sendMessageToChatFlow';
import { receiveResponseToChatFlow } from '../receiveResponseToChatFlow';
import { chatRepository } from '../chatRepository';
import * as fs from 'fs';
import * as path from 'path';

describe('GetChatHistoryFlow - RV-03/FIA-006', () => {
  beforeEach(() => {
    chatRepository.clear();
  });

  it('TEST-FIA006-01: devuelve historial vacío de Chat existente recién creado', () => {
    const chat = createChatFlow('enti', 'E1');
    const history = getChatHistoryFlow(chat.id);
    expect(history).toEqual([]);
  });

  it('TEST-FIA006-02: devuelve historial con mensaje user previamente enviado', () => {
    const chat = createChatFlow('enti', 'E1');
    sendMessageToChatFlow(chat.id, 'Hola');
    const history = getChatHistoryFlow(chat.id);
    
    expect(history).toHaveLength(1);
    expect(history[0].role).toBe('user');
    expect(history[0].content).toBe('Hola');
  });

  it('TEST-FIA006-03: devuelve historial con respuesta assistant previamente recibida', () => {
    const chat = createChatFlow('enti', 'E1');
    receiveResponseToChatFlow(chat.id, 'Respuesta');
    const history = getChatHistoryFlow(chat.id);
    
    expect(history).toHaveLength(1);
    expect(history[0].role).toBe('assistant');
    expect(history[0].content).toBe('Respuesta');
  });

  it('TEST-FIA006-04: conserva orden user/assistant acumulado', () => {
    const chat = createChatFlow('enti', 'E1');
    sendMessageToChatFlow(chat.id, 'Hola');
    receiveResponseToChatFlow(chat.id, 'Hola soy IA');
    sendMessageToChatFlow(chat.id, 'Adios');
    
    const history = getChatHistoryFlow(chat.id);
    expect(history).toHaveLength(3);
    expect(history[0].content).toBe('Hola');
    expect(history[1].content).toBe('Hola soy IA');
    expect(history[2].content).toBe('Adios');
  });

  it('TEST-FIA006-05: Chat inexistente no produce mutación ni Chat parcial', () => {
    expect(() => getChatHistoryFlow('inexistente')).toThrow('not found');
    expect(chatRepository.list()).toHaveLength(0);
  });

  it('TEST-FIA006-06: aislamiento multi-chat; solo se devuelve historial del chatId objetivo', () => {
    const chatA = createChatFlow('enti', 'E1');
    const chatB = createChatFlow('enti', 'E2');
    
    sendMessageToChatFlow(chatA.id, 'Mensaje A');
    sendMessageToChatFlow(chatB.id, 'Mensaje B');
    
    const historyA = getChatHistoryFlow(chatA.id);
    expect(historyA).toHaveLength(1);
    expect(historyA[0].content).toBe('Mensaje A');
  });

  it('TEST-FIA006-07: lectura no invoca save, delete, clear ni autosave', () => {
    const chat = createChatFlow('enti', 'E1');
    sendMessageToChatFlow(chat.id, 'Mensaje');
    
    const snapshot1 = JSON.stringify(chatRepository.list());
    getChatHistoryFlow(chat.id);
    const snapshot2 = JSON.stringify(chatRepository.list());
    
    expect(snapshot1).toEqual(snapshot2); // no mutado
  });

  it('TEST-FIA006-08: copia defensiva/no mutable leakage sobre history', () => {
    const chat = createChatFlow('enti', 'E1');
    sendMessageToChatFlow(chat.id, 'Mensaje');
    
    const history = getChatHistoryFlow(chat.id);
    // Intento malicioso
    history.push({ id: 'falso', role: 'system', content: 'falso', timestamp: Date.now() });
    
    const saved = chatRepository.getById(chat.id);
    expect(saved?.history).toHaveLength(1);
    expect(saved?.history[0].content).toBe('Mensaje');
  });

  it('TEST-FIA006-09: forbidden-units scan', () => {
    const code = fs.readFileSync(path.join(__dirname, '../getChatHistoryFlow.ts'), 'utf-8');
    expect(code).not.toContain('ChatWindow');
    expect(code).not.toContain('ChatRegion');
    expect(code).not.toContain('Runtime');
    expect(code).not.toContain('PromptEngine');
    expect(code).not.toContain('fetch(');
    expect(code).not.toContain('localStorage');
    expect(code).not.toContain('.save(');
    expect(code).not.toContain('.delete(');
    expect(code).not.toContain('.clear(');
  });
});

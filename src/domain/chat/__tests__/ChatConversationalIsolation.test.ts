import { describe, it, expect, beforeEach } from 'vitest';
import { chatRepository } from '../chatRepository';
import { createChatFlow } from '../createChatFlow';
import { sendMessageToChatFlow } from '../sendMessageToChatFlow';
import { receiveResponseToChatFlow } from '../receiveResponseToChatFlow';
import { getChatHistoryFlow } from '../getChatHistoryFlow';
import { clearChatHistoryFlow } from '../clearChatHistoryFlow';
import { openChatFlow } from '../openChatFlow';
import { closeChatFlow } from '../closeChatFlow';

describe('ChatConversationalIsolation', () => {
  beforeEach(() => {
    chatRepository.clear();
  });

  it('TEST-FIA014-01: sendMessageToChatFlow sobre Chat A no modifica historial de Chat B', () => {
    const chatA = createChatFlow('enti', 'A1');
    const chatB = createChatFlow('enti', 'B1');
    
    sendMessageToChatFlow(chatA.id, 'Mensaje A');
    
    expect(getChatHistoryFlow(chatA.id)).toHaveLength(1);
    expect(getChatHistoryFlow(chatB.id)).toHaveLength(0);
  });

  it('TEST-FIA014-02: receiveResponseToChatFlow sobre Chat A no modifica historial de Chat B', () => {
    const chatA = createChatFlow('enti', 'A1');
    const chatB = createChatFlow('enti', 'B1');
    
    receiveResponseToChatFlow(chatA.id, 'Respuesta A');
    
    expect(getChatHistoryFlow(chatA.id)).toHaveLength(1);
    expect(getChatHistoryFlow(chatB.id)).toHaveLength(0);
  });

  it('TEST-FIA014-03: getChatHistoryFlow de Chat A devuelve solo historial de Chat A', () => {
    const chatA = createChatFlow('enti', 'A1');
    const chatB = createChatFlow('enti', 'B1');
    
    sendMessageToChatFlow(chatA.id, 'M1');
    sendMessageToChatFlow(chatB.id, 'M2');
    
    const histA = getChatHistoryFlow(chatA.id);
    expect(histA).toHaveLength(1);
    expect(histA[0].content).toBe('M1');
  });

  it('TEST-FIA014-04: clearChatHistoryFlow sobre Chat A no modifica historial de Chat B', () => {
    const chatA = createChatFlow('enti', 'A1');
    const chatB = createChatFlow('enti', 'B1');
    sendMessageToChatFlow(chatA.id, 'A');
    sendMessageToChatFlow(chatB.id, 'B');
    
    clearChatHistoryFlow(chatA.id);
    
    expect(getChatHistoryFlow(chatA.id)).toHaveLength(0);
    expect(getChatHistoryFlow(chatB.id)).toHaveLength(1);
  });

  it('TEST-FIA014-05: openChatFlow sobre Chat A no altera Chat B ni su historial', () => {
    const chatA = createChatFlow('enti', 'A1');
    const chatB = createChatFlow('enti', 'B1');
    sendMessageToChatFlow(chatB.id, 'B');
    
    openChatFlow(chatA.id);
    
    expect(getChatHistoryFlow(chatA.id)).toHaveLength(0);
    expect(getChatHistoryFlow(chatB.id)).toHaveLength(1);
  });

  it('TEST-FIA014-06: closeChatFlow sobre Chat A no cierra Chat B ni borra historial', () => {
    const chatA = createChatFlow('enti', 'A1');
    const chatB = createChatFlow('enti', 'B1');
    sendMessageToChatFlow(chatB.id, 'B');
    
    closeChatFlow(chatA.id);
    
    const savedB = chatRepository.getById(chatB.id);
    expect(savedB?.history).toHaveLength(1);
  });

  it('TEST-FIA014-07: operaciones con owner Enti no alteran owner Grupo', () => {
    const chatE = createChatFlow('enti', 'E1');
    const chatG = createChatFlow('grupo', 'G1');
    
    sendMessageToChatFlow(chatE.id, 'E');
    
    const savedG = chatRepository.getById(chatG.id);
    expect(savedG?.owner.type).toBe('grupo');
  });

  it('TEST-FIA014-08: operaciones con owner Grupo no alteran owner Enti', () => {
    const chatE = createChatFlow('enti', 'E1');
    const chatG = createChatFlow('grupo', 'G1');
    
    sendMessageToChatFlow(chatG.id, 'G');
    
    const savedE = chatRepository.getById(chatE.id);
    expect(savedE?.owner.type).toBe('enti');
  });

  it('TEST-FIA014-09: chatId inexistente no crea Chat implícito ni muta repositorio', () => {
    const snapshotBefore = JSON.stringify(chatRepository.list());
    
    expect(() => openChatFlow('invalid')).toThrow();
    expect(() => sendMessageToChatFlow('invalid', 'H')).toThrow();
    
    const snapshotAfter = JSON.stringify(chatRepository.list());
    expect(snapshotBefore).toBe(snapshotAfter);
  });

  it('TEST-FIA014-10: texto vacío/whitespace no crea mensaje ni afecta otros Chats', () => {
    const chat = createChatFlow('enti', 'E1');
    expect(() => sendMessageToChatFlow(chat.id, '   ')).toThrow('Message text cannot be empty');
    expect(getChatHistoryFlow(chat.id)).toHaveLength(0);
  });

  it('TEST-FIA014-11: historial retornado usa copia defensiva o estructura inmutable', () => {
    const chat = createChatFlow('enti', 'E1');
    sendMessageToChatFlow(chat.id, 'A');
    
    const hist = getChatHistoryFlow(chat.id);
    hist.push({ id: 'm1', role: 'assistant', content: 'hack', timestamp: Date.now() });
    
    const realHist = getChatHistoryFlow(chat.id);
    expect(realHist).toHaveLength(1);
  });
});

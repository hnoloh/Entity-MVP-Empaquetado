import { describe, it, expect, beforeEach } from 'vitest';
import { chatRepository } from '../chatRepository';
import { createChatFlow } from '../createChatFlow';
import { sendMessageToChatFlow } from '../sendMessageToChatFlow';
import { receiveResponseToChatFlow } from '../receiveResponseToChatFlow';
import { getChatHistoryFlow } from '../getChatHistoryFlow';
import { clearChatHistoryFlow } from '../clearChatHistoryFlow';
import { openChatFlow } from '../openChatFlow';
import { closeChatFlow } from '../closeChatFlow';

describe('ChatMultichatIsolation', () => {
  beforeEach(() => {
    chatRepository.clear();
  });

  it('TEST-FIA015-01: coexistencia de dos Chats abiertos sin cierre automático', () => {
    const chatA = createChatFlow('enti', 'A1');
    const chatB = createChatFlow('enti', 'B1');
    
    expect(chatRepository.getById(chatA.id)).toBeDefined();
    expect(chatRepository.getById(chatB.id)).toBeDefined();
  });

  it('TEST-FIA015-02: coexistencia de al menos tres Chats abiertos sin imponer límite funcional nuevo', () => {
    const chats = Array.from({ length: 5 }, (_, i) => createChatFlow('enti', `E${i}`));
    expect(chatRepository.list()).toHaveLength(5);
    chats.forEach(c => expect(chatRepository.getById(c.id)).toBeDefined());
  });

  it('TEST-FIA015-03: seleccionar Chat B no muta ni cierra Chat A ni Chat C', () => {
    const chatA = createChatFlow('enti', 'A1');
    const chatB = createChatFlow('enti', 'B1');
    const chatC = createChatFlow('enti', 'C1');
    
    // Simulate selecting B (which is just interacting with B)
    sendMessageToChatFlow(chatB.id, 'Hello B');
    
    expect(getChatHistoryFlow(chatA.id)).toHaveLength(0);
    expect(getChatHistoryFlow(chatC.id)).toHaveLength(0);
    expect(getChatHistoryFlow(chatB.id)).toHaveLength(1);
    
    expect(chatRepository.getById(chatA.id)).toBeDefined();
    expect(chatRepository.getById(chatC.id)).toBeDefined();
  });

  it('TEST-FIA015-05: sendMessageToChatFlow afecta solo al chatId objetivo', () => {
    const chatA = createChatFlow('enti', 'A1');
    const chatB = createChatFlow('enti', 'B1');
    sendMessageToChatFlow(chatA.id, 'MSG');
    expect(getChatHistoryFlow(chatB.id)).toHaveLength(0);
  });

  it('TEST-FIA015-06: receiveResponseToChatFlow afecta solo al chatId objetivo', () => {
    const chatA = createChatFlow('enti', 'A1');
    const chatB = createChatFlow('enti', 'B1');
    receiveResponseToChatFlow(chatA.id, 'RSP');
    expect(getChatHistoryFlow(chatB.id)).toHaveLength(0);
  });

  it('TEST-FIA015-07: getChatHistoryFlow devuelve solo historial del chatId objetivo', () => {
    const chatA = createChatFlow('enti', 'A1');
    sendMessageToChatFlow(chatA.id, 'MSG');
    const chatB = createChatFlow('enti', 'B1');
    expect(getChatHistoryFlow(chatB.id)).toHaveLength(0);
    expect(getChatHistoryFlow(chatA.id)).toHaveLength(1);
  });

  it('TEST-FIA015-08: clearChatHistoryFlow vacía solo el Chat objetivo', () => {
    const chatA = createChatFlow('enti', 'A1');
    const chatB = createChatFlow('enti', 'B1');
    sendMessageToChatFlow(chatA.id, 'M1');
    sendMessageToChatFlow(chatB.id, 'M2');
    clearChatHistoryFlow(chatA.id);
    expect(getChatHistoryFlow(chatA.id)).toHaveLength(0);
    expect(getChatHistoryFlow(chatB.id)).toHaveLength(1);
  });

  it('TEST-FIA015-09: openChatFlow no cierra Chats previos', () => {
    const chatA = createChatFlow('enti', 'A1');
    openChatFlow(chatA.id);
    const chatB = createChatFlow('enti', 'B1');
    openChatFlow(chatB.id);
    
    expect(chatRepository.getById(chatA.id)).toBeDefined();
  });

  it('TEST-FIA015-10: closeChatFlow cierra solo el Chat objetivo', () => {
    const chatA = createChatFlow('enti', 'A1');
    const chatB = createChatFlow('enti', 'B1');
    closeChatFlow(chatA.id);
    
    expect(chatRepository.getById(chatB.id)).toBeDefined();
    // In our model, closeChatFlow doesn't delete from repository
    expect(chatRepository.getById(chatA.id)).toBeDefined();
  });

  it('TEST-FIA015-11: cierre de un Chat no borra modelo ni historial', () => {
    const chatA = createChatFlow('enti', 'A1');
    sendMessageToChatFlow(chatA.id, 'Hello');
    closeChatFlow(chatA.id);
    
    const savedA = chatRepository.getById(chatA.id);
    expect(savedA?.history).toHaveLength(1);
  });

  it('TEST-FIA015-12: reapertura idempotente sin duplicados no documentados', () => {
    const chatA = createChatFlow('enti', 'A1');
    const originalCount = chatRepository.list().length;
    
    closeChatFlow(chatA.id);
    openChatFlow(chatA.id);
    
    expect(chatRepository.list().length).toBe(originalCount);
  });

  it('TEST-FIA015-13: owner Enti/Grupo permanece aislado', () => {
    const chatE = createChatFlow('enti', 'E1');
    const chatG = createChatFlow('grupo', 'G1');
    
    expect(chatRepository.getById(chatE.id)?.owner.type).toBe('enti');
    expect(chatRepository.getById(chatG.id)?.owner.type).toBe('grupo');
  });

  it('TEST-FIA015-14: ChatRepository no almacena estado visual', () => {
    const chat = createChatFlow('enti', 'A1');
    const data = chatRepository.getById(chat.id);
    const keys = Object.keys(data || {});
    expect(keys).not.toContain('isOpen');
    expect(keys).not.toContain('position');
    expect(keys).not.toContain('zIndex');
    expect(keys).not.toContain('draft');
  });
});

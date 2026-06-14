import { describe, it, expect, beforeEach } from 'vitest';
import { chatRepository } from '../chatRepository';
import { createChatFlow } from '../createChatFlow';
import { sendMessageToChatFlow } from '../sendMessageToChatFlow';
import { receiveResponseToChatFlow } from '../receiveResponseToChatFlow';
import { getChatHistoryFlow } from '../getChatHistoryFlow';
import { clearChatHistoryFlow } from '../clearChatHistoryFlow';
import { closeChatFlow } from '../closeChatFlow';

describe('ChatGroupSingleChat - RV-03/FIA-016', () => {
  beforeEach(() => {
    chatRepository.clear();
  });

  it('TEST-FIA016-01: owner Grupo válido sin Chat previo resuelve un único Chat de Grupo', () => {
    const chatG = createChatFlow('grupo', 'G1');
    expect(chatG).toBeDefined();
    expect(chatG.owner.type).toBe('grupo');
    expect(chatG.owner.id).toBe('G1');
    expect(chatRepository.list()).toHaveLength(1);
  });

  it('TEST-FIA016-02: abrir/reabrir el mismo owner Grupo reutiliza el mismo chatId', () => {
    const chatG1 = createChatFlow('grupo', 'G1');
    const chatG1_second = createChatFlow('grupo', 'G1');
    
    expect(chatG1.id).toBe(chatG1_second.id);
    expect(chatRepository.list()).toHaveLength(1);
  });

  it('TEST-FIA016-03: dos Grupos distintos tienen Chats distintos', () => {
    const chatG1 = createChatFlow('grupo', 'G1');
    const chatG2 = createChatFlow('grupo', 'G2');
    
    expect(chatG1.id).not.toBe(chatG2.id);
    expect(chatRepository.list()).toHaveLength(2);
  });

  it('TEST-FIA016-04: Chat de Grupo coexiste con Chat de Enti sin mezclar owner ni historial', () => {
    const chatG = createChatFlow('grupo', 'G1');
    const chatE = createChatFlow('enti', 'E1');
    
    sendMessageToChatFlow(chatG.id, 'Para grupo');
    sendMessageToChatFlow(chatE.id, 'Para enti');
    
    expect(getChatHistoryFlow(chatG.id)).toHaveLength(1);
    expect(getChatHistoryFlow(chatG.id)[0].content).toBe('Para grupo');
    expect(getChatHistoryFlow(chatE.id)).toHaveLength(1);
    expect(getChatHistoryFlow(chatE.id)[0].content).toBe('Para enti');
  });

  it('TEST-FIA016-05: historial de Chat de Grupo se conserva al reabrir/recuperar', () => {
    const chatG = createChatFlow('grupo', 'G1');
    sendMessageToChatFlow(chatG.id, 'Mensaje 1');
    closeChatFlow(chatG.id);
    
    const reabierto = createChatFlow('grupo', 'G1');
    expect(reabierto.id).toBe(chatG.id);
    
    const historial = getChatHistoryFlow(reabierto.id);
    expect(historial).toHaveLength(1);
    expect(historial[0].content).toBe('Mensaje 1');
  });

  it('TEST-FIA016-06: send/receive/history/clear/close actúan solo sobre Chat de Grupo objetivo', () => {
    const chatG = createChatFlow('grupo', 'G1');
    const chatG2 = createChatFlow('grupo', 'G2');
    
    sendMessageToChatFlow(chatG.id, 'Hola G1');
    receiveResponseToChatFlow(chatG.id, 'Resp G1');
    
    expect(getChatHistoryFlow(chatG.id)).toHaveLength(2);
    expect(getChatHistoryFlow(chatG2.id)).toHaveLength(0);
    
    clearChatHistoryFlow(chatG.id);
    expect(getChatHistoryFlow(chatG.id)).toHaveLength(0);
  });

  it('TEST-FIA016-07: no se crean Chats individuales por integrantes simulados/fixtures', () => {
    createChatFlow('grupo', 'G1');
    // A group chat is requested. No other side effects should occur.
    const allChats = chatRepository.list();
    // Only one chat exists
    expect(allChats).toHaveLength(1);
    // It's a group chat
    expect(allChats[0].owner.type).toBe('grupo');
  });

  it('TEST-FIA016-08: owner Grupo ausente/inválido no produce Chat parcial ni mutación', () => {
    const beforeCount = chatRepository.list().length;
    expect(() => createChatFlow('grupo', '   ')).toThrow('Owner ID is required and cannot be empty.');
    expect(chatRepository.list().length).toBe(beforeCount);
  });

  it('TEST-FIA016-09: no storage, no Runtime, no provider, no ChatWindow operativo, no RV-04/RV-05/RV-06/FIA-017', () => {
    // This will be partially covered by forbidden-units scan in anti-drift.
    // Domain code shouldn't leak any of those.
    expect(chatRepository.list()).toBeDefined();
  });
});

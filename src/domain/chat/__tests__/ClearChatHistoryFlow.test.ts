import { describe, it, expect, beforeEach } from 'vitest';
import { clearChatHistoryFlow } from '../clearChatHistoryFlow';
import { chatRepository } from '../chatRepository';
import { createChatFlow } from '../createChatFlow';
import { sendMessageToChatFlow } from '../sendMessageToChatFlow';

describe('clearChatHistoryFlow', () => {
  beforeEach(() => {
    chatRepository.clear();
  });

  it('TEST-FIA012-01: vacía historial de Chat owner Enti existente preservando chatId y owner', () => {
    const chat = createChatFlow('enti', 'E1');
    sendMessageToChatFlow(chat.id, 'Hola');
    
    const cleared = clearChatHistoryFlow(chat.id);
    expect(cleared?.history).toHaveLength(0);
    expect(cleared?.id).toBe(chat.id);
    expect(cleared?.owner.type).toBe('enti');
    expect(cleared?.owner.id).toBe('E1');
    
    const saved = chatRepository.getById(chat.id);
    expect(saved?.history).toHaveLength(0);
  });

  it('TEST-FIA012-02: vacía historial de Chat owner Grupo existente preservando chatId y owner', () => {
    const chat = createChatFlow('grupo', 'G1');
    sendMessageToChatFlow(chat.id, 'Hola Grupo');
    
    const cleared = clearChatHistoryFlow(chat.id);
    expect(cleared?.history).toHaveLength(0);
    expect(cleared?.owner.type).toBe('grupo');
  });

  it('TEST-FIA012-03: operación idempotente sobre historial ya vacío', () => {
    const chat = createChatFlow('enti', 'E2');
    const cleared = clearChatHistoryFlow(chat.id);
    expect(cleared?.history).toHaveLength(0);
    
    const clearedAgain = clearChatHistoryFlow(chat.id);
    expect(clearedAgain?.history).toHaveLength(0);
  });

  it('TEST-FIA012-04: chatId inexistente no muta ChatRepository', () => {
    createChatFlow('enti', 'E1');
    const snapshotBefore = JSON.stringify(chatRepository.list());
    
    const result = clearChatHistoryFlow('missing');
    expect(result).toBeNull();
    
    const snapshotAfter = JSON.stringify(chatRepository.list());
    expect(snapshotBefore).toBe(snapshotAfter);
  });

  it('TEST-FIA012-05: chatId ausente/whitespace no muta ChatRepository', () => {
    const snapshotBefore = JSON.stringify(chatRepository.list());
    
    expect(clearChatHistoryFlow('')).toBeNull();
    expect(clearChatHistoryFlow('   ')).toBeNull();
    
    const snapshotAfter = JSON.stringify(chatRepository.list());
    expect(snapshotBefore).toBe(snapshotAfter);
  });

  it('TEST-FIA012-06: aislamiento multi-chat; solo cambia el Chat objetivo', () => {
    const chatA = createChatFlow('enti', 'A1');
    const chatB = createChatFlow('enti', 'B1');
    sendMessageToChatFlow(chatA.id, 'Mensaje A');
    sendMessageToChatFlow(chatB.id, 'Mensaje B');
    
    clearChatHistoryFlow(chatA.id);
    
    const savedA = chatRepository.getById(chatA.id);
    const savedB = chatRepository.getById(chatB.id);
    
    expect(savedA?.history).toHaveLength(0);
    expect(savedB?.history).toHaveLength(1);
    expect(savedB?.history[0].content).toBe('Mensaje B');
  });
});

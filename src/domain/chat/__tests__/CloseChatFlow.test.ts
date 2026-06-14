import { describe, it, expect, beforeEach } from 'vitest';
import { closeChatFlow } from '../closeChatFlow';
import { chatRepository } from '../chatRepository';
import { createChatFlow } from '../createChatFlow';
import { sendMessageToChatFlow } from '../sendMessageToChatFlow';

describe('closeChatFlow', () => {
  beforeEach(() => {
    chatRepository.clear();
  });

  it('TEST-FIA013-01: cerrar Chat abierto conserva entidad en ChatRepository', () => {
    const chat = createChatFlow('enti', 'E1');
    const res = closeChatFlow(chat.id);
    expect(res.chatId).toBe(chat.id);
    expect(chatRepository.getById(chat.id)).toBeDefined();
  });

  it('TEST-FIA013-02: cerrar conserva historial, roles, orden y contenido', () => {
    const chat = createChatFlow('enti', 'E2');
    sendMessageToChatFlow(chat.id, 'Msg1');
    sendMessageToChatFlow(chat.id, 'Msg2');
    
    closeChatFlow(chat.id);
    
    const saved = chatRepository.getById(chat.id);
    expect(saved?.history).toHaveLength(2);
    expect(saved?.history[0].content).toBe('Msg1');
    expect(saved?.history[1].content).toBe('Msg2');
  });

  it('TEST-FIA013-03: cerrar conserva owner Enti', () => {
    const chat = createChatFlow('enti', 'E1');
    closeChatFlow(chat.id);
    const saved = chatRepository.getById(chat.id);
    expect(saved?.owner.type).toBe('enti');
    expect(saved?.owner.id).toBe('E1');
  });

  it('TEST-FIA013-04: cerrar conserva owner Grupo sin Grupo operativo', () => {
    const chat = createChatFlow('grupo', 'G1');
    closeChatFlow(chat.id);
    const saved = chatRepository.getById(chat.id);
    expect(saved?.owner.type).toBe('grupo');
    expect(saved?.owner.id).toBe('G1');
  });

  it('TEST-FIA013-05: multi-chat: solo se cierra el Chat objetivo', () => {
    const chat1 = createChatFlow('enti', 'E1');
    const chat2 = createChatFlow('enti', 'E2');
    
    closeChatFlow(chat1.id);
    
    expect(chatRepository.getById(chat1.id)).toBeDefined();
    expect(chatRepository.getById(chat2.id)).toBeDefined();
  });

  it('TEST-FIA013-06: cerrar Chat ya cerrado/no activo es idempotente y no destructivo', () => {
    const chat = createChatFlow('enti', 'E1');
    const res1 = closeChatFlow(chat.id);
    const res2 = closeChatFlow(chat.id);
    expect(res1.chatId).toBe(chat.id);
    expect(res2.chatId).toBe(chat.id);
    expect(chatRepository.getById(chat.id)).toBeDefined();
  });

  it('TEST-FIA013-07: chatId ausente/whitespace no crea Chat ni muta estado', () => {
    expect(() => closeChatFlow('')).toThrow();
    expect(() => closeChatFlow('   ')).toThrow();
    expect(chatRepository.list().length).toBe(0);
  });

  it('TEST-FIA013-08: chatId inexistente no crea Chat, no muta repositorio y no cierra otros Chats', () => {
    expect(() => closeChatFlow('invalid')).toThrow();
    expect(chatRepository.list().length).toBe(0);
  });
});

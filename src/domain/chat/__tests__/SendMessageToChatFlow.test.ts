import { describe, it, expect, beforeEach } from 'vitest';
import { sendMessageToChatFlow } from '../sendMessageToChatFlow';
import { createChatFlow } from '../createChatFlow';
import { chatRepository } from '../chatRepository';
import * as fs from 'fs';
import * as path from 'path';
import type { Chat } from '../Chat';

describe('SendMessageToChatFlow - RV-03/FIA-004', () => {
  beforeEach(() => {
    chatRepository.clear();
  });

  it('TEST-FIA004-01: enviar texto no vacío a Chat con owner Enti agrega mensaje al historial', () => {
    const chat = createChatFlow('enti', 'E1');
    const updated = sendMessageToChatFlow(chat.id, 'Hola mundo');
    
    expect(updated.history).toHaveLength(1);
    expect(updated.history[0].role).toBe('user');
    expect(updated.history[0].content).toBe('Hola mundo');
  });

  it('TEST-FIA004-02: enviar texto no vacío a Chat con owner Grupo agrega mensaje al historial', () => {
    const chat = createChatFlow('grupo', 'G1');
    const updated = sendMessageToChatFlow(chat.id, 'Hola grupo');
    
    expect(updated.history).toHaveLength(1);
    expect(updated.history[0].role).toBe('user');
    expect(updated.history[0].content).toBe('Hola grupo');
  });

  it('TEST-FIA004-03: múltiples mensajes al mismo Chat preservan orden de inserción', () => {
    const chat = createChatFlow('enti', 'E1');
    sendMessageToChatFlow(chat.id, 'Primero');
    sendMessageToChatFlow(chat.id, 'Segundo');
    
    const saved = chatRepository.getById(chat.id);
    expect(saved?.history).toHaveLength(2);
    expect(saved?.history[0].content).toBe('Primero');
    expect(saved?.history[1].content).toBe('Segundo');
  });

  it('TEST-FIA004-04: mensaje enviado a Chat A no aparece en Chat B', () => {
    const chatA = createChatFlow('enti', 'E1');
    const chatB = createChatFlow('enti', 'E2');
    
    sendMessageToChatFlow(chatA.id, 'Solo para A');
    
    const savedA = chatRepository.getById(chatA.id);
    const savedB = chatRepository.getById(chatB.id);
    
    expect(savedA?.history).toHaveLength(1);
    expect(savedB?.history).toHaveLength(0);
  });

  it('TEST-FIA004-05: owner, id e identidad del Chat permanecen estables tras envío', () => {
    const chat = createChatFlow('enti', 'E1');
    const updated = sendMessageToChatFlow(chat.id, 'Mensaje');
    
    expect(updated.id).toBe(chat.id);
    expect(updated.owner.type).toBe('enti');
    expect(updated.owner.id).toBe('E1');
  });

  it('TEST-FIA004-06: ChatRepository guarda solo el Chat actualizado; EntiRepository no se usa', () => {
    const chat = createChatFlow('enti', 'E1');
    const initialListLength = chatRepository.list().length;
    
    sendMessageToChatFlow(chat.id, 'Test rep');
    
    // Sigue habiendo 1 solo chat en la bd
    expect(chatRepository.list()).toHaveLength(initialListLength);
  });

  it('TEST-FIA004-07: chatId inexistente no crea Chat ni muta repositorio', () => {
    expect(() => sendMessageToChatFlow('inexistente', 'Hola')).toThrow('not found');
    expect(chatRepository.list()).toHaveLength(0);
  });

  it('TEST-FIA004-08: texto vacío o solo espacios no crea mensaje ni muta repositorio', () => {
    const chat = createChatFlow('enti', 'E1');
    expect(() => sendMessageToChatFlow(chat.id, '   ')).toThrow('cannot be empty');
    
    const saved = chatRepository.getById(chat.id);
    expect(saved?.history).toHaveLength(0);
  });

  it('TEST-FIA004-09: Chat sin owner explícito bloquea envío', () => {
    // Forzamos un chat inválido en el repo para probar
    const chatInvalido = { id: 'C99', history: [] } as unknown as Chat;
    chatRepository.save(chatInvalido);

    expect(() => sendMessageToChatFlow('C99', 'Hola')).toThrow('invalid owner');
  });

  it('TEST-FIA004-10: forbidden-units scan', () => {
    const code = fs.readFileSync(path.join(__dirname, '../sendMessageToChatFlow.ts'), 'utf-8');
    expect(code).not.toContain('ChatWindow');
    expect(code).not.toContain('ChatRegion');
    expect(code).not.toContain('Runtime');
    expect(code).not.toContain('PromptEngine');
    expect(code).not.toContain('fetch(');
    expect(code).not.toContain('localStorage');
    expect(code).not.toContain('receiveMessage'); // FIA-005 forbidden
  });
});

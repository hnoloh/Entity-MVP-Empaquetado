import { describe, it, expect, beforeEach } from 'vitest';
import { chatRepository } from '../chatRepository';
import { createChat } from '../createChat';
import * as fs from 'fs';
import * as path from 'path';

describe('ChatRepository - RV-03/FIA-002', () => {
  beforeEach(() => {
    chatRepository.clear();
  });

  it('TEST-FIA002-01: repositorio vacío lista cero Chats', () => {
    expect(chatRepository.list()).toHaveLength(0);
  });

  it('TEST-FIA002-02: save + getById conserva id, owner e history', () => {
    const chat = createChat('C1', 'enti', 'E1');
    chat.history.push({ id: 'm1', role: 'user', content: 'hello', timestamp: 123 });
    chatRepository.save(chat);

    const saved = chatRepository.getById('C1');
    expect(saved).toBeDefined();
    expect(saved?.id).toBe('C1');
    expect(saved?.owner.type).toBe('enti');
    expect(saved?.owner.id).toBe('E1');
    expect(saved?.history).toHaveLength(1);
    expect(saved?.history[0].content).toBe('hello');
  });

  it('TEST-FIA002-03: list devuelve todos los Chats guardados de forma determinista', () => {
    const chat1 = createChat('C1', 'enti', 'E1');
    const chat2 = createChat('C2', 'grupo', 'G1');
    chatRepository.save(chat1);
    chatRepository.save(chat2);

    const list = chatRepository.list();
    expect(list).toHaveLength(2);
    expect(list.some(c => c.id === 'C1')).toBe(true);
    expect(list.some(c => c.id === 'C2')).toBe(true);
  });

  it('TEST-FIA002-04: save con mismo id reemplaza sin duplicar identidad', () => {
    const chat = createChat('C1', 'enti', 'E1');
    chatRepository.save(chat);
    
    const chatUpdated = createChat('C1', 'enti', 'E1');
    chatUpdated.history.push({ id: 'm1', role: 'user', content: 'new message', timestamp: 123 });
    chatRepository.save(chatUpdated);

    const list = chatRepository.list();
    expect(list).toHaveLength(1);
    expect(list[0].history).toHaveLength(1);
    expect(list[0].history[0].content).toBe('new message');
  });

  it('TEST-FIA002-05: delete(id) elimina solo el Chat objetivo', () => {
    const chat1 = createChat('C1', 'enti', 'E1');
    const chat2 = createChat('C2', 'grupo', 'G1');
    chatRepository.save(chat1);
    chatRepository.save(chat2);

    chatRepository.delete('C1');
    expect(chatRepository.getById('C1')).toBeUndefined();
    expect(chatRepository.getById('C2')).toBeDefined();
    expect(chatRepository.list()).toHaveLength(1);
  });

  it('TEST-FIA002-06: clear() elimina todos los Chats en memoria', () => {
    chatRepository.save(createChat('C1', 'enti', 'E1'));
    chatRepository.save(createChat('C2', 'grupo', 'G1'));
    chatRepository.clear();
    expect(chatRepository.list()).toHaveLength(0);
  });

  it('TEST-FIA002-07: owner Enti y owner Grupo permanecen explícitos y aislados', () => {
    chatRepository.save(createChat('C1', 'enti', 'E1'));
    chatRepository.save(createChat('C2', 'grupo', 'G1'));
    expect(chatRepository.getById('C1')?.owner.type).toBe('enti');
    expect(chatRepository.getById('C2')?.owner.type).toBe('grupo');
  });

  it('TEST-FIA002-08: histories distintos no se mezclan ni se comparten por referencia mutable', () => {
    const chat = createChat('C1', 'enti', 'E1');
    chatRepository.save(chat);

    // Modificamos el objeto original
    chat.history.push({ id: 'm1', role: 'user', content: 'mutation', timestamp: 123 });

    // Verificamos que el repositorio no se haya alterado (copia defensiva)
    const saved = chatRepository.getById('C1');
    expect(saved?.history).toHaveLength(0);

    // Modificamos lo devuelto por getById
    saved!.history.push({ id: 'm2', role: 'user', content: 'mutation2', timestamp: 124 });
    const savedAgain = chatRepository.getById('C1');
    expect(savedAgain?.history).toHaveLength(0);
  });

  it('TEST-FIA002-09, 10, 12: forbidden-units scan y no implementación RV-03/FIA-003', () => {
    const repoCode = fs.readFileSync(path.join(__dirname, '../chatRepository.ts'), 'utf-8');
    expect(repoCode).not.toContain('localStorage');
    expect(repoCode).not.toContain('sessionStorage');
    expect(repoCode).not.toContain('IndexedDB');
    expect(repoCode).not.toContain('ChatWindow');
    expect(repoCode).not.toContain('PromptEngine');
    expect(repoCode).not.toContain('Runtime');
    expect(repoCode).not.toContain('sendMessage'); // FIA-003
    expect(repoCode).not.toContain('receiveMessage'); // FIA-003
  });
});

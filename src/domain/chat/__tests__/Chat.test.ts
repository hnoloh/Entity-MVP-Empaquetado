import { describe, it, expect } from 'vitest';
import { createChat } from '../createChat';
import * as fs from 'fs';
import * as path from 'path';

describe('Chat Domain - RV-03/FIA-001', () => {
  it('TEST-RV03-FIA001-01: Chat requiere id estable', () => {
    const chat = createChat('C1', 'enti', 'E1');
    expect(chat.id).toBe('C1');
    
    expect(() => createChat('', 'enti', 'E1')).toThrow('Chat ID is required');
  });

  it('TEST-RV03-FIA001-02, 03, 04: Chat requiere owner explícito (enti o grupo)', () => {
    const chatEnti = createChat('C1', 'enti', 'E1');
    expect(chatEnti.owner.type).toBe('enti');
    expect(chatEnti.owner.id).toBe('E1');

    const chatGrupo = createChat('C2', 'grupo', 'G1');
    expect(chatGrupo.owner.type).toBe('grupo');
    expect(chatGrupo.owner.id).toBe('G1');
  });

  it('TEST-RV03-FIA001-05: owner inválido falla', () => {
    // @ts-expect-error probando tipo invalido
    expect(() => createChat('C1', 'invalid', 'E1')).toThrow('Invalid owner type');
    expect(() => createChat('C1', 'enti', '')).toThrow('Owner ID is required');
  });

  it('TEST-RV03-FIA001-06: historial inicial puede estar vacío', () => {
    const chat = createChat('C1', 'enti', 'E1');
    expect(Array.isArray(chat.history)).toBe(true);
    expect(chat.history.length).toBe(0);
  });

  it('TEST-RV03-FIA001-07: dos Chats con owners distintos no comparten identidad ni historial', () => {
    const chat1 = createChat('C1', 'enti', 'E1');
    const chat2 = createChat('C2', 'enti', 'E2');
    
    expect(chat1.id).not.toBe(chat2.id);
    expect(chat1.owner.id).not.toBe(chat2.owner.id);
    expect(chat1.history).not.toBe(chat2.history);
  });

  it('TEST-RV03-FIA001-08: Chat no modifica EntiRepository, WorkspaceShell, WorkbenchRegion ni EntiEditor', () => {
    // Verificamos estáticamente que createChat es puro y no importa otros componentes o repositorios
    const code = fs.readFileSync(path.join(__dirname, '../createChat.ts'), 'utf-8');
    expect(code).not.toContain('EntiRepository');
    expect(code).not.toContain('WorkspaceShell');
    expect(code).not.toContain('WorkbenchRegion');
    expect(code).not.toContain('EntiEditor');
  });

  it('TEST-RV03-FIA001-09: forbidden-units scan', () => {
    const chatDir = path.join(__dirname, '..');
    const files = fs.readdirSync(chatDir);
    
    expect(files).not.toContain('ChatRepository.ts');
    expect(files).not.toContain('ChatWindow.tsx');
    expect(files).not.toContain('ChatRegion.tsx');
  });

  it('TEST-RV03-FIA001-11: no implementación de RV-03/FIA-002 ni RV-03/FIA-003', () => {
    const chatCode = fs.readFileSync(path.join(__dirname, '../Chat.ts'), 'utf-8');
    // Aseguramos que no hay envío ni persistencia
    expect(chatCode).not.toContain('sendMessage');
    expect(chatCode).not.toContain('receiveMessage');
    expect(chatCode).not.toContain('saveChat');
  });
});

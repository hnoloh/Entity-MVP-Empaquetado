import { describe, it, expect } from 'vitest';
import { createGroupFlow } from '../createGroupFlow';
import * as fs from 'fs';
import * as path from 'path';

describe('createGroupFlow - RV-05/FIA-001', () => {
  it('TEST-FIA001-01: crea un Grupo con identificador único de sesión', () => {
    const group = createGroupFlow('group-1');
    expect(group.id).toBe('group-1');
    expect(group.name).toBe('Nuevo Grupo');
    expect(group.type).toBe('group');
  });

  it('TEST-FIA001-02: permite asignar nombre personalizado', () => {
    const group = createGroupFlow('group-2', 'Mi Grupo Especial');
    expect(group.name).toBe('Mi Grupo Especial');
  });

  it('TEST-FIA001-03: lanza error ante ID vacío o inválido', () => {
    expect(() => createGroupFlow('')).toThrow('Group ID is required and cannot be empty.');
    expect(() => createGroupFlow('   ')).toThrow('Group ID is required and cannot be empty.');
  });

  it('TEST-FIA001-04: guard contra forbidden-units', () => {
    const code = fs.readFileSync(path.join(__dirname, '../createGroupFlow.ts'), 'utf-8');
    expect(code).not.toContain('localStorage');
    expect(code).not.toContain('sessionStorage');
    expect(code).not.toContain('Runtime');
    expect(code).not.toContain('ChatWindow');
    expect(code).not.toContain('EditorGrupo');
  });
});

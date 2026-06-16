import { describe, it, expect } from 'vitest';
import { editGroupFlow } from '../editGroupFlow';
import { createGroupFlow } from '../createGroupFlow';
import * as fs from 'fs';
import * as path from 'path';
import type { Group } from '../Group';

describe('editGroupFlow - RV-05/FIA-002', () => {
  it('TEST-FIA002-01: edita únicamente el Grupo objetivo', () => {
    const groups: Group[] = [
      createGroupFlow('g1', 'Grupo 1'),
      createGroupFlow('g2', 'Grupo 2')
    ];
    
    const updated = editGroupFlow(groups, 'g1', { name: 'Grupo 1 Editado' });
    
    expect(updated.length).toBe(2);
    expect(updated.find(g => g.id === 'g1')!.name).toBe('Grupo 1 Editado');
    expect(updated.find(g => g.id === 'g2')!.name).toBe('Grupo 2');
  });

  it('TEST-FIA002-02: rechaza Grupo inexistente sin mutación', () => {
    const groups: Group[] = [createGroupFlow('g1', 'Grupo 1')];
    const updated = editGroupFlow(groups, 'g99', { name: 'Fantasma' });
    
    expect(updated).toBe(groups); // Same reference = no mutation
  });

  it('TEST-FIA002-03: rechaza identificador vacío sin mutación', () => {
    const groups: Group[] = [createGroupFlow('g1', 'Grupo 1')];
    const updated = editGroupFlow(groups, '', { name: 'Vacio' });
    
    expect(updated).toBe(groups);
  });

  it('TEST-FIA002-04: rechaza payload vacío sin mutación', () => {
    const groups: Group[] = [createGroupFlow('g1', 'Grupo 1')];
    const updated = editGroupFlow(groups, 'g1', {});
    
    expect(updated).toBe(groups);
  });

  it('TEST-FIA002-05: rechaza campos fuera de contrato sin mutación', () => {
    const groups: Group[] = [createGroupFlow('g1', 'Grupo 1')];
    // @ts-expect-error probando invalid patch
    const updated = editGroupFlow(groups, 'g1', { name: 'Valido', extrange: 'Invalido' });
    
    expect(updated).toBe(groups);
  });

  it('TEST-FIA008-01: rechaza nombre vacío sin mutación', () => {
    const groups: Group[] = [createGroupFlow('g1', 'Grupo 1')];
    const updated = editGroupFlow(groups, 'g1', { name: '   ' });
    
    expect(updated).toBe(groups);
  });

  it('TEST-FIA008-02: rechaza nombre no string sin mutación', () => {
    const groups: Group[] = [createGroupFlow('g1', 'Grupo 1')];
    // @ts-expect-error probando invalid patch
    const updated = editGroupFlow(groups, 'g1', { name: 123 });
    
    expect(updated).toBe(groups);
  });

  it('TEST-FIA009-01: permite editar la función del grupo', () => {
    const groups: Group[] = [createGroupFlow('g1', 'Grupo 1')];
    const updated = editGroupFlow(groups, 'g1', { function: 'Nueva función' });
    
    expect(updated[0].function).toBe('Nueva función');
    expect(updated[0].name).toBe('Grupo 1');
  });

  it('TEST-FIA009-02: rechaza función vacía sin mutación', () => {
    const groups: Group[] = [createGroupFlow('g1', 'Grupo 1')];
    const updated = editGroupFlow(groups, 'g1', { function: '   ' });
    
    expect(updated).toBe(groups);
  });

  it('TEST-FIA009-03: rechaza función no string sin mutación', () => {
    const groups: Group[] = [createGroupFlow('g1', 'Grupo 1')];
    // @ts-expect-error probando invalid patch
    const updated = editGroupFlow(groups, 'g1', { function: 123 });
    
    expect(updated).toBe(groups);
  });

  it('TEST-FIA002-06: no introduce slots/members/sequence/function/Brain y cumple forbidden-units', () => {
    const code = fs.readFileSync(path.join(__dirname, '../editGroupFlow.ts'), 'utf-8');
    
    expect(code).not.toContain('slots');
    expect(code).not.toContain('members');
    expect(code).not.toContain('sequence');
    expect(code).not.toContain('Brain');
    expect(code).not.toContain('EditorGrupo');
    expect(code).not.toContain('ChatWindow');
  });
});

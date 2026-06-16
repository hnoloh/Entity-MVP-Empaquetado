import { describe, it, expect } from 'vitest';
import { getGroupSequenceFlow } from '../getGroupSequenceFlow';
import { createGroupFlow } from '../createGroupFlow';
import { addEntiToGroupSlotFlow } from '../addEntiToGroupSlotFlow';
import type { Group } from '../Group';
import type { Enti } from '../../enti/Enti';
import * as fs from 'fs';
import * as path from 'path';

describe('getGroupSequenceFlow', () => {
  it('TEST-FIA011-01: deriva la secuencia estructural pasiva en orden ascendente', () => {
    const entis = [
      { id: 'enti-1', type: 'enti', name: 'E1', content: '' },
      { id: 'enti-3', type: 'enti', name: 'E3', content: '' },
      { id: 'enti-5', type: 'enti', name: 'E5', content: '' }
    ] as unknown as Enti[];
    let groups = [createGroupFlow('g1', 'Grupo 1')];
    groups = addEntiToGroupSlotFlow(groups, entis, 'g1', 'enti-3', '3');
    groups = addEntiToGroupSlotFlow(groups, entis, 'g1', 'enti-1', '1');
    groups = addEntiToGroupSlotFlow(groups, entis, 'g1', 'enti-5', '5');

    const sequence = getGroupSequenceFlow(groups[0]);
    expect(sequence).toEqual([
      { slotId: '1', entiId: 'enti-1' },
      { slotId: '3', entiId: 'enti-3' },
      { slotId: '5', entiId: 'enti-5' },
    ]);
  });

  it('TEST-FIA011-02: ignora slots vacíos y tolera huecos sin validarlos ni compactarlos', () => {
    const group = createGroupFlow('g1', 'Grupo 1');
    const sequence = getGroupSequenceFlow(group);
    expect(sequence).toEqual([]);
  });

  it('TEST-FIA011-03: rechaza estructura corrupta (slot fuera de 1..5) devolviendo []', () => {
    const group: Group = {
      id: 'g1',
      type: 'group',
      name: 'Grupo',
      slots: { '1': 'e1', '6': 'e6' } as unknown as Group['slots']
    };
    const sequence = getGroupSequenceFlow(group);
    expect(sequence).toEqual([]);
  });

  it('TEST-FIA011-04: groupId inválido o sin slots devuelve []', () => {
    expect(getGroupSequenceFlow(undefined as unknown as Group)).toEqual([]);
    expect(getGroupSequenceFlow({} as unknown as Group)).toEqual([]);
  });

  it('TEST-FIA011-05: no introduce imports prohibidos ni ejecuta secuencia', () => {
    const code = fs.readFileSync(path.join(__dirname, '../getGroupSequenceFlow.ts'), 'utf-8');
    expect(code).not.toContain('Runtime');
    expect(code).not.toContain('EditorGrupo');
    expect(code).not.toContain('Brain');
  });
});

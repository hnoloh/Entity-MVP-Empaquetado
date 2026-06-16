import { describe, it, expect } from 'vitest';
import { getGroupMembersFlow } from '../getGroupMembersFlow';
import { createGroupFlow } from '../createGroupFlow';
import { addEntiToGroupSlotFlow } from '../addEntiToGroupSlotFlow';
import type { Group } from '../Group';
import type { Enti } from '../../enti/Enti';
import * as fs from 'fs';
import * as path from 'path';

describe('getGroupMembersFlow', () => {
  it('TEST-FIA010-01: devuelve integrantes desde slots ocupados en orden estructural', () => {
    const entis = [
      { id: 'enti-1', type: 'enti', name: 'E1', content: '' },
      { id: 'enti-3', type: 'enti', name: 'E3', content: '' },
      { id: 'enti-5', type: 'enti', name: 'E5', content: '' }
    ] as unknown as Enti[];
    let groups = [createGroupFlow('g1', 'Grupo 1')];
    groups = addEntiToGroupSlotFlow(groups, entis, 'g1', 'enti-3', '3');
    groups = addEntiToGroupSlotFlow(groups, entis, 'g1', 'enti-1', '1');
    groups = addEntiToGroupSlotFlow(groups, entis, 'g1', 'enti-5', '5');

    const members = getGroupMembersFlow(groups[0]);
    expect(members).toEqual([
      { slotId: '1', entiId: 'enti-1' },
      { slotId: '3', entiId: 'enti-3' },
      { slotId: '5', entiId: 'enti-5' },
    ]);
  });

  it('TEST-FIA010-02: ignora slots vacíos y devuelve array vacío si no hay integrantes', () => {
    const group = createGroupFlow('g1', 'Grupo 1');
    const members = getGroupMembersFlow(group);
    expect(members).toEqual([]);
  });

  it('TEST-FIA010-03: rechaza estructura corrupta (slot inválido) devolviendo []', () => {
    const group: Group = {
      id: 'g1',
      type: 'group',
      name: 'Grupo',
      slots: { '1': 'e1', '6': 'e6' } as unknown as Group['slots']
    };
    const members = getGroupMembersFlow(group);
    expect(members).toEqual([]);
  });

  it('TEST-FIA010-04: rechaza valor entiId inválido devolviendo []', () => {
    const group: Group = {
      id: 'g1',
      type: 'group',
      name: 'Grupo',
      slots: { '1': 'e1', '2': '  ' }
    };
    const members = getGroupMembersFlow(group);
    expect(members).toEqual([]);

    const group2: Group = {
      id: 'g1',
      type: 'group',
      name: 'Grupo',
      slots: { '1': 123 } as unknown as Group['slots']
    };
    expect(getGroupMembersFlow(group2)).toEqual([]);
  });

  it('TEST-FIA010-05: no introduce imports prohibidos ni secuencias', () => {
    const code = fs.readFileSync(path.join(__dirname, '../getGroupMembersFlow.ts'), 'utf-8');
    expect(code).not.toContain('Runtime');
    expect(code).not.toContain('EditorGrupo');
    expect(code).not.toContain('sequence');
    expect(code).not.toContain('Brain');
  });
});

import { describe, it, expect } from 'vitest';
import { addEntiToGroupSlotFlow } from '../addEntiToGroupSlotFlow';
import type { Group } from '../Group';
import type { Enti } from '../../enti/Enti';

describe('addEntiToGroupSlotFlow', () => {
  const mockEntis: Enti[] = [
    {
      id: 'e1',
      type: 'enti',
      name: 'E1',
      harness: { function: '', rules: [], workMaterial: '', knowledge: '' },
      cognitiveConfig: { mode: 'unconfigured' },
      status: 'incomplete'
    }
  ];

  it('asigna un Enti existente al slot objetivo de un Grupo existente', () => {
    const groups: Group[] = [{ id: 'g1', type: 'group', name: 'G1' }];
    const result = addEntiToGroupSlotFlow(groups, mockEntis, 'g1', 'e1', '1');
    expect(result[0].slots?.['1']).toBe('e1');
  });

  it('No muta ante Grupo inexistente', () => {
    const groups: Group[] = [{ id: 'g1', type: 'group', name: 'G1' }];
    const result = addEntiToGroupSlotFlow(groups, mockEntis, 'g2', 'e1', '1');
    expect(result).toBe(groups);
  });

  it('No muta ante Enti inexistente', () => {
    const groups: Group[] = [{ id: 'g1', type: 'group', name: 'G1' }];
    const result = addEntiToGroupSlotFlow(groups, mockEntis, 'g1', 'e2', '1');
    expect(result).toBe(groups);
  });

  it('No muta ante slot inválido', () => {
    const groups: Group[] = [{ id: 'g1', type: 'group', name: 'G1' }];
    const result = addEntiToGroupSlotFlow(groups, mockEntis, 'g1', 'e1', '6');
    expect(result).toBe(groups);
  });

  it('Preserva Grupos no objetivo', () => {
    const groups: Group[] = [
      { id: 'g1', type: 'group', name: 'G1' },
      { id: 'g2', type: 'group', name: 'G2' }
    ];
    const result = addEntiToGroupSlotFlow(groups, mockEntis, 'g1', 'e1', '1');
    expect(result[1]).toBe(groups[1]); // Mismo objeto referenciado
  });
});

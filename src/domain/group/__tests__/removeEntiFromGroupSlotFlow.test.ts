import { describe, it, expect } from 'vitest';
import { removeEntiFromGroupSlotFlow } from '../removeEntiFromGroupSlotFlow';
import type { Group } from '../Group';

describe('removeEntiFromGroupSlotFlow', () => {
  it('elimina la referencia del slot objetivo en un Group existente', () => {
    const groups: Group[] = [
      { id: 'g1', type: 'group', name: 'G1', slots: { '1': 'e1', '2': 'e2' } }
    ];
    const result = removeEntiFromGroupSlotFlow(groups, 'g1', '1');
    expect(result[0].slots?.['1']).toBeUndefined();
    expect(result[0].slots?.['2']).toBe('e2');
  });

  it('preserva la identidad del Group objetivo y slots no objetivo', () => {
    const groups: Group[] = [
      { id: 'g1', type: 'group', name: 'G1', slots: { '1': 'e1' } }
    ];
    const result = removeEntiFromGroupSlotFlow(groups, 'g1', '1');
    expect(result[0].id).toBe('g1');
    expect(result[0].name).toBe('G1');
    expect(result[0].slots).toEqual({});
  });

  it('preserva Grupos no objetivo', () => {
    const groups: Group[] = [
      { id: 'g1', type: 'group', name: 'G1', slots: { '1': 'e1' } },
      { id: 'g2', type: 'group', name: 'G2', slots: { '1': 'e2' } }
    ];
    const result = removeEntiFromGroupSlotFlow(groups, 'g1', '1');
    expect(result[1]).toBe(groups[1]); // Mismo objeto referenciado
  });

  it('operación sobre slot ya vacío no genera mutación colateral', () => {
    const groups: Group[] = [
      { id: 'g1', type: 'group', name: 'G1', slots: {} }
    ];
    const result = removeEntiFromGroupSlotFlow(groups, 'g1', '1');
    expect(result).toBe(groups);
  });

  it('groupId inválido produce no-mutación', () => {
    const groups: Group[] = [
      { id: 'g1', type: 'group', name: 'G1', slots: { '1': 'e1' } }
    ];
    const result = removeEntiFromGroupSlotFlow(groups, 'g2', '1');
    expect(result).toBe(groups);
  });

  it('slotId inválido produce no-mutación', () => {
    const groups: Group[] = [
      { id: 'g1', type: 'group', name: 'G1', slots: { '1': 'e1' } }
    ];
    const result = removeEntiFromGroupSlotFlow(groups, 'g1', '6');
    expect(result).toBe(groups);
  });
});

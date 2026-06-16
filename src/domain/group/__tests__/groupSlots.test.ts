import { describe, it, expect } from 'vitest';
import { GROUP_SLOT_IDS, isValidGroupSlotId, type Group } from '../Group';

describe('groupSlots', () => {
  it('Group contiene exactamente slots 1, 2, 3, 4, 5', () => {
    expect(GROUP_SLOT_IDS).toEqual(['1', '2', '3', '4', '5']);
  });

  it('Guard acepta 1, 2, 3, 4, 5', () => {
    expect(isValidGroupSlotId('1')).toBe(true);
    expect(isValidGroupSlotId('2')).toBe(true);
    expect(isValidGroupSlotId('3')).toBe(true);
    expect(isValidGroupSlotId('4')).toBe(true);
    expect(isValidGroupSlotId('5')).toBe(true);
  });

  it('Guard rechaza valores fuera de rango', () => {
    expect(isValidGroupSlotId('0')).toBe(false);
    expect(isValidGroupSlotId('6')).toBe(false);
    expect(isValidGroupSlotId('-1')).toBe(false);
    expect(isValidGroupSlotId('1.5')).toBe(false);
    expect(isValidGroupSlotId('')).toBe(false);
    expect(isValidGroupSlotId('slot1')).toBe(false);
    expect(isValidGroupSlotId(undefined as unknown as string)).toBe(false);
    expect(isValidGroupSlotId(null as unknown as string)).toBe(false);
  });

  it('Slot vacío es válido estructuralmente', () => {
    const group: Group = {
      id: 'g1',
      type: 'group',
      name: 'G1',
      slots: {} // Válido ya que Partial<Record> permite vacío
    };
    expect(group.slots).toEqual({});
  });
});

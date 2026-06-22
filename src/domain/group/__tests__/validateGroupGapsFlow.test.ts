/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from 'vitest';
import { type Group } from '../Group';
import { validateGroupGapsFlow } from '../validateGroupGapsFlow';

describe('validateGroupGapsFlow (RV05-FIA-016)', () => {
  it('Debería retornar válido para un grupo sin slots (no hay huecos antes de ocupados)', () => {
    const group: Group = { id: 'g-1', type: 'group', name: 'Test' };
    const result = validateGroupGapsFlow(group);
    expect(result.valid).toBe(true);
  });

  it('Debería retornar válido para configuración continua con 2 integrantes', () => {
    const group: Group = {
      id: 'g-1', type: 'group', name: 'Test',
      slots: { '1': 'e-1', '2': 'e-2' }
    };
    const result = validateGroupGapsFlow(group);
    expect(result.valid).toBe(true);
  });

  it('Debería retornar válido para configuración continua con 5 integrantes', () => {
    const group: Group = {
      id: 'g-1', type: 'group', name: 'Test',
      slots: { '1': 'e-1', '2': 'e-2', '3': 'e-3', '4': 'e-4', '5': 'e-5' }
    };
    const result = validateGroupGapsFlow(group);
    expect(result.valid).toBe(true);
  });

  it('Debería detectar un hueco intermedio (slot 2 vacío)', () => {
    const group: Group = {
      id: 'g-1', type: 'group', name: 'Test',
      slots: { '1': 'e-1', '3': 'e-3' }
    };
    const result = validateGroupGapsFlow(group);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('GROUP_GAP_DETECTED');
    expect(result.gapSlot).toBe('2');
    expect(result.occupiedAfterGap).toEqual(['3']);
  });

  it('Debería detectar un hueco inicial (slot 1 vacío)', () => {
    const group: Group = {
      id: 'g-1', type: 'group', name: 'Test',
      slots: { '2': 'e-2', '3': 'e-3' }
    };
    const result = validateGroupGapsFlow(group);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('GROUP_GAP_DETECTED');
    expect(result.gapSlot).toBe('1');
    expect(result.occupiedAfterGap).toEqual(['2', '3']);
  });

  it('Debería detectar un hueco posterior (slot 3 vacío, slot 4 ocupado)', () => {
    const group: Group = {
      id: 'g-1', type: 'group', name: 'Test',
      slots: { '1': 'e-1', '2': 'e-2', '4': 'e-4' }
    };
    const result = validateGroupGapsFlow(group);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('GROUP_GAP_DETECTED');
    expect(result.gapSlot).toBe('3');
    expect(result.occupiedAfterGap).toEqual(['4']);
  });

  it('Debería considerar inválida una estructura con slots fuera de rango', () => {
    const group: Group = {
      id: 'g-1', type: 'group', name: 'Test',
       
      slots: { '1': 'e1', '6': 'e-6' } as any
    };
    const result = validateGroupGapsFlow(group);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('INVALID_SLOT_STRUCTURE');
  });

  it('Debería ser puro y no mutar el objeto Group', () => {
    const group: Group = {
      id: 'g-1', type: 'group', name: 'Test',
      slots: { '1': 'e-1', '3': 'e-3' }
    };
    const originalJson = JSON.stringify(group);
    validateGroupGapsFlow(group);
    expect(JSON.stringify(group)).toBe(originalJson);
  });
});

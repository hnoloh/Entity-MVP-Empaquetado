/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from 'vitest';
import { validateGroupCardinalityFlow } from '../validateGroupCardinalityFlow';
import type { Group } from '../Group';

describe('validateGroupCardinalityFlow', () => {
  it('0 integrantes: inválido', () => {
    const groups: Group[] = [{ id: 'g1', type: 'group', name: 'G1', slots: {} }];
    expect(validateGroupCardinalityFlow(groups, 'g1')).toBe(false);
  });

  it('1 integrante: inválido', () => {
    const groups: Group[] = [{ id: 'g1', type: 'group', name: 'G1', slots: { '1': 'e1' } }];
    expect(validateGroupCardinalityFlow(groups, 'g1')).toBe(false);
  });

  it('2 a 5 integrantes consecutivos: válido', () => {
    expect(validateGroupCardinalityFlow([{ id: 'g1', type: 'group', name: 'G1', slots: { '1': 'e1', '2': 'e2' } }], 'g1')).toBe(true);
    expect(validateGroupCardinalityFlow([{ id: 'g1', type: 'group', name: 'G1', slots: { '1': 'e1', '2': 'e2', '3': 'e3' } }], 'g1')).toBe(true);
    expect(validateGroupCardinalityFlow([{ id: 'g1', type: 'group', name: 'G1', slots: { '1': 'e1', '2': 'e2', '3': 'e3', '4': 'e4' } }], 'g1')).toBe(true);
    expect(validateGroupCardinalityFlow([{ id: 'g1', type: 'group', name: 'G1', slots: { '1': 'e1', '2': 'e2', '3': 'e3', '4': 'e4', '5': 'e5' } }], 'g1')).toBe(true);
  });

  it('Slots no consecutivos con 2 o más integrantes: válido para cardinalidad', () => {
    const groups: Group[] = [{ id: 'g1', type: 'group', name: 'G1', slots: { '2': 'e1', '5': 'e2' } }];
    expect(validateGroupCardinalityFlow(groups, 'g1')).toBe(true);
  });

  it('Group inválido o inexistente: resultado inválido/controlado sin mutación', () => {
    const groups: Group[] = [{ id: 'g1', type: 'group', name: 'G1', slots: { '1': 'e1', '2': 'e2' } }];
    expect(validateGroupCardinalityFlow(groups, 'g2')).toBe(false);
    expect(validateGroupCardinalityFlow(groups, '')).toBe(false);
  });

  it('Estructura con slot fuera de 1..5: inválida/controlada sin mutación', () => {
     
    const groups: Group[] = [{ id: 'g1', type: 'group', name: 'G1', slots: { '1': 'e1', '2': 'e2', '6': 'e3' } as any }];
    expect(validateGroupCardinalityFlow(groups, 'g1')).toBe(false);
  });

  it('Validación no muta Group ni Entis', () => {
    const groups: Group[] = [{ id: 'g1', type: 'group', name: 'G1', slots: { '1': 'e1', '2': 'e2' } }];
    const copy = JSON.stringify(groups);
    validateGroupCardinalityFlow(groups, 'g1');
    expect(JSON.stringify(groups)).toBe(copy);
  });
});

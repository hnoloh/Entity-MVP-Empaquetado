import { describe, it, expect } from 'vitest';
import { persistGroupMemberPositionsFlow } from '../persistGroupMemberPositionsFlow';
import type { Group } from '../Group';

describe('persistGroupMemberPositionsFlow - RV-05/FIA-018', () => {
  it('TEST-FIA018-01: Round-trip básico preserva posiciones y datos de Group', () => {
    const input: Group = {
      id: 'G1',
      type: 'group',
      name: 'Test',
      function: 'Func',
      slots: { '1': 'E1', '2': 'E2' }
    };
    const output = persistGroupMemberPositionsFlow(input);
    expect(output).toEqual({
      id: 'G1',
      type: 'group',
      name: 'Test',
      function: 'Func',
      slots: { '1': 'E1', '2': 'E2' }
    });
    // Debe ser una copia nueva (inmutabilidad)
    expect(output).not.toBe(input);
    expect(output.slots).not.toBe(input.slots);
  });

  it('TEST-FIA018-02: Round-trip con slots 1..5 ocupados se recuperan en orden 1..5', () => {
    const input: Group = {
      id: 'G1',
      type: 'group',
      name: 'Test',
      slots: { '5': 'E5', '1': 'E1', '3': 'E3', '2': 'E2', '4': 'E4' } // Orden intencionadamente revuelto
    };
    const output = persistGroupMemberPositionsFlow(input);
    expect(output.slots).toEqual({
      '1': 'E1',
      '2': 'E2',
      '3': 'E3',
      '4': 'E4',
      '5': 'E5'
    });
  });

  it('TEST-FIA018-03: No compactación: huecos se preservan sin auto-fix', () => {
    const input: Group = {
      id: 'G1',
      type: 'group',
      name: 'Test',
      slots: { '1': 'E1', '3': 'E3' } // El slot 2 falta, es un hueco
    };
    const output = persistGroupMemberPositionsFlow(input);
    expect(output.slots).toEqual({
      '1': 'E1',
      '3': 'E3'
    });
    // Verifica que el slot 2 sigue vacío
    expect(output.slots!['2']).toBeUndefined();
  });

  it('TEST-FIA018-04: Referencias por ID, no copias ni mutación externa', () => {
    const input: Group = {
      id: 'G1',
      type: 'group',
      name: 'Test',
      slots: { '1': ' E1 ' } // También limpia espacios en blanco según la lógica
    };
    const output = persistGroupMemberPositionsFlow(input);
    expect(output.slots!['1']).toBe('E1');
    expect(output).not.toHaveProperty('invalidKey');
  });

  it('TEST-FIA018-05: Falla ante inputs inválidos', () => {
    expect(() => persistGroupMemberPositionsFlow({} as unknown as Group)).toThrow();
    expect(() => persistGroupMemberPositionsFlow({ id: 'G1', type: 'enti' } as unknown as Group)).toThrow();
  });
});

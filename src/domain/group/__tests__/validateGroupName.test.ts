import { describe, it, expect } from 'vitest';
import { validateGroupName } from '../validateGroupName';

describe('validateGroupName', () => {
  it('Acepta un string válido', () => {
    expect(validateGroupName('Grupo 1')).toBe(true);
    expect(validateGroupName('  A ')).toBe(true);
  });

  it('Rechaza string vacío o solo espacios', () => {
    expect(validateGroupName('')).toBe(false);
    expect(validateGroupName('   ')).toBe(false);
  });

  it('Rechaza valores no string', () => {
    expect(validateGroupName(null)).toBe(false);
    expect(validateGroupName(undefined)).toBe(false);
    expect(validateGroupName(123)).toBe(false);
    expect(validateGroupName({})).toBe(false);
  });
});

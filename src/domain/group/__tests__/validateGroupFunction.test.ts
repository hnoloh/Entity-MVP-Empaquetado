import { describe, it, expect } from 'vitest';
import { validateGroupFunction } from '../validateGroupFunction';

describe('validateGroupFunction', () => {
  it('Acepta un string válido', () => {
    expect(validateGroupFunction('Función del grupo')).toBe(true);
    expect(validateGroupFunction('  A ')).toBe(true);
  });

  it('Rechaza string vacío o solo espacios', () => {
    expect(validateGroupFunction('')).toBe(false);
    expect(validateGroupFunction('   ')).toBe(false);
  });

  it('Rechaza valores no string', () => {
    expect(validateGroupFunction(null)).toBe(false);
    expect(validateGroupFunction(undefined)).toBe(false);
    expect(validateGroupFunction(123)).toBe(false);
    expect(validateGroupFunction({})).toBe(false);
  });
});

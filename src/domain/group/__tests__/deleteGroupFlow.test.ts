import { describe, it, expect } from 'vitest';
import { deleteGroupFlow } from '../deleteGroupFlow';
import type { Group } from '../Group';

describe('deleteGroupFlow', () => {
  it('Elimina únicamente el Grupo objetivo existente', () => {
    const groups: Group[] = [
      { id: 'g1', type: 'group', name: 'G1' },
      { id: 'g2', type: 'group', name: 'G2' }
    ];
    const result = deleteGroupFlow(groups, 'g1');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('g2');
  });

  it('Preserva Grupos no objetivo', () => {
    const groups: Group[] = [
      { id: 'g1', type: 'group', name: 'G1' },
      { id: 'g2', type: 'group', name: 'G2' },
      { id: 'g3', type: 'group', name: 'G3' }
    ];
    const result = deleteGroupFlow(groups, 'g2');
    expect(result).toHaveLength(2);
    expect(result.map(g => g.id)).toEqual(['g1', 'g3']);
  });

  it('No muta ante groupId vacío', () => {
    const groups: Group[] = [{ id: 'g1', type: 'group', name: 'G1' }];
    const result = deleteGroupFlow(groups, '');
    expect(result).toBe(groups); // identity check
  });

  it('No muta ante groupId inexistente', () => {
    const groups: Group[] = [{ id: 'g1', type: 'group', name: 'G1' }];
    const result = deleteGroupFlow(groups, 'g2');
    expect(result).toBe(groups); // identity check
  });
});

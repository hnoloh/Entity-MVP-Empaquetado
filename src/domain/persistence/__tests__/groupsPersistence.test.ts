import { describe, it, expect } from 'vitest';
import type { Group } from '../../group/Group';
import {
  buildGroupsPersistencePayload,
  restoreGroupsFromPersistencePayload,
  type GroupPersistencePayload
} from '../groupsPersistence';

describe('Groups Functional Persistence', () => {
  const validGroup: Group = {
    id: 'group-1',
    type: 'group',
    name: 'Test Group',
    function: 'Tester',
    slots: {
      '1': 'enti-1',
      '3': 'enti-2'
    }
  };

  it('builds payload successfully from valid array', () => {
    const result = buildGroupsPersistencePayload([validGroup]);
    expect(result.status).toBe('success');
    expect(result.payload?.root).toBe('groups');
    expect(result.payload?.data.length).toBe(1);
    expect(result.payload?.data[0].id).toBe('group-1');
  });

  it('restores groups successfully from valid payload', () => {
    const payload: GroupPersistencePayload = {
      root: 'groups',
      version: '1.0',
      data: [validGroup]
    };
    const result = restoreGroupsFromPersistencePayload(payload);
    expect(result.status).toBe('success');
    expect(result.groups?.length).toBe(1);
    expect(result.groups?.[0].id).toBe('group-1');
    expect(result.groups?.[0].slots?.['1']).toBe('enti-1');
    expect(result.groups?.[0].slots?.['3']).toBe('enti-2');
  });

  it('preserves gaps in slots without compacting', () => {
    const payload: GroupPersistencePayload = {
      root: 'groups',
      version: '1.0',
      data: [{ ...validGroup, slots: { '2': 'enti-a', '5': 'enti-b' } }]
    };
    const result = restoreGroupsFromPersistencePayload(payload);
    expect(result.status).toBe('success');
    expect(result.groups?.[0].slots?.['2']).toBe('enti-a');
    expect(result.groups?.[0].slots?.['5']).toBe('enti-b');
    expect(result.groups?.[0].slots?.['1']).toBeUndefined();
  });

  it('returns controlled_error when payload is not an object', () => {
    const result = restoreGroupsFromPersistencePayload(null);
    expect(result.status).toBe('controlled_error');
    expect(result.error).toMatch(/Payload must be an object/);
  });

  it('returns controlled_error when root is not groups', () => {
    const result = restoreGroupsFromPersistencePayload({ root: 'entis', data: [] });
    expect(result.status).toBe('controlled_error');
    expect(result.error).toMatch(/Invalid root/);
  });

  it('returns controlled_error on duplicate Group IDs', () => {
    const payload: GroupPersistencePayload = {
      root: 'groups',
      version: '1.0',
      data: [validGroup, validGroup]
    };
    const result = restoreGroupsFromPersistencePayload(payload);
    expect(result.status).toBe('controlled_error');
    expect(result.error).toMatch(/Duplicate Group id/);
  });

  it('returns controlled_error on duplicate Enti IDs in same Group slots', () => {
    const invalidGroup = { ...validGroup, slots: { '1': 'enti-dup', '2': 'enti-dup' } };
    const payload: GroupPersistencePayload = {
      root: 'groups',
      version: '1.0',
      data: [invalidGroup]
    };
    const result = restoreGroupsFromPersistencePayload(payload);
    expect(result.status).toBe('controlled_error');
    expect(result.error).toMatch(/Duplicate entiId/);
  });

  it('returns controlled_error when slot id is out of range', () => {
    const invalidGroup = { ...validGroup, slots: { '6': 'enti-6' } } as unknown;  
    const payload: GroupPersistencePayload = {
      root: 'groups',
      version: '1.0',
      data: [invalidGroup]
    };
    const result = restoreGroupsFromPersistencePayload(payload);
    expect(result.status).toBe('controlled_error');
    expect(result.error).toMatch(/Invalid slot id 6/);
  });

  it('returns controlled_error when forbidden fields are present', () => {
    const invalidGroup = { ...validGroup, extra: 123 } as unknown;  
    const payload: GroupPersistencePayload = {
      root: 'groups',
      version: '1.0',
      data: [invalidGroup]
    };
    const result = restoreGroupsFromPersistencePayload(payload);
    expect(result.status).toBe('controlled_error');
    expect(result.error).toMatch(/Forbidden fields found/);
  });
});

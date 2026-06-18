import { describe, it, expect } from 'vitest';
import {
  persistGroupMemberPositionsFlow,
  restoreGroupMemberPositionsFlow,
  type GroupMemberPositionsPersistencePayload,
  type GroupMemberPositionsPersistenceRequest,
  type GroupMemberPositionsRestoreRequest,
  type GroupMemberPositionState
} from '../groupMemberPositionsPersistence';

describe('Group Member Positions Functional Persistence', () => {
  const validPos: GroupMemberPositionState = {
    groupId: 'group-1',
    slots: {
      '1': 'enti-1',
      '3': 'enti-2' // gap preserved
    }
  };

  it('blocks execution without explicit user action', () => {
    const request: GroupMemberPositionsPersistenceRequest = { explicitUserAction: false, positions: [validPos] };
    const result = persistGroupMemberPositionsFlow(request);
    expect(result.status).toBe('blocked');
    expect(result.error).toMatch(/Missing explicit user action/);
  });

  it('persist group member positions success', () => {
    const request: GroupMemberPositionsPersistenceRequest = { explicitUserAction: true, positions: [validPos] };
    const result = persistGroupMemberPositionsFlow(request);
    
    expect(result.status).toBe('success');
    expect(result.payload?.root).toBe('member_positions');
    expect(result.payload?.data.length).toBe(1);
    expect(result.payload?.data[0].groupId).toBe('group-1');
  });

  it('restore group member positions success and preservación de huecos sin compactación', () => {
    const payload: GroupMemberPositionsPersistencePayload = {
      root: 'member_positions',
      version: '1.0',
      data: [validPos]
    };

    const request: GroupMemberPositionsRestoreRequest = { explicitUserAction: true, payload };
    const result = restoreGroupMemberPositionsFlow(request);

    expect(result.status).toBe('success');
    expect(result.positions?.length).toBe(1);
    expect(result.positions?.[0].groupId).toBe('group-1');
    expect(result.positions?.[0].slots['1']).toBe('enti-1');
    expect(result.positions?.[0].slots['2']).toBeUndefined(); // hueco estructural
    expect(result.positions?.[0].slots['3']).toBe('enti-2');
  });

  it('controlled_error por groupId ausente o duplicado', () => {
    const request: GroupMemberPositionsPersistenceRequest = { explicitUserAction: true, positions: [validPos, validPos] };
    const result = persistGroupMemberPositionsFlow(request);
    expect(result.status).toBe('controlled_error');
    expect(result.error).toMatch(/Duplicate groupId/);
  });

  it('controlled_error por raíz inválida', () => {
    const request: GroupMemberPositionsRestoreRequest = { explicitUserAction: true, payload: { root: 'invalid', data: [] } };
    const result = restoreGroupMemberPositionsFlow(request);
    expect(result.status).toBe('controlled_error');
    expect(result.error).toMatch(/Invalid root/);
  });

  it('controlled_error por slotId fuera de rango', () => {
    const invalidPos: GroupMemberPositionState = {
      groupId: 'group-2',
      slots: { '6': 'enti-1' } as unknown  
    };
    const request: GroupMemberPositionsPersistenceRequest = { explicitUserAction: true, positions: [invalidPos] };
    const result = persistGroupMemberPositionsFlow(request);
    expect(result.status).toBe('controlled_error');
    expect(result.error).toMatch(/Invalid slot id 6/);
  });

  it('controlled_error por entiId ausente en slot ocupado', () => {
    const invalidPos: GroupMemberPositionState = {
      groupId: 'group-2',
      slots: { '1': 123 } as unknown  
    };
    const request: GroupMemberPositionsPersistenceRequest = { explicitUserAction: true, positions: [invalidPos] };
    const result = persistGroupMemberPositionsFlow(request);
    expect(result.status).toBe('controlled_error');
    expect(result.error).toMatch(/invalid entiId type/);
  });

  it('controlled_error por payload con secretos/API keys', () => {
    const payload: GroupMemberPositionsPersistencePayload = {
      root: 'member_positions',
      version: '1.0',
      data: [{ ...validPos, apiKey: 'secret' } as unknown]  
    };
    const request: GroupMemberPositionsRestoreRequest = { explicitUserAction: true, payload };
    const result = restoreGroupMemberPositionsFlow(request);
    expect(result.status).toBe('controlled_error');
    expect(result.error).toMatch(/Forbidden state or secret/);
  });

  it('controlled_error por provider state, Runtime state o visual state', () => {
    const payload: GroupMemberPositionsPersistencePayload = {
      root: 'member_positions',
      version: '1.0',
      data: [{ ...validPos, visualState: { visible: true } } as unknown]  
    };
    const request: GroupMemberPositionsRestoreRequest = { explicitUserAction: true, payload };
    const result = restoreGroupMemberPositionsFlow(request);
    expect(result.status).toBe('controlled_error');
    expect(result.error).toMatch(/Forbidden state or secret/);
  });
});

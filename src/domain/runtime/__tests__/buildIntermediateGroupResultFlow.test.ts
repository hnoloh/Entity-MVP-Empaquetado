import { describe, it, expect } from 'vitest';
import { buildIntermediateGroupResultFlow } from '../buildIntermediateGroupResultFlow';
import type { IntermediateGroupResultRequest } from '../RuntimeExecutionRequest';
import type { GroupSequenceInitializationResult, GroupSlotExecutionResult } from '../RuntimeExecutionResult';
import fs from 'fs';
import path from 'path';

describe('buildIntermediateGroupResultFlow', () => {
  const validSequenceState: GroupSequenceInitializationResult = {
    status: 'initialized',
    groupId: 'group-1',
    chatId: 'chat-1',
    currentSlotId: '1',
    pendingSlotIds: ['1', '2'],
    completedSlotIds: []
  };

  const validSlotExecutionResult: GroupSlotExecutionResult = {
    status: 'executed',
    groupId: 'group-1',
    chatId: 'chat-1',
    slotId: '1',
    entiId: 'enti-1',
    executionId: 'exec-123',
    responseText: 'Respuesta simulada'
  };

  it('TEST-FIA008-01: success con secuencia inicializada y slot actual ejecutado', () => {
    const request: IntermediateGroupResultRequest = {
      sequenceState: validSequenceState,
      groupId: 'group-1',
      currentSlotId: '1',
      slotExecutionResult: validSlotExecutionResult,
      explicitUserAction: true
    };

    const result = buildIntermediateGroupResultFlow(request);

    expect(result.status).toBe('success');
    expect(result.groupId).toBe('group-1');
    expect(result.chatId).toBe('chat-1');
    expect(result.slotId).toBe('1');
    expect(result.entiId).toBe('enti-1');
    expect(result.executionId).toBe('exec-123');
    expect(result.responseText).toBe('Respuesta simulada');
  });

  it('TEST-FIA008-02: blocked sin acción explícita', () => {
    const request: IntermediateGroupResultRequest = {
      sequenceState: validSequenceState,
      groupId: 'group-1',
      currentSlotId: '1',
      slotExecutionResult: validSlotExecutionResult,
      explicitUserAction: false
    };

    const result = buildIntermediateGroupResultFlow(request);
    expect(result.status).toBe('blocked');
    expect(result.error).toContain('explícita');
  });

  it('TEST-FIA008-03: controlled_error sin secuencia inicializada', () => {
    const request: IntermediateGroupResultRequest = {
      sequenceState: { ...validSequenceState, status: 'blocked' } as unknown as GroupSequenceInitializationResult,
      groupId: 'group-1',
      currentSlotId: '1',
      slotExecutionResult: validSlotExecutionResult,
      explicitUserAction: true
    };

    const result = buildIntermediateGroupResultFlow(request);
    expect(result.status).toBe('controlled_error');
    expect(result.error).toContain('válida');
  });

  it('TEST-FIA008-04: controlled_error sin currentSlotId o mismatch', () => {
    const request: IntermediateGroupResultRequest = {
      sequenceState: validSequenceState,
      groupId: 'group-1',
      currentSlotId: '2', // mismatch
      slotExecutionResult: validSlotExecutionResult,
      explicitUserAction: true
    };

    const result = buildIntermediateGroupResultFlow(request);
    expect(result.status).toBe('controlled_error');
    expect(result.error).toContain('coincide');
  });

  it('TEST-FIA008-05: controlled_error sin resultado de slot actual', () => {
    const request: IntermediateGroupResultRequest = {
      sequenceState: validSequenceState,
      groupId: 'group-1',
      currentSlotId: '1',
      slotExecutionResult: null as unknown as GroupSlotExecutionResult,
      explicitUserAction: true
    };

    const result = buildIntermediateGroupResultFlow(request);
    expect(result.status).toBe('controlled_error');
    expect(result.error).toContain('Falta el resultado');
  });

  it('TEST-FIA008-06: blocked si el resultado de slot está bloqueado', () => {
    const request: IntermediateGroupResultRequest = {
      sequenceState: validSequenceState,
      groupId: 'group-1',
      currentSlotId: '1',
      slotExecutionResult: { ...validSlotExecutionResult, status: 'blocked' },
      explicitUserAction: true
    };

    const result = buildIntermediateGroupResultFlow(request);
    expect(result.status).toBe('blocked');
  });

  it('TEST-FIA008-07: No mutation verification (forbidden units)', () => {
    const code = fs.readFileSync(path.join(__dirname, '../buildIntermediateGroupResultFlow.ts'), 'utf-8');
    expect(code).not.toContain('window.');
    expect(code).not.toContain('localStorage');
    expect(code).not.toContain('executeCurrentGroupSlotFlow'); // No next slot execution
    expect(code).not.toContain('Provider'); // No provider new
  });
});

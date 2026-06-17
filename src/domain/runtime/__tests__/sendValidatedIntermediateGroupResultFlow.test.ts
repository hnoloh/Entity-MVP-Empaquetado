import { describe, it, expect } from 'vitest';
import { sendValidatedIntermediateGroupResultFlow } from '../sendValidatedIntermediateGroupResultFlow';
import type { ValidatedIntermediateGroupResultSendRequest } from '../RuntimeExecutionRequest';
import type { IntermediateGroupResult, IntermediateGroupValidationResult } from '../RuntimeExecutionResult';
import fs from 'fs';
import path from 'path';

describe('sendValidatedIntermediateGroupResultFlow', () => {
  const validIntermediateResult: IntermediateGroupResult = {
    status: 'success',
    groupId: 'group-1',
    chatId: 'chat-1',
    slotId: '1',
    entiId: 'enti-1',
    executionId: 'exec-123',
    responseText: 'Respuesta validada'
  };

  const validValidationResult: IntermediateGroupValidationResult = {
    status: 'valid',
    groupId: 'group-1',
    chatId: 'chat-1',
    slotId: '1',
    entiId: 'enti-1'
  };

  it('TEST-FIA010-01: success con resultado intermedio validado', () => {
    const request: ValidatedIntermediateGroupResultSendRequest = {
      intermediateResult: validIntermediateResult,
      validationResult: validValidationResult,
      explicitUserAction: true
    };

    const result = sendValidatedIntermediateGroupResultFlow(request);

    expect(result.status).toBe('sent');
    expect(result.groupId).toBe('group-1');
    expect(result.chatId).toBe('chat-1');
    expect(result.slotId).toBe('1');
    expect(result.entiId).toBe('enti-1');
    expect(result.responseText).toBe('Respuesta validada');
  });

  it('TEST-FIA010-02: blocked sin acción explícita', () => {
    const request: ValidatedIntermediateGroupResultSendRequest = {
      intermediateResult: validIntermediateResult,
      validationResult: validValidationResult,
      explicitUserAction: false
    };

    const result = sendValidatedIntermediateGroupResultFlow(request);
    expect(result.status).toBe('blocked');
    expect(result.error).toContain('explícita');
  });

  it('TEST-FIA010-03: controlled_error sin resultado intermedio', () => {
    const request: ValidatedIntermediateGroupResultSendRequest = {
      intermediateResult: null as unknown as IntermediateGroupResult,
      validationResult: validValidationResult,
      explicitUserAction: true
    };

    const result = sendValidatedIntermediateGroupResultFlow(request);
    expect(result.status).toBe('controlled_error');
    expect(result.error).toContain('Falta el resultado intermedio');
  });

  it('TEST-FIA010-04: controlled_error sin validación previa', () => {
    const request: ValidatedIntermediateGroupResultSendRequest = {
      intermediateResult: validIntermediateResult,
      validationResult: null as unknown as IntermediateGroupValidationResult,
      explicitUserAction: true
    };

    const result = sendValidatedIntermediateGroupResultFlow(request);
    expect(result.status).toBe('controlled_error');
    expect(result.error).toContain('Falta el resultado de validación');
  });

  it('TEST-FIA010-05: blocked si validación previa no es valid', () => {
    const request: ValidatedIntermediateGroupResultSendRequest = {
      intermediateResult: validIntermediateResult,
      validationResult: { ...validValidationResult, status: 'blocked' },
      explicitUserAction: true
    };

    const result = sendValidatedIntermediateGroupResultFlow(request);
    expect(result.status).toBe('blocked');
    expect(result.error).toContain('no es válido');
  });

  it('TEST-FIA010-06: controlled_error si hay inconsistencia en trazabilidad', () => {
    const request: ValidatedIntermediateGroupResultSendRequest = {
      intermediateResult: validIntermediateResult,
      validationResult: { ...validValidationResult, slotId: '2' }, // Inconsistencia
      explicitUserAction: true
    };

    const result = sendValidatedIntermediateGroupResultFlow(request);
    expect(result.status).toBe('controlled_error');
    expect(result.error).toContain('inconsistente');
  });

  it('TEST-FIA010-07: controlled_error si falta trazabilidad mínima en el resultado', () => {
    const request: ValidatedIntermediateGroupResultSendRequest = {
      intermediateResult: { ...validIntermediateResult, groupId: undefined },
      validationResult: { ...validValidationResult, groupId: undefined },
      explicitUserAction: true
    };

    const result = sendValidatedIntermediateGroupResultFlow(request);
    expect(result.status).toBe('controlled_error');
    expect(result.error).toContain('mínima');
  });

  it('TEST-FIA010-08: Forbidden units (no mutation, no next-slot execution, no transfer)', () => {
    const code = fs.readFileSync(path.join(__dirname, '../sendValidatedIntermediateGroupResultFlow.ts'), 'utf-8');
    expect(code).not.toContain('window.');
    expect(code).not.toContain('localStorage');
    expect(code).not.toContain('executeCurrentGroupSlotFlow'); 
    expect(code).not.toContain('Provider');
    expect(code).not.toContain('nextSlot'); 
  });
});

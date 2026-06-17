import { describe, it, expect } from 'vitest';
import { validateIntermediateGroupResultFlow } from '../validateIntermediateGroupResultFlow';
import type { IntermediateGroupValidationRequest } from '../RuntimeExecutionRequest';
import type { IntermediateGroupResult } from '../RuntimeExecutionResult';
import fs from 'fs';
import path from 'path';

describe('validateIntermediateGroupResultFlow', () => {
  const validIntermediateResult: IntermediateGroupResult = {
    status: 'success',
    groupId: 'group-1',
    chatId: 'chat-1',
    slotId: '1',
    entiId: 'enti-1',
    executionId: 'exec-123',
    responseText: 'Respuesta simulada que pasará la validación'
  };

  it('TEST-FIA009-01: validación success con resultado intermedio completo', () => {
    const request: IntermediateGroupValidationRequest = {
      intermediateResult: validIntermediateResult,
      explicitUserAction: true
    };

    const result = validateIntermediateGroupResultFlow(request);

    expect(result.status).toBe('valid');
    expect(result.groupId).toBe('group-1');
    expect(result.chatId).toBe('chat-1');
    expect(result.slotId).toBe('1');
    expect(result.entiId).toBe('enti-1');
  });

  it('TEST-FIA009-02: blocked sin acción explícita', () => {
    const request: IntermediateGroupValidationRequest = {
      intermediateResult: validIntermediateResult,
      explicitUserAction: false
    };

    const result = validateIntermediateGroupResultFlow(request);
    expect(result.status).toBe('blocked');
    expect(result.error).toContain('explícita');
  });

  it('TEST-FIA009-03: controlled_error sin resultado intermedio', () => {
    const request: IntermediateGroupValidationRequest = {
      intermediateResult: null as unknown as IntermediateGroupResult,
      explicitUserAction: true
    };

    const result = validateIntermediateGroupResultFlow(request);
    expect(result.status).toBe('controlled_error');
    expect(result.error).toContain('Falta el resultado');
  });

  it('TEST-FIA009-04: controlled_error por falta de groupId', () => {
    const request: IntermediateGroupValidationRequest = {
      intermediateResult: { ...validIntermediateResult, groupId: undefined },
      explicitUserAction: true
    };

    const result = validateIntermediateGroupResultFlow(request);
    expect(result.status).toBe('controlled_error');
    expect(result.error).toContain('groupId');
  });

  it('TEST-FIA009-05: controlled_error por falta de chatId', () => {
    const request: IntermediateGroupValidationRequest = {
      intermediateResult: { ...validIntermediateResult, chatId: undefined },
      explicitUserAction: true
    };

    const result = validateIntermediateGroupResultFlow(request);
    expect(result.status).toBe('controlled_error');
    expect(result.error).toContain('chatId');
  });

  it('TEST-FIA009-06: controlled_error por falta de currentSlotId', () => {
    const request: IntermediateGroupValidationRequest = {
      intermediateResult: { ...validIntermediateResult, slotId: undefined },
      explicitUserAction: true
    };

    const result = validateIntermediateGroupResultFlow(request);
    expect(result.status).toBe('controlled_error');
    expect(result.error).toContain('slotId');
  });

  it('TEST-FIA009-07: controlled_error por falta de entiId', () => {
    const request: IntermediateGroupValidationRequest = {
      intermediateResult: { ...validIntermediateResult, entiId: undefined },
      explicitUserAction: true
    };

    const result = validateIntermediateGroupResultFlow(request);
    expect(result.status).toBe('controlled_error');
    expect(result.error).toContain('entiId');
  });

  it('TEST-FIA009-08: controlled_error por respuesta vacía', () => {
    const request: IntermediateGroupValidationRequest = {
      intermediateResult: { ...validIntermediateResult, responseText: '   ' },
      explicitUserAction: true
    };

    const result = validateIntermediateGroupResultFlow(request);
    expect(result.status).toBe('controlled_error');
    expect(result.error).toContain('vacío');
  });

  it('TEST-FIA009-09: controlled_error si el resultado intermedio no es success', () => {
    const request: IntermediateGroupValidationRequest = {
      intermediateResult: { ...validIntermediateResult, status: 'blocked' },
      explicitUserAction: true
    };

    const result = validateIntermediateGroupResultFlow(request);
    expect(result.status).toBe('controlled_error');
    expect(result.error).toContain('no tuvo éxito');
  });

  it('TEST-FIA009-10: Forbidden units (no mutation, no next-slot, no provider)', () => {
    const code = fs.readFileSync(path.join(__dirname, '../validateIntermediateGroupResultFlow.ts'), 'utf-8');
    expect(code).not.toContain('window.');
    expect(code).not.toContain('localStorage');
    expect(code).not.toContain('executeCurrentGroupSlotFlow'); 
    expect(code).not.toContain('Provider');
    expect(code).not.toContain('group.slots'); 
  });
});

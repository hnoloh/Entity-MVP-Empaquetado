import { describe, it, expect } from 'vitest';
import { startRuntimeExecutionFlow } from '../startRuntimeExecutionFlow';
import type { RuntimeExecutionRequest } from '../RuntimeExecutionRequest';

describe('startRuntimeExecutionFlow', () => {
  it('Rechaza ejecución si no es acción explícita', () => {
    const request: RuntimeExecutionRequest = {
      entiId: 'enti-1',
      chatId: 'chat-1',
      explicitUserAction: false,
      targetType: 'ENTI'
    };
    const result = startRuntimeExecutionFlow(request);
    expect(result.success).toBe(false);
    expect(result.status).toBe('rejected');
    expect(result.error).toContain('explicit user action');
  });

  it('Rechaza ejecución si falta entiId', () => {
    const request: RuntimeExecutionRequest = {
      entiId: '',
      chatId: 'chat-1',
      explicitUserAction: true,
      targetType: 'ENTI'
    };
    const result = startRuntimeExecutionFlow(request);
    expect(result.success).toBe(false);
    expect(result.status).toBe('rejected');
    expect(result.error).toContain('entiId is required');
  });

  it('Rechaza ejecución si falta chatId', () => {
    const request: RuntimeExecutionRequest = {
      entiId: 'enti-1',
      chatId: '',
      explicitUserAction: true,
      targetType: 'ENTI'
    };
    const result = startRuntimeExecutionFlow(request);
    expect(result.success).toBe(false);
    expect(result.status).toBe('rejected');
    expect(result.error).toContain('chatId is required');
  });

  it('Rechaza ejecución si targetType es distinto a ENTI', () => {
    const request = {
      entiId: 'enti-1',
      chatId: 'chat-1',
      explicitUserAction: true,
      targetType: 'GRUPO'
    } as unknown as import('../RuntimeExecutionRequest').RuntimeExecutionRequest;
    const result = startRuntimeExecutionFlow(request);
    expect(result.success).toBe(false);
    expect(result.status).toBe('rejected');
    expect(result.error).toContain('Target type must be ENTI');
  });

  it('Devuelve resultado de arranque estructurado válido si todo es correcto', () => {
    const request: RuntimeExecutionRequest = {
      entiId: 'enti-1',
      chatId: 'chat-1',
      explicitUserAction: true,
      targetType: 'ENTI'
    };
    const result = startRuntimeExecutionFlow(request);
    expect(result.success).toBe(true);
    expect(result.status).toBe('started');
    expect(result.executionId).toBeDefined();
    // Validamos explícitamente que no se genera responseText (para cumplir FIA-001)
    expect('responseText' in result).toBe(false);
  });

  it('Es determinista: misma entrada válida produce mismo status', () => {
    const request: RuntimeExecutionRequest = {
      entiId: 'enti-2',
      chatId: 'chat-2',
      explicitUserAction: true,
      targetType: 'ENTI'
    };
    const r1 = startRuntimeExecutionFlow(request);
    const r2 = startRuntimeExecutionFlow(request);
    expect(r1.success).toBe(r2.success);
    expect(r1.status).toBe(r2.status);
  });
});

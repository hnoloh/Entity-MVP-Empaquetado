import { describe, it, expect } from 'vitest';
import { buildFinalGroupResultFlow } from '../buildFinalGroupResultFlow';
import { FinalGroupResultRequest } from '../RuntimeExecutionRequest';
import { GroupSequenceAdvanceResult, ValidatedIntermediateGroupResultSendResult } from '../RuntimeExecutionResult';
import fs from 'fs';
import path from 'path';

describe('buildFinalGroupResultFlow', () => {
  const validAdvanceResult: GroupSequenceAdvanceResult = {
    status: 'completed',
    groupId: 'group-1',
    chatId: 'chat-1',
    previousSlotId: 'slot-2'
  };

  const validSentResults: ValidatedIntermediateGroupResultSendResult[] = [
    {
      status: 'sent',
      groupId: 'group-1',
      chatId: 'chat-1',
      slotId: 'slot-1',
      entiId: 'enti-1',
      responseText: 'Respuesta 1'
    },
    {
      status: 'sent',
      groupId: 'group-1',
      chatId: 'chat-1',
      slotId: 'slot-2',
      entiId: 'enti-2',
      responseText: 'Respuesta 2'
    }
  ];

  it('TEST-FIA012-01: success con secuencia completed y resultados enviados', () => {
    const request: FinalGroupResultRequest = {
      explicitUserAction: true,
      groupId: 'group-1',
      chatId: 'chat-1',
      advanceResult: validAdvanceResult,
      sentResults: validSentResults
    };

    const result = buildFinalGroupResultFlow(request);

    expect(result.status).toBe('finalized');
    expect(result.groupId).toBe('group-1');
    expect(result.chatId).toBe('chat-1');
    expect(result.results).toHaveLength(2);
    expect(result.results?.[0].slotId).toBe('slot-1');
  });

  it('TEST-FIA012-02: blocked sin acción explícita', () => {
    const request: FinalGroupResultRequest = {
      explicitUserAction: false,
      groupId: 'group-1',
      chatId: 'chat-1',
      advanceResult: validAdvanceResult,
      sentResults: validSentResults
    };

    const result = buildFinalGroupResultFlow(request);
    expect(result.status).toBe('blocked');
    expect(result.error).toContain('explícita');
  });

  it('TEST-FIA012-03: controlled_error si secuencia no está completed', () => {
    const request: FinalGroupResultRequest = {
      explicitUserAction: true,
      groupId: 'group-1',
      chatId: 'chat-1',
      advanceResult: { ...validAdvanceResult, status: 'advanced' },
      sentResults: validSentResults
    };

    const result = buildFinalGroupResultFlow(request);
    expect(result.status).toBe('controlled_error');
    expect(result.error).toContain('completed');
  });

  it('TEST-FIA012-04: controlled_error sin resultados enviados', () => {
    const request: FinalGroupResultRequest = {
      explicitUserAction: true,
      groupId: 'group-1',
      chatId: 'chat-1',
      advanceResult: validAdvanceResult,
      sentResults: []
    };

    const result = buildFinalGroupResultFlow(request);
    expect(result.status).toBe('controlled_error');
    expect(result.error).toContain('Faltan resultados');
  });

  it('TEST-FIA012-05: controlled_error por falta de groupId en el request', () => {
    const request: FinalGroupResultRequest = {
      explicitUserAction: true,
      groupId: 'group-2', // inconsistencia
      chatId: 'chat-1',
      advanceResult: validAdvanceResult,
      sentResults: validSentResults
    };

    const result = buildFinalGroupResultFlow(request);
    expect(result.status).toBe('controlled_error');
    expect(result.error).toContain('inconsistente');
  });

  it('TEST-FIA012-06: controlled_error por falta de chatId', () => {
    const request: FinalGroupResultRequest = {
      explicitUserAction: true,
      groupId: 'group-1',
      chatId: 'chat-2', // inconsistencia
      advanceResult: validAdvanceResult,
      sentResults: validSentResults
    };

    const result = buildFinalGroupResultFlow(request);
    expect(result.status).toBe('controlled_error');
    expect(result.error).toContain('inconsistente');
  });

  it('TEST-FIA012-07: controlled_error por trazabilidad incompleta en sentResults', () => {
    const request: FinalGroupResultRequest = {
      explicitUserAction: true,
      groupId: 'group-1',
      chatId: 'chat-1',
      advanceResult: validAdvanceResult,
      sentResults: [{ ...validSentResults[0], slotId: undefined }]
    };

    const result = buildFinalGroupResultFlow(request);
    expect(result.status).toBe('controlled_error');
    expect(result.error).toContain('trazabilidad');
  });

  it('TEST-FIA012-08: Forbidden units (no mutation, no provider, no UI)', () => {
    const code = fs.readFileSync(path.join(__dirname, '../buildFinalGroupResultFlow.ts'), 'utf-8');
    expect(code).not.toContain('window.');
    expect(code).not.toContain('localStorage');
    expect(code).not.toContain('executeCurrentGroupSlotFlow'); 
    expect(code).not.toContain('Provider');
  });
});

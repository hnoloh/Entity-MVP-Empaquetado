import { describe, it, expect } from 'vitest';
import { advanceGroupSequenceFlow } from '../advanceGroupSequenceFlow';
import { GroupSequenceAdvanceRequest } from '../RuntimeExecutionRequest';
import { GroupSequenceInitializationResult, ValidatedIntermediateGroupResultSendResult } from '../RuntimeExecutionResult';
import fs from 'fs';
import path from 'path';

describe('advanceGroupSequenceFlow', () => {
  const validSequenceState: GroupSequenceInitializationResult = {
    status: 'initialized',
    groupId: 'group-1',
    chatId: 'chat-1',
    sequenceId: 'seq-1',
    currentSlotId: 'slot-1',
    pendingSlotIds: ['slot-1', 'slot-2', 'slot-3'],
    completedSlotIds: []
  };

  const validSentResult: ValidatedIntermediateGroupResultSendResult = {
    status: 'sent',
    groupId: 'group-1',
    chatId: 'chat-1',
    slotId: 'slot-1',
    entiId: 'enti-1',
    responseText: 'Enviado'
  };

  it('TEST-FIA011-01: success avance al siguiente slot ejecutable', () => {
    const request: GroupSequenceAdvanceRequest = {
      explicitUserAction: true,
      groupId: 'group-1',
      chatId: 'chat-1',
      currentSlotId: 'slot-1',
      sequenceState: validSequenceState,
      sentResult: validSentResult
    };

    const result = advanceGroupSequenceFlow(request);

    expect(result.status).toBe('advanced');
    expect(result.groupId).toBe('group-1');
    expect(result.chatId).toBe('chat-1');
    expect(result.previousSlotId).toBe('slot-1');
    expect(result.nextSlotId).toBe('slot-2');
    
    expect(result.updatedSequenceState).toBeDefined();
    expect(result.updatedSequenceState?.currentSlotId).toBe('slot-2');
    expect(result.updatedSequenceState?.completedSlotIds).toContain('slot-1');
  });

  it('TEST-FIA011-02: completed cuando no existe siguiente slot', () => {
    const request: GroupSequenceAdvanceRequest = {
      explicitUserAction: true,
      groupId: 'group-1',
      chatId: 'chat-1',
      currentSlotId: 'slot-3',
      sequenceState: { ...validSequenceState, currentSlotId: 'slot-3', completedSlotIds: ['slot-1', 'slot-2'] },
      sentResult: { ...validSentResult, slotId: 'slot-3' }
    };

    const result = advanceGroupSequenceFlow(request);

    expect(result.status).toBe('completed');
    expect(result.groupId).toBe('group-1');
    expect(result.previousSlotId).toBe('slot-3');
    expect(result.nextSlotId).toBeUndefined();
    expect(result.updatedSequenceState?.currentSlotId).toBeUndefined();
    expect(result.updatedSequenceState?.completedSlotIds).toContain('slot-3');
  });

  it('TEST-FIA011-03: blocked sin acción explícita', () => {
    const request: GroupSequenceAdvanceRequest = {
      explicitUserAction: false,
      groupId: 'group-1',
      chatId: 'chat-1',
      currentSlotId: 'slot-1',
      sequenceState: validSequenceState,
      sentResult: validSentResult
    };

    const result = advanceGroupSequenceFlow(request);
    expect(result.status).toBe('blocked');
    expect(result.error).toContain('explícita');
  });

  it('TEST-FIA011-04: controlled_error sin estado de secuencia', () => {
    const request: GroupSequenceAdvanceRequest = {
      explicitUserAction: true,
      groupId: 'group-1',
      chatId: 'chat-1',
      currentSlotId: 'slot-1',
      sequenceState: null as unknown as GroupSequenceInitializationResult,
      sentResult: validSentResult
    };

    const result = advanceGroupSequenceFlow(request);
    expect(result.status).toBe('controlled_error');
    expect(result.error).toContain('Falta estado');
  });

  it('TEST-FIA011-05: controlled_error sin sentResult', () => {
    const request: GroupSequenceAdvanceRequest = {
      explicitUserAction: true,
      groupId: 'group-1',
      chatId: 'chat-1',
      currentSlotId: 'slot-1',
      sequenceState: validSequenceState,
      sentResult: null as unknown as ValidatedIntermediateGroupResultSendResult
    };

    const result = advanceGroupSequenceFlow(request);
    expect(result.status).toBe('controlled_error');
    expect(result.error).toContain('Falta resultado enviado');
  });

  it('TEST-FIA011-06: controlled_error si el resultado validado no fue enviado', () => {
    const request: GroupSequenceAdvanceRequest = {
      explicitUserAction: true,
      groupId: 'group-1',
      chatId: 'chat-1',
      currentSlotId: 'slot-1',
      sequenceState: validSequenceState,
      sentResult: { ...validSentResult, status: 'blocked' }
    };

    const result = advanceGroupSequenceFlow(request);
    expect(result.status).toBe('controlled_error');
    expect(result.error).toContain('no ha sido enviado');
  });

  it('TEST-FIA011-07: controlled_error por trazabilidad incompleta', () => {
    const request: GroupSequenceAdvanceRequest = {
      explicitUserAction: true,
      groupId: 'group-1',
      chatId: 'chat-1',
      currentSlotId: 'slot-1',
      sequenceState: validSequenceState,
      sentResult: { ...validSentResult, slotId: 'slot-2' } // inconsistencia
    };

    const result = advanceGroupSequenceFlow(request);
    expect(result.status).toBe('controlled_error');
    expect(result.error).toContain('inconsistente');
  });

  it('TEST-FIA011-08: Forbidden units (no mutation, no next-slot, no provider, no transfer)', () => {
    const code = fs.readFileSync(path.join(__dirname, '../advanceGroupSequenceFlow.ts'), 'utf-8');
    expect(code).not.toContain('window.');
    expect(code).not.toContain('localStorage');
    expect(code).not.toContain('executeCurrentGroupSlotFlow'); 
    expect(code).not.toContain('Provider');
    expect(code).not.toContain('chatRepo'); // No history mutation
  });
});

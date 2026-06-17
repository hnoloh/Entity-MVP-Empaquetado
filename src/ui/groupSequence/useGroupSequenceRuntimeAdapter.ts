import { useState, useCallback } from 'react';
import type { 
  GroupSequenceInitializationResult,
  IntermediateGroupResult,
  IntermediateGroupValidationResult,
  ValidatedIntermediateGroupResultSendResult,
  FinalGroupResult,
  GroupSlotExecutionResult
} from '../../domain/runtime';
import { 
  initializeGroupSequenceFlow,
  executeCurrentGroupSlotFlow,
  buildIntermediateGroupResultFlow,
  validateIntermediateGroupResultFlow,
  sendValidatedIntermediateGroupResultFlow,
  advanceGroupSequenceFlow,
  buildFinalGroupResultFlow,
  OpenAIExecutor,
  LocalExecutor
} from '../../domain/runtime';
import { receiveResponseToChatFlow } from '../../domain/chat/receiveResponseToChatFlow';
import type { Group } from '../../domain/group/Group';
import type { ChatRepository } from '../../domain/chat/chatRepository';
import type { EntiRepository } from '../../domain/enti/entiRepository';

export type GroupSequenceUIState = 
  | 'idle'
  | 'sequence_initialized'
  | 'slot_executed'
  | 'intermediate_ready'
  | 'validated'
  | 'sent'
  | 'advanced'
  | 'completed'
  | 'finalized'
  | 'blocked'
  | 'controlled_error';

export function useGroupSequenceRuntimeAdapter(
  groupId: string,
  chatId: string,
  groups: Group[],
  chatRepo: ChatRepository,
  entiRepo: EntiRepository
) {
  const [uiState, setUiState] = useState<GroupSequenceUIState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  
  const [sequenceState, setSequenceState] = useState<GroupSequenceInitializationResult | null>(null);
  const [slotExecutionResult, setSlotExecutionResult] = useState<GroupSlotExecutionResult | null>(null);
  const [intermediateResult, setIntermediateResult] = useState<IntermediateGroupResult | null>(null);
  const [validationResult, setValidationResult] = useState<IntermediateGroupValidationResult | null>(null);
  const [sentResults, setSentResults] = useState<ValidatedIntermediateGroupResultSendResult[]>([]);
  const [finalResult, setFinalResult] = useState<FinalGroupResult | null>(null);

  const handleError = (msg: string) => {
    setError(msg);
    setUiState('controlled_error');
    setIsExecuting(false);
  };

  const clearError = useCallback(() => {
    if (uiState === 'controlled_error' || uiState === 'blocked') {
      setError(null);
    }
  }, [uiState]);

  const initialize = useCallback(() => {
    clearError();

    const chat = chatRepo.getById(chatId);
    if (chat) {
      chat.history = [];
      chatRepo.save(chat);
    }

    const result = initializeGroupSequenceFlow(
      { requestedByUserAction: true, targetType: 'GROUP', groupId, groupChatId: chatId },
      groups,
      chatRepo
    );

    if (result.status === 'initialized') {
      setSequenceState(result);
      setUiState('sequence_initialized');
      setIntermediateResult(null);
      setValidationResult(null);
      setSlotExecutionResult(null);
      setSentResults([]);
      setFinalResult(null);
    } else {
      setUiState(result.status as GroupSequenceUIState);
      setError(result.error || 'Unknown error');
    }
  }, [groupId, chatId, groups, chatRepo, clearError]);

  const executeCurrentSlot = useCallback(async () => {
    clearError();
    if (!sequenceState || sequenceState.status !== 'initialized' || !sequenceState.currentSlotId) {
      return handleError('Secuencia no inicializada o sin slot actual');
    }

    const group = groups.find(g => g.id === groupId);
    if (!group) return handleError('Grupo no encontrado');

    const entiId = group.slots?.[sequenceState.currentSlotId as keyof typeof group.slots];
    if (!entiId) return handleError('Enti no encontrado en el slot actual');

    const enti = entiRepo.getById(entiId);
    if (!enti) return handleError('Enti no encontrado en el repositorio');

    const chat = chatRepo.getById(chatId);
    if (!chat) return handleError('Chat no encontrado');

    const config = enti.cognitiveConfig;
    let provider;
    if (config.mode === 'cloud' && config.provider === 'openai') {
      provider = new OpenAIExecutor(config.apiKey || '', config.model);
    } else if (config.mode === 'local') {
      provider = new LocalExecutor(config.model || '');
    } else {
      return handleError('Proveedor no soportado');
    }

    setIsExecuting(true);
    try {
      const result = await executeCurrentGroupSlotFlow(
        { explicitUserAction: true, groupId, chatId, currentSlotId: sequenceState.currentSlotId, sequenceState },
        groups,
        entiRepo.list(),
        chat,
        provider
      );

      if (result.status === 'executed' && result.responseText && result.executionId) {
        setSlotExecutionResult(result);
        setUiState('slot_executed');
      } else {
        setUiState(result.status as GroupSequenceUIState);
        setError(result.error || 'Execution failed');
      }
    } catch (e) {
      if (e instanceof Error) {
        handleError(e.message || 'Error executing slot');
      } else {
        handleError('Error executing slot');
      }
    } finally {
      setIsExecuting(false);
    }
  }, [groupId, chatId, sequenceState, groups, chatRepo, entiRepo, clearError]);

  const buildIntermediate = useCallback(() => {
    clearError();
    if (!sequenceState || !sequenceState.currentSlotId || !slotExecutionResult) {
      return handleError('Faltan datos de ejecución para construir el resultado');
    }

    const result = buildIntermediateGroupResultFlow({
      explicitUserAction: true,
      groupId,
      chatId,
      currentSlotId: sequenceState.currentSlotId,
      slotExecutionResult,
      sequenceState
    });

    if (result.status === 'success') {
      setIntermediateResult(result);
      setUiState('intermediate_ready');
    } else {
      setUiState(result.status as GroupSequenceUIState);
      setError(result.error || 'Build intermediate failed');
    }
  }, [groupId, chatId, sequenceState, slotExecutionResult, clearError]);

  const validateResult = useCallback(() => {
    clearError();
    if (!intermediateResult) return handleError('No hay resultado intermedio para validar');

    const result = validateIntermediateGroupResultFlow({
      explicitUserAction: true,
      intermediateResult
    });

    if (result.status === 'valid') {
      setValidationResult(result);
      setUiState('validated');
    } else {
      setUiState(result.status as GroupSequenceUIState);
      setError(result.error || 'Validación fallida');
    }
  }, [intermediateResult, clearError]);

  const sendResult = useCallback(() => {
    clearError();
    if (!intermediateResult || !validationResult) return handleError('Faltan datos para enviar');

    const result = sendValidatedIntermediateGroupResultFlow({
      explicitUserAction: true,
      intermediateResult,
      validationResult
    });

    if (result.status === 'sent') {
      setSentResults(prev => [...prev, result]);
      setUiState('sent');
      
      // Update chat history to reflect the response
      if (result.responseText) {
        receiveResponseToChatFlow(chatId, result.responseText);
      }
    } else {
      setUiState(result.status as GroupSequenceUIState);
      setError(result.error || 'Send failed');
    }
  }, [intermediateResult, validationResult, chatId, clearError]);

  const advanceSequence = useCallback(() => {
    clearError();
    if (!sequenceState || !sequenceState.currentSlotId) return handleError('Secuencia no inicializada');
    
    const lastSent = sentResults[sentResults.length - 1];
    if (!lastSent || lastSent.slotId !== sequenceState.currentSlotId) {
      return handleError('El resultado del slot actual no ha sido enviado');
    }

    const result = advanceGroupSequenceFlow({
      explicitUserAction: true,
      groupId,
      chatId,
      currentSlotId: sequenceState.currentSlotId,
      sequenceState,
      sentResult: lastSent
    });

    if (result.status === 'advanced') {
      setSequenceState(result.updatedSequenceState || null);
      setUiState('advanced');
      setSlotExecutionResult(null);
      setIntermediateResult(null);
      setValidationResult(null);
    } else if (result.status === 'completed') {
      setSequenceState(result.updatedSequenceState || null);
      setUiState('completed');
      const chat = chatRepo.getById(chatId);
      if (chat) {
        chat.history.push({ id: `sys-${Date.now()}`, role: 'system', content: 'La secuencia de grupo ha terminado.', timestamp: Date.now() });
        chatRepo.save(chat);
      }
    } else {
      setUiState(result.status as GroupSequenceUIState);
      setError(result.error || 'Advance failed');
    }
  }, [groupId, chatId, sequenceState, sentResults, chatRepo, clearError]);

  const finalizeSequence = useCallback(() => {
    clearError();
    if (uiState !== 'completed' && sequenceState?.status !== 'initialized') {
      return handleError('La secuencia no está completada');
    }

    const advanceRes = { status: 'completed' as const, previousSlotId: sequenceState?.completedSlotIds?.[sequenceState.completedSlotIds.length - 1] };

    const result = buildFinalGroupResultFlow({
      explicitUserAction: true,
      groupId,
      chatId,
      advanceResult: advanceRes as { status: 'completed', previousSlotId: string },
      sentResults
    });

    if (result.status === 'finalized') {
      setFinalResult(result);
      setUiState('finalized');
    } else {
      setUiState(result.status as GroupSequenceUIState);
      setError(result.error || 'Finalize failed');
    }
  }, [groupId, chatId, uiState, sequenceState, sentResults, clearError]);

  const macroValidateAndAdvance = useCallback(async () => {
    clearError();
    if (!sequenceState || !sequenceState.currentSlotId || !slotExecutionResult) {
      return handleError('Faltan datos de ejecución');
    }

    // 1. Build Intermediate
    const intermResult = buildIntermediateGroupResultFlow({
      explicitUserAction: true,
      groupId, chatId, currentSlotId: sequenceState.currentSlotId,
      slotExecutionResult, sequenceState
    });

    if (intermResult.status !== 'success') return handleError(intermResult.error || 'Error al construir resultado intermedio');

    // 2. Validate
    const validResult = validateIntermediateGroupResultFlow({
      explicitUserAction: true, intermediateResult: intermResult
    });

    if (validResult.status !== 'valid') return handleError(validResult.error || 'Validación fallida');

    // 3. Send
    const sResult = sendValidatedIntermediateGroupResultFlow({
      explicitUserAction: true, intermediateResult: intermResult, validationResult: validResult
    });

    if (sResult.status !== 'sent') return handleError(sResult.error || 'Error al enviar');

    // 4. Advance
    const advResult = advanceGroupSequenceFlow({
      explicitUserAction: true, groupId, chatId, currentSlotId: sequenceState.currentSlotId,
      sequenceState, sentResult: sResult
    });

    if (advResult.status === 'advanced') {
      setSequenceState(advResult.updatedSequenceState || null);
      setSentResults(prev => [...prev, sResult]);
      setUiState('advanced');
      setSlotExecutionResult(null);
      setIntermediateResult(null);
      setValidationResult(null);
    } else if (advResult.status === 'completed') {
      setSequenceState(advResult.updatedSequenceState || null);
      setSentResults(prev => [...prev, sResult]);
      setUiState('completed');
      const chat = chatRepo.getById(chatId);
      if (chat) {
        chat.history.push({ id: `sys-${Date.now()}`, role: 'system', content: 'La secuencia de grupo ha terminado.', timestamp: Date.now() });
        chatRepo.save(chat);
      }
    } else {
      handleError(advResult.error || 'Error al avanzar secuencia');
    }
  }, [groupId, chatId, sequenceState, slotExecutionResult, chatRepo, clearError]);

  const macroAdvanceWithCorrection = useCallback(async (correctionText: string) => {
    clearError();
    if (!sequenceState || !sequenceState.currentSlotId) {
      return handleError('Secuencia no inicializada');
    }

    const group = groups.find(g => g.id === groupId);
    const entiId = group?.slots?.[sequenceState.currentSlotId as keyof typeof group.slots] || 'user-correction';

    const fakeExecutionResult: GroupSlotExecutionResult = {
      status: 'executed',
      groupId,
      slotId: sequenceState.currentSlotId,
      entiId: entiId,
      chatId,
      executionId: `corr-${Date.now()}`,
      responseText: correctionText
    };

    // 1. Build Intermediate
    const intermResult = buildIntermediateGroupResultFlow({
      explicitUserAction: true,
      groupId, chatId, currentSlotId: sequenceState.currentSlotId,
      slotExecutionResult: fakeExecutionResult, sequenceState
    });

    if (intermResult.status !== 'success') return handleError(intermResult.error || 'Error al construir resultado intermedio');

    // 2. Validate
    const validResult = validateIntermediateGroupResultFlow({
      explicitUserAction: true, intermediateResult: intermResult
    });

    if (validResult.status !== 'valid') return handleError(validResult.error || 'Validación fallida');

    // 3. Send
    const sResult = sendValidatedIntermediateGroupResultFlow({
      explicitUserAction: true, intermediateResult: intermResult, validationResult: validResult
    });

    if (sResult.status !== 'sent') return handleError(sResult.error || 'Error al enviar');

    // 4. Advance
    const advResult = advanceGroupSequenceFlow({
      explicitUserAction: true, groupId, chatId, currentSlotId: sequenceState.currentSlotId,
      sequenceState, sentResult: sResult
    });

    if (advResult.status === 'advanced') {
      setSequenceState(advResult.updatedSequenceState || null);
      setSentResults(prev => [...prev, sResult]);
      setUiState('advanced');
      setSlotExecutionResult(null);
      setIntermediateResult(null);
      setValidationResult(null);
    } else if (advResult.status === 'completed') {
      setSequenceState(advResult.updatedSequenceState || null);
      setSentResults(prev => [...prev, sResult]);
      setUiState('completed');
      const chat = chatRepo.getById(chatId);
      if (chat) {
        chat.history.push({ id: `sys-${Date.now()}`, role: 'system', content: 'La secuencia de grupo ha terminado.', timestamp: Date.now() });
        chatRepo.save(chat);
      }
    } else {
      handleError(advResult.error || 'Error al avanzar secuencia');
    }
  }, [groupId, chatId, sequenceState, groups, chatRepo, clearError]);

  const reset = useCallback(() => {
    setUiState('idle');
    setSequenceState(null);
    setSlotExecutionResult(null);
    setIntermediateResult(null);
    setValidationResult(null);
    setSentResults([]);
    setFinalResult(null);
    setError(null);

    const chat = chatRepo.getById(chatId);
    if (chat) {
      chat.history = [];
      chatRepo.save(chat);
    }
  }, [chatId, chatRepo]);



  return {
    uiState,
    error,
    isExecuting,
    sequenceState,
    intermediateResult,
    validationResult,
    sentResults,
    finalResult,
    actions: {
      initialize,
      executeCurrentSlot,
      buildIntermediate,
      validateResult,
      sendResult,
      advanceSequence,
      finalizeSequence,
      macroValidateAndAdvance,
      macroAdvanceWithCorrection,
      reset
    }
  };
}

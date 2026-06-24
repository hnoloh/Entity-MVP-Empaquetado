import type { MVPFunctionalValidationResult } from './mvpFunctionalValidationResult';

export interface MVPReadinessGate {
  isReadyForPackaging: boolean;
  validationResult: MVPFunctionalValidationResult;
  blockReason: string | null;
}

export const evaluateMVPReadinessGate = (validationResult: MVPFunctionalValidationResult): MVPReadinessGate => {
  if (validationResult.status === 'PASSED') {
    return {
      isReadyForPackaging: true,
      validationResult,
      blockReason: null
    };
  }

  return {
    isReadyForPackaging: false,
    validationResult,
    blockReason: validationResult.errors.join(' | ') || 'Validación MVP no superada.'
  };
};

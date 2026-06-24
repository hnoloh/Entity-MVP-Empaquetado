import type { ManualValidationChecklist_RV09_FIA011 } from './manualValidationChecklist_RV09_FIA011';

export type MVPValidationStatus = 'PENDING' | 'PASSED' | 'FAILED' | 'DRIFT_DETECTED';

export interface MVPFunctionalValidationResult {
  status: MVPValidationStatus;
  checklist: ManualValidationChecklist_RV09_FIA011;
  driftDetected: boolean;
  forbiddenUnitsDetected: boolean;
  errors: string[];
  timestamp: string;
}

export const evaluateMVPFunctionalValidation = (
  checklist: ManualValidationChecklist_RV09_FIA011,
  driftDetected: boolean,
  forbiddenUnitsDetected: boolean
): MVPFunctionalValidationResult => {
  const errors: string[] = [];
  let status: MVPValidationStatus = 'PENDING';

  if (driftDetected) {
    status = 'DRIFT_DETECTED';
    errors.push('Drift arquitectónico detectado. La validación falla.');
  }

  if (forbiddenUnitsDetected) {
    status = 'FAILED';
    errors.push('Unidades prohibidas detectadas (ej. Tool Internet, RAG, fetch frontend). La validación falla.');
  }

  const checklistPassed = Object.values(checklist.steps).every(step => step === true);
  if (!checklistPassed && status !== 'DRIFT_DETECTED' && status !== 'FAILED') {
    status = 'PENDING';
    errors.push('Faltan pasos de validación manual E2E por completar.');
  }

  if (checklistPassed && !driftDetected && !forbiddenUnitsDetected) {
    status = 'PASSED';
  }

  return {
    status,
    checklist,
    driftDetected,
    forbiddenUnitsDetected,
    errors,
    timestamp: new Date().toISOString()
  };
};

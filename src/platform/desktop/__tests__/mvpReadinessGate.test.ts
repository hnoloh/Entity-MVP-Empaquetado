import { describe, it, expect } from 'vitest';
import { evaluateMVPReadinessGate } from '../mvpReadinessGate';
import { createFIA011Checklist } from '../manualValidationChecklist_RV09_FIA011';
import { evaluateMVPFunctionalValidation } from '../mvpFunctionalValidationResult';

describe('MVPReadinessGate', () => {
  it('should not be ready if validation failed', () => {
    const checklist = createFIA011Checklist();
    const result = evaluateMVPFunctionalValidation(checklist, false, false);
    const gate = evaluateMVPReadinessGate(result);
    expect(gate.isReadyForPackaging).toBe(false);
    expect(gate.blockReason).toBeTruthy();
  });

  it('should be ready if validation passed', () => {
    const checklist = createFIA011Checklist();
    Object.keys(checklist.steps).forEach(k => {
      checklist.steps[k as keyof typeof checklist.steps] = true;
    });
    const result = evaluateMVPFunctionalValidation(checklist, false, false);
    const gate = evaluateMVPReadinessGate(result);
    expect(gate.isReadyForPackaging).toBe(true);
    expect(gate.blockReason).toBeNull();
  });
});

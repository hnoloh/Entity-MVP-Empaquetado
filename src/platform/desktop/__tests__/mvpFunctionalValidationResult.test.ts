import { describe, it, expect } from 'vitest';
import { createFIA011Checklist } from '../manualValidationChecklist_RV09_FIA011';
import { evaluateMVPFunctionalValidation } from '../mvpFunctionalValidationResult';

describe('MVPFunctionalValidationResult', () => {
  it('should be PENDING if checklist is incomplete', () => {
    const checklist = createFIA011Checklist();
    const result = evaluateMVPFunctionalValidation(checklist, false, false);
    expect(result.status).toBe('PENDING');
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should be PASSED if everything is completed and clean', () => {
    const checklist = createFIA011Checklist();
    Object.keys(checklist.steps).forEach(k => {
      checklist.steps[k as keyof typeof checklist.steps] = true;
    });
    const result = evaluateMVPFunctionalValidation(checklist, false, false);
    expect(result.status).toBe('PASSED');
    expect(result.errors.length).toBe(0);
  });

  it('should be FAILED if forbidden units detected', () => {
    const checklist = createFIA011Checklist();
    Object.keys(checklist.steps).forEach(k => {
      checklist.steps[k as keyof typeof checklist.steps] = true;
    });
    const result = evaluateMVPFunctionalValidation(checklist, false, true);
    expect(result.status).toBe('FAILED');
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should be DRIFT_DETECTED if drift detected', () => {
    const checklist = createFIA011Checklist();
    const result = evaluateMVPFunctionalValidation(checklist, true, false);
    expect(result.status).toBe('DRIFT_DETECTED');
    expect(result.errors.length).toBeGreaterThan(0);
  });
});

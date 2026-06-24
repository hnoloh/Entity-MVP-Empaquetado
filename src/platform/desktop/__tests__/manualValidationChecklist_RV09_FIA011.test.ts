import { describe, it, expect } from 'vitest';
import { createFIA011Checklist, validateFIA011Checklist } from '../manualValidationChecklist_RV09_FIA011';

describe('manualValidationChecklist_RV09_FIA011', () => {
  it('should create an incomplete checklist by default', () => {
    const checklist = createFIA011Checklist();
    expect(checklist.id).toBe('RV09_FIA011');
    expect(checklist.isComplete).toBe(false);
    expect(validateFIA011Checklist(checklist)).toBe(false);
  });

  it('should validate successfully when all steps are completed', () => {
    const checklist = createFIA011Checklist();
    Object.keys(checklist.steps).forEach(k => {
      checklist.steps[k as keyof typeof checklist.steps] = true;
    });
    checklist.isComplete = true;
    expect(validateFIA011Checklist(checklist)).toBe(true);
  });
});

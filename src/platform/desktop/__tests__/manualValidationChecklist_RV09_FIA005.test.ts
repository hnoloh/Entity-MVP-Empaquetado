import { describe, it, expect } from 'vitest';
import { manualValidationChecklist_RV09_FIA005 } from '../manualValidationChecklist_RV09_FIA005';

describe('manualValidationChecklist_RV09_FIA005', () => {
  it('should define the exact required steps to validate Group Integration in Desktop Host', () => {
    expect(manualValidationChecklist_RV09_FIA005.id).toBe('RV09_FIA005_GROUPS_INTEGRATION');
    expect(manualValidationChecklist_RV09_FIA005.command).toBe('npm run dev');
    expect(manualValidationChecklist_RV09_FIA005.urlOrMode).toBe('http://localhost:1420');
    expect(manualValidationChecklist_RV09_FIA005.steps.length).toBeGreaterThanOrEqual(7);
    
    // Check specific steps content presence
    const allSteps = manualValidationChecklist_RV09_FIA005.steps.map(s => s.action.toLowerCase());
    
    const containsEditor = allSteps.some(s => s.includes('editor de grupo'));
    const containsSlots = allSteps.some(s => s.includes('slots'));
    const containsAutoRun = allSteps.some(s => s.includes('auto-run'));
    const containsTools = allSteps.some(s => s.includes('tools') || s.includes('herramientas'));
    
    expect(containsEditor).toBe(true);
    expect(containsSlots).toBe(true);
    expect(containsAutoRun).toBe(true);
    expect(containsTools).toBe(true);
  });
});

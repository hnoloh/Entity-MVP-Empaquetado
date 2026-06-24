import { describe, it, expect } from 'vitest';
import { manualValidationChecklist_RV09_FIA006 } from '../manualValidationChecklist_RV09_FIA006';

describe('manualValidationChecklist_RV09_FIA006', () => {
  it('should define the exact required steps to validate Runtime Integration in Desktop Host', () => {
    expect(manualValidationChecklist_RV09_FIA006.id).toBe('RV09_FIA006_RUNTIME_INTEGRATION');
    expect(manualValidationChecklist_RV09_FIA006.command).toBe('npm run dev');
    expect(manualValidationChecklist_RV09_FIA006.urlOrMode).toBe('http://localhost:1420');
    expect(manualValidationChecklist_RV09_FIA006.steps.length).toBeGreaterThanOrEqual(5);
    
    const allSteps = manualValidationChecklist_RV09_FIA006.steps.map(s => s.action.toLowerCase());
    
    expect(allSteps.some(s => s.includes('chat de enti'))).toBe(true);
    expect(allSteps.some(s => s.includes('chat único') || s.includes('grupo'))).toBe(true);
    expect(allSteps.some(s => s.includes('auto-run') || s.includes('segundo plano'))).toBe(true);
    expect(allSteps.some(s => s.includes('error'))).toBe(true);
  });
});

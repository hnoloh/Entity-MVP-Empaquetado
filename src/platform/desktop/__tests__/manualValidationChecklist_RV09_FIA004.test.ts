import { manualValidationChecklist_RV09_FIA004 } from '../manualValidationChecklist_RV09_FIA004';

describe('manualValidationChecklist_RV09_FIA004', () => {
  it('should define a checklist for manual E2E visual validation of Windows integration', () => {
    expect(manualValidationChecklist_RV09_FIA004).toBeDefined();
    expect(manualValidationChecklist_RV09_FIA004.id).toBe('RV09_FIA004_WINDOWS_INTEGRATION');
    expect(manualValidationChecklist_RV09_FIA004.steps.length).toBeGreaterThan(0);
    
    // Validamos restricciones documentadas
    const allExpectedResults = manualValidationChecklist_RV09_FIA004.steps.map(s => s.expectedResult).join(' ');
    expect(allExpectedResults).toContain('No debe producirse auto-open');
    expect(allExpectedResults).toContain('sin mezclar');
    expect(allExpectedResults).toContain('sin convertirlo en owner');
  });
});

import { expect, test } from 'vitest';
import { manualValidationChecklist_RV09_FIA008 } from '../manualValidationChecklist_RV09_FIA008';

test('manualValidationChecklist_RV09_FIA008 has required steps', () => {
  expect(manualValidationChecklist_RV09_FIA008.length).toBe(8);
  expect(manualValidationChecklist_RV09_FIA008[0]).toContain('Ejecutar');
});

import { expect, test } from 'vitest';
import { manualValidationChecklist_RV09_FIA007 } from '../manualValidationChecklist_RV09_FIA007';

test('manualValidationChecklist_RV09_FIA007 contains 8 steps', () => {
  expect(manualValidationChecklist_RV09_FIA007).toHaveLength(8);
  expect(manualValidationChecklist_RV09_FIA007[0]).toContain("1. Ejecutar");
});

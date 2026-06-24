export interface ManualValidationChecklist_RV09_FIA011 {
  id: 'RV09_FIA011';
  name: 'Validación MVP Completo funcional';
  isComplete: boolean;
  steps: {
    splashScreenE2E: boolean;
    autoInstallerE2E: boolean;
    workspaceE2E: boolean;
    entisE2E: boolean;
    gruposE2E: boolean;
    chatsE2E: boolean;
    ventanasNativasE2E: boolean;
    runtimeNoAutoRun: boolean;
    persistenciaE2E: boolean;
    cicloDeVidaE2E: boolean;
    toolsE2E: boolean;
    adjuntosE2E: boolean;
    artefactosGeneradosE2E: boolean;
  };
}

export const createFIA011Checklist = (): ManualValidationChecklist_RV09_FIA011 => ({
  id: 'RV09_FIA011',
  name: 'Validación MVP Completo funcional',
  isComplete: false,
  steps: {
    splashScreenE2E: false,
    autoInstallerE2E: false,
    workspaceE2E: false,
    entisE2E: false,
    gruposE2E: false,
    chatsE2E: false,
    ventanasNativasE2E: false,
    runtimeNoAutoRun: false,
    persistenciaE2E: false,
    cicloDeVidaE2E: false,
    toolsE2E: false,
    adjuntosE2E: false,
    artefactosGeneradosE2E: false,
  }
});

export const validateFIA011Checklist = (checklist: ManualValidationChecklist_RV09_FIA011): boolean => {
  return Object.values(checklist.steps).every(step => step === true);
};

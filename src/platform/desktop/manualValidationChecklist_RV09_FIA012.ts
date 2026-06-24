export interface ManualValidationChecklist_RV09_FIA012 {
  id: 'RV09_FIA012';
  name: 'Empaquetado Desktop Instalable';
  isComplete: boolean;
  steps: {
    bundleGenerated: boolean;
    ghostIconApplied: boolean;
    installableWithoutDevServer: boolean;
    launcherShortcutWorking: boolean;
  };
}

export const createFIA012Checklist = (): ManualValidationChecklist_RV09_FIA012 => ({
  id: 'RV09_FIA012',
  name: 'Empaquetado Desktop Instalable',
  isComplete: false,
  steps: {
    bundleGenerated: false,
    ghostIconApplied: false,
    installableWithoutDevServer: false,
    launcherShortcutWorking: false
  }
});

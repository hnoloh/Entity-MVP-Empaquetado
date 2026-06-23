export interface ManualValidationStep {
  id: string;
  action: string;
  expectedResult: string;
}

export interface ManualValidationChecklist {
  id: string;
  command: string;
  urlOrMode: string;
  description: string;
  steps: ManualValidationStep[];
}

export const manualValidationChecklist_RV09_FIA002: ManualValidationChecklist = {
  id: 'RV09_FIA002_ENTIS_INTEGRATION',
  command: 'npm run dev',
  urlOrMode: 'http://localhost:3000/ o modo Desktop',
  description: 'Validación visual E2E de la integración de Entis en el entorno Desktop Host Simulado.',
  steps: [
    {
      id: 'step_1_list',
      action: 'Abrir Entity y visualizar el listado de Entis en la columna izquierda.',
      expectedResult: 'El listado de Entis debe mostrarse correctamente sin errores.'
    },
    {
      id: 'step_2_select',
      action: 'Seleccionar un Enti de la lista.',
      expectedResult: 'El Enti seleccionado debe resaltarse y sus datos deben cargar en el área central (EntiEditor).'
    },
    {
      id: 'step_3_editor',
      action: 'Revisar la interfaz de EntiEditor.',
      expectedResult: 'Deben estar visibles el Harness, Tool Belt, configuración del Brain y referencias a adjuntos. No debe haber auto-ejecución del runtime o provider.'
    },
    {
      id: 'step_4_edit_save',
      action: 'Modificar un campo permitido del Enti y guardar.',
      expectedResult: 'Los cambios se deben persistir correctamente a través de la persistencia operativa existente, sin storage paralelo.'
    },
    {
      id: 'step_5_restore_isolation',
      action: 'Seleccionar un Enti diferente (Enti B) y volver al original (Enti A).',
      expectedResult: 'Los datos, tools, brain y adjuntos no deben mezclarse entre los Entis. La restauración debe ser limpia.'
    }
  ]
};

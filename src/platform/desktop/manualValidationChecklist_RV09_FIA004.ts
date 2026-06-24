import type { ManualValidationChecklist } from './manualValidationChecklist_RV09_FIA002';

export const manualValidationChecklist_RV09_FIA004: ManualValidationChecklist = {
  id: 'RV09_FIA004_WINDOWS_INTEGRATION',
  command: 'npm run dev',
  urlOrMode: 'http://localhost:3000/ o modo Desktop',
  description: 'Validación visual E2E de la integración de Ventanas Operativas (ChatWindow) en el entorno Desktop Host Simulado.',
  steps: [
    {
      id: 'step_1_no_auto_open',
      action: 'Cargar el Workspace inicial.',
      expectedResult: 'No debe producirse auto-open de ventanas ni auto-run de providers o Runtime.'
    },
    {
      id: 'step_2_open_window',
      action: 'Abrir una ventana de Chat de Enti.',
      expectedResult: 'La ventana debe abrirse preservando ownerType, ownerId, y chatId. Los mensajes e historial deben cargar correctamente.'
    },
    {
      id: 'step_3_window_controls',
      action: 'Minimizar, restaurar y cerrar la ventana. Comprobar foco.',
      expectedResult: 'Las interacciones deben funcionar de forma verificable en la UI real sin romper el estado del chat.'
    },
    {
      id: 'step_4_multiple_windows',
      action: 'Abrir ventanas de Chat para diferentes Entis simultáneamente.',
      expectedResult: 'Las ventanas deben coexistir sin mezclar mensajes, owners, adjuntos ni artefactos.'
    },
    {
      id: 'step_5_group_window',
      action: 'Abrir el chat único de un Grupo en una ventana.',
      expectedResult: 'Debe abrirse preservando el contexto del grupo, sin convertirlo en owner de tools y aislando sus datos del resto.'
    }
  ]
};

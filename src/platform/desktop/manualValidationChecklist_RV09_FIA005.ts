import type { ManualValidationChecklist } from './manualValidationChecklist_RV09_FIA002';

export const manualValidationChecklist_RV09_FIA005: ManualValidationChecklist = {
  id: 'RV09_FIA005_GROUPS_INTEGRATION',
  command: 'npm run dev',
  urlOrMode: 'http://localhost:1420',
  description: 'Verificar la integración E2E de la funcionalidad de Grupos (Listado, Editor, Chat de Grupo) bajo el entorno web-fallback/desktop-host, asegurando aislamiento y ausencia de auto-run.',
  steps: [
    {
      id: 'step_1',
      action: 'Cargar la aplicación y verificar que la sección de Grupos aparece en el Workspace.',
      expectedResult: 'La sección de Grupos debe estar visible.'
    },
    {
      id: 'step_2',
      action: 'Crear un nuevo Grupo o seleccionar uno existente.',
      expectedResult: 'El editor de Grupo debe cargarse con la información correspondiente.'
    },
    {
      id: 'step_3',
      action: 'Abrir el Editor de Grupo y validar que se pueden modificar los slots (1 a 5), la función y que respeta la restricción de 2 a 5 Entis.',
      expectedResult: 'La UI debe permitir los cambios correctamente.'
    },
    {
      id: 'step_4',
      action: 'Guardar el Grupo y verificar que los cambios persisten y la lista de Grupos se actualiza sin corromper el storage.',
      expectedResult: 'Los cambios se deben guardar correctamente.'
    },
    {
      id: 'step_5',
      action: 'Abrir el chat del Grupo. Verificar que se despliega correctamente (ya sea en vista principal o en ventana emergente según FIA-04).',
      expectedResult: 'El chat debe abrirse en el entorno correcto.'
    },
    {
      id: 'step_6',
      action: 'Confirmar que al abrir el Grupo, su Editor o su Chat NO se desencadena un auto-run (no se inician secuencias de IA ni el runtime automáticamente).',
      expectedResult: 'No debe haber actividad de red o de runtime inesperada.'
    },
    {
      id: 'step_7',
      action: 'Verificar que los adjuntos/herramientas funcionan solo en el contexto del Grupo sin otorgarle propiedad permanente sobre herramientas (ownership pertenece a los Entis).',
      expectedResult: 'El manejo de tools debe mantener las validaciones correctas.'
    }
  ]
};

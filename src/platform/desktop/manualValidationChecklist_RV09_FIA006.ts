import type { ManualValidationChecklist } from './manualValidationChecklist_RV09_FIA002';

export const manualValidationChecklist_RV09_FIA006: ManualValidationChecklist = {
  id: 'RV09_FIA006_RUNTIME_INTEGRATION',
  command: 'npm run dev',
  urlOrMode: 'http://localhost:1420',
  description: 'Validación Visual/Manual E2E: Integración Runtime asegurando ejecución únicamente por acción humana explícita.',
  steps: [
    {
      id: 'step_1',
      action: 'Abrir un Chat de Enti y enviar un mensaje manual (Ej: "Hola, ¿qué tal?").',
      expectedResult: 'El Runtime de Enti debe ejecutarse a través de ProviderBridge (estado changing a "Preparando...", "Generando...", "Recibiendo...").'
    },
    {
      id: 'step_2',
      action: 'Crear un Grupo válido, abrir su chat único, e inicializar la macro / enviar un mensaje.',
      expectedResult: 'El Runtime de Grupo debe inicializar y ejecutar los slots de forma secuencial.'
    },
    {
      id: 'step_3',
      action: 'Verificar que montar el Workspace o cualquier Enti/Grupo NO desencadena ninguna llamada a los providers en segundo plano.',
      expectedResult: 'Total ausencia de peticiones a la API del provider sin acción humana (No auto-run).'
    },
    {
      id: 'step_4',
      action: 'Provocar un error de Runtime (ej. usar un Enti sin modelo configurado o clave API falsa) y ejecutar envío humano.',
      expectedResult: 'El Runtime debe generar un mensaje de error tipo "blocked" o "controlled_error" en el chat sin bloquear la aplicación entera.'
    },
    {
      id: 'step_5',
      action: 'Verificar el aislamiento del historial tras una ejecución.',
      expectedResult: 'Las respuestas deben persistir únicamente en el Chat del owner (Enti o Grupo) y no cruzar contexto.'
    }
  ]
};

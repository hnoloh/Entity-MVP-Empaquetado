import type { ManualValidationChecklist } from './manualValidationChecklist_RV09_FIA002';

export const manualValidationChecklist_RV09_FIA003: ManualValidationChecklist = {
  id: 'RV09_FIA003_CHATS_INTEGRATION',
  command: 'npm run dev',
  urlOrMode: 'http://localhost:3000/ o modo Desktop',
  description: 'Validación visual E2E de la integración de Chats de Enti y Grupos en el entorno Desktop Host Simulado.',
  steps: [
    {
      id: 'step_1_open_enti_chat',
      action: 'Seleccionar un Enti y abrir su chat.',
      expectedResult: 'El chat del Enti debe abrirse sin rediseñar la UI, sin invocar Internet ni auto-run de providers/Runtime.'
    },
    {
      id: 'step_2_send_message',
      action: 'Escribir un mensaje y enviarlo manualmente.',
      expectedResult: 'El mensaje debe renderizarse en el historial. El historial y persistencia deben funcionar correctamente.'
    },
    {
      id: 'step_3_group_chat',
      action: 'Abrir el chat único de un Grupo.',
      expectedResult: 'El chat del Grupo debe abrirse aislando sus mensajes y sin convertir al Grupo en owner de herramientas.'
    },
    {
      id: 'step_4_switch_isolation',
      action: 'Cambiar entre el Chat de Enti A, Enti B y Grupo.',
      expectedResult: 'No se deben mezclar mensajes, adjuntos, artefactos generados ni historiales entre los distintos contextos.'
    },
    {
      id: 'step_5_attachments_artifacts',
      action: 'Revisar adjuntos y artefactos en el chat.',
      expectedResult: 'Deben estar visibles sin auto-descarga no documentada ni creación automática de artefactos sin uso de herramientas autorizadas.'
    }
  ]
};

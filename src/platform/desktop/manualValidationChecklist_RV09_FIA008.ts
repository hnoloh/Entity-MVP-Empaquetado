export const manualValidationChecklist_RV09_FIA008 = [
  "1. Ejecutar 'npm run tauri dev' para iniciar Entity en modo Desktop nativo.",
  "2. Observar el arranque: no debe haber ejecuciones automáticas (auto-run) de Runtime o Tools.",
  "3. Modificar el estado: Crear Entis, Grupos y enviar mensajes en sus respectivos chats.",
  "4. Cerrar la aplicación controladamente simulando el cierre de la ventana principal.",
  "5. Reabrir la aplicación ('npm run tauri dev' o desde ejecutable).",
  "6. Validar que la interfaz se restaura en el mismo estado visual pasivo, sin disparar nuevos runtimes.",
  "7. Validar que las ventanas operativas abiertas previamente (chats independientes) no se duplican ni reemiten eventos al BroadcastChannel.",
  "8. Confirmar que ninguna Tool o fetch/network arbitrario es ejecutado durante el arranque o restore."
];

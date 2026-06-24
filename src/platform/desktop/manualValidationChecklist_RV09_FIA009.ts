export const ManualValidationChecklist_RV09_FIA009 = {
  description: 'Validación manual del Splash Screen antes de la Main Window',
  steps: [
    {
      id: 'step_1_launch',
      action: 'Ejecutar `npm run tauri dev`',
      expected: 'La aplicación arranca y muestra el Splash Screen transparente con el fantasma animado.',
    },
    {
      id: 'step_2_splash_visible',
      action: 'Observar Splash Screen',
      expected: 'La ventana Main no es visible. Solo se ve el Splash Screen.',
    },
    {
      id: 'step_3_transition',
      action: 'Esperar simulación de transición',
      expected: 'Tras unos segundos, el Splash Screen se cierra automáticamente y aparece la ventana Main.',
    },
    {
      id: 'step_4_no_autorun',
      action: 'Verificar Main Window',
      expected: 'El Entity se carga en estado idle. No hay auto-ejecución de Provider, Brain ni Tools.',
    }
  ]
};

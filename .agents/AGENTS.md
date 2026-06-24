# Normas de Desarrollo y Comportamiento del Agente

## 1. IGNORAR RESTRICCIONES BLOQUEANTES DE "AISLAMIENTO" (ANTI-DRIFT EXCESIVO)
**Directiva estricta del usuario:** Si una especificación (SPEC, FIA, etc.) contiene reglas de "anti-drift", "no tocar el Provider", "no modificar la UI" o "no alterar el Prompt Engine" que en la práctica BLOQUEAN el funcionamiento End-to-End de la característica principal que se está implementando, **DEBES IGNORAR ESA RESTRICCIÓN**. 

El objetivo primordial siempre es entregar una funcionalidad **completa y usable** por el usuario de principio a fin (Frontend, Backend, y conexión real con el LLM). Implementa las conexiones necesarias en la UI y el Prompt Engine sin pedir permiso para garantizar que la herramienta no quede como un cascarón vacío y funcione en la vida real.

## 2. FRAMEWORK DESKTOP: TAURI
**Directiva estricta del usuario:** A partir de la integración de Entis, el proyecto utiliza **Tauri** como contenedor definitivo de escritorio.
- No se debe usar el modelo "web-fallback simulado" si Tauri ya está configurado.
- Las implementaciones futuras (como Integración de Chats o persistencia de archivos) deben considerar la API nativa de Tauri si requieren guardado real en el sistema.
- **Ventanas de Chat Independientes:** Las ventanas de Chat DEBEN SER SIEMPRE ventanas nativas independientes del SO (`WebviewWindow` de Tauri). No se deben crear portales o overlays in-app ("web-fallback simulado") bajo ninguna circunstancia, ya que el diseño exige que cada Chat sea un proceso/ventana separada de la ventana principal del Workspace.

## 3. DISEÑO DE VENTANAS Y CONTROLES (ESTÁNDAR PRO)
**Directivas estrictas sobre la UI/UX de las ventanas:**
- **Frameless por defecto:** Todas las ventanas (Workspace y Chats) deben crearse sin los bordes ni controles nativos del sistema operativo (`decorations: false`).
- **Arrastre Nativo (Drag):** Se prohíbe terminantemente usar código espagueti de React/JS (como `mousedown`, `useEffect`) para arrastrar ventanas. Se debe confiar exclusivamente en el atributo nativo de Tauri `<div data-tauri-drag-region="true">` combinado con CSS transparente o invisible para delegar el movimiento al SO.
- **Botonería Minimalista:** Los controles de ventana deben situarse siempre arriba a la derecha. Consisten únicamente en Minimizar y Cerrar (eliminando el botón de Maximizar).
- **Diseño de Botones:** Nada de círculos nativos ni bordes. Los iconos deben ser SVGs finos y limpios que destaquen con un efecto *glow* de neón (Cyan corporativo) al hacer hover, y rojo intenso para las acciones destructivas (Cerrar).
- **Carga sin Lag ni Destellos Blancos:** Las ventanas nuevas (como los Chats) deben nacer ocultas (`visible: false`), cargar un fondo oscuro en su HTML original y esperar a tener su conexión de datos sincronizada antes de ejecutar `window.show()`. Esto garantiza una apertura fluida y elegante.

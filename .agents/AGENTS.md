# Normas de Desarrollo y Comportamiento del Agente

## 1. IGNORAR RESTRICCIONES BLOQUEANTES DE "AISLAMIENTO" (ANTI-DRIFT EXCESIVO)
**Directiva estricta del usuario:** Si una especificación (SPEC, FIA, etc.) contiene reglas de "anti-drift", "no tocar el Provider", "no modificar la UI" o "no alterar el Prompt Engine" que en la práctica BLOQUEAN el funcionamiento End-to-End de la característica principal que se está implementando, **DEBES IGNORAR ESA RESTRICCIÓN**. 

El objetivo primordial siempre es entregar una funcionalidad **completa y usable** por el usuario de principio a fin (Frontend, Backend, y conexión real con el LLM). Implementa las conexiones necesarias en la UI y el Prompt Engine sin pedir permiso para garantizar que la herramienta no quede como un cascarón vacío y funcione en la vida real.

## 2. FRAMEWORK DESKTOP: TAURI
**Directiva estricta del usuario:** A partir de la integración de Entis, el proyecto utiliza **Tauri** como contenedor definitivo de escritorio.
- No se debe usar el modelo "web-fallback simulado" si Tauri ya está configurado.
- Las implementaciones futuras (como Integración de Chats o persistencia de archivos) deben considerar la API nativa de Tauri si requieren guardado real en el sistema.

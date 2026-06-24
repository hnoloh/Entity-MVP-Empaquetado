RV09_IMPLEMENTATION_INDEX_V4
Corrección secuencia: Validación → Packaging → Release Candidate
MODO AUDITORIA · CHG-RV09-DESKTOP_PACKAGING_INSTALLER · CHG-ONBOARDING_Y_SPLASH integrado
1. Identificación
Documento: RV09_IMPLEMENTATION_INDEX_V4_CORRECCION_SECUENCIA_VALIDACION_PACKAGING_RELEASE
Modo: MODO AUDITORIA
RV: RV-09 Integración Final
Motivo: Corrección del índice RV-09 para evitar empaquetar antes de validar funcionalmente el MVP completo.
CHG aplicada: CHG-RV09-DESKTOP_PACKAGING_INSTALLER
CHG previa integrada: CHG-ONBOARDING_Y_SPLASH
Precondición documental: LOCK-FIA-RV09-010 disponible y desbloquea RV09/FIA-011 Validación MVP Completo.
Estado documental: Índice corregido. Sustituye RV09_IMPLEMENTATION_INDEX_V3_CHG_DESKTOP_PACKAGING_INSTALLER para la secuencia final.
2. Veredicto de auditoría
VEREDICTO: CORRECCIÓN NECESARIA Y ACEPTADA. El orden anterior introducía el empaquetado antes de la validación funcional completa, lo que podía trasladar defectos funcionales al instalador y confundir incidencias de producto con incidencias de packaging. La secuencia correcta queda fijada como: primero validar el MVP operativo, después empaquetar, y finalmente validar el producto instalado como Release Candidate.
3. Regla de secuencia corregida
4. Índice RV-09 corregido
5. Correcciones sobre documentos previos
RV09_IMPLEMENTATION_INDEX_V3_CHG_DESKTOP_PACKAGING_INSTALLER: Sustituido por este índice V4. Su orden packaging→validación queda obsoleto.
VF-RV09-09.11_EMPAQUETADO_DESKTOP_INSTALABLE_CHG_PACKAGING_VALIDACION_VISUAL_E2E: No debe usarse como siguiente VF. Su contenido podrá reciclarse documentalmente para FIA-RV09-012 tras generar VF/FIA nueva en la posición correcta.
FIA-RV09-011_VALIDACION_MVP_COMPLETO_ONBOARDING_SPLASH_AUTO_INSTALLER_VALIDACION_VISUAL_E2E: Queda obsoleta como numeración previa si fue generada antes de la corrección. Debe regenerarse como FIA-RV09-011 funcional alineada a este índice.
Validación final anterior a CHG-ONBOARDING_Y_SPLASH: Obsoleta para SPEC/LOCK por no incluir Splash ni Auto Installer.
6. FIA-RV09-011 — Validación MVP Completo funcional
Objetivo: validar que Entity funciona de extremo a extremo como MVP completo en entorno desktop/dev antes de generar instaladores.
Incluye:
Splash Screen y transición a Main Window.
Auto Installer LLM con estado ready o controlled_error gestionado.
Workspace, Entis, Grupos, Chats, Ventanas nativas, Runtime por acción humana, Persistencia Operativa y Ciclo de Vida.
Tools y artefactos generados PDF/DOCX/HTML.
Adjuntos, fuentes contextuales y Brains local/cloud ya documentados.
Validación visual/manual E2E con comando real, modo real y evidencias en TEST_REPORT.
Excluye:
Generación de instalador.
Icono de escritorio/launcher.
Validación de instalación limpia.
Firma/certificado/notarización.
Cambios en Runtime, ProviderBridge, Tools, Brain o persistencia.
Quality gates:
Tests unit/integration/regression verdes.
Lint/typecheck/build desktop-dev.
Checklist manual E2E completo.
Forbidden scan: no Tool Internet, no fetch frontend, no RAG, no auto-run.
LOCK-FIA-RV09-011 y JSON LOCK generados antes de iniciar packaging.
7. FIA-RV09-012 — Empaquetado Desktop Instalable
Objetivo: convertir el MVP funcionalmente validado en una aplicación instalable de escritorio.
Incluye:
Configuración Tauri build/bundle instalable.
Artefacto instalable del sistema operativo objetivo.
Icono oficial del fantasma como icono de app.
Acceso desde launcher/escritorio cuando el sistema operativo lo permita.
Apertura de Entity desde el acceso instalado sin terminal, Vite, npm ni entorno dev.
Validación de que Splash, Auto Installer y Workspace arrancan desde build empaquetada.
Excluye:
Nuevas capacidades funcionales del producto.
Cambios Runtime/Provider/Brain/Tools.
Reintroducción de Internet Tool o browsing.
Descarga de modelos desde frontend.
Validación completa del producto instalado: queda para FIA-RV09-013.
Quality gates:
Build instalable generado.
Instalación local verificada.
Icono fantasma visible en app/launcher/acceso.
Apertura desde instalación verificada.
LOCK-FIA-RV09-012 y JSON LOCK generados antes de Release Candidate.
8. FIA-RV09-013 — Validación Post-Instalación / Release Candidate
Objetivo: validar el entregable instalado como Release Candidate final del MVP/TFM.
Incluye:
Instalación limpia en entorno sin servidor dev.
Apertura desde icono fantasma/launcher.
Primer arranque real con Splash y Auto Installer.
Validación Starter Pack LLM local, estado ready/controlled_error y transición a Workspace.
Prueba funcional mínima Enti, Grupo, Chat, Runtime por acción humana, artefactos y cierre/reapertura.
Validación de restricciones: sin auto-run, sin Tool Internet, sin fetch frontend, sin RAG ni filesystem arbitrario.
Excluye:
Cambios de packaging.
Cambios funcionales del MVP.
Correcciones no documentadas. Cualquier fallo bloqueante exige nueva CHG/FIA o reapertura controlada.
Definition of Done:
Release Candidate instalable validado.
TEST_REPORT final con evidencias de instalación, apertura, primer arranque y flujo mínimo.
LOCK-FIA-RV09-013 emitido como cierre de RV-09.
9. Restricciones preservadas
No Tool Internet.
No fetch frontend.
No browsing/scraping.
No RAG.
No Runtime auto-run.
No Provider/Brain auto-run.
No Tool auto-run.
No filesystem arbitrario.
No URL configurable arbitraria para descarga.
No rediseño UI core fuera del alcance de cada FIA.
No mezclar owners, chats, grupos, ventanas ni estados restaurados.
10. Riesgos y mitigaciones
11. Estado documental final
Índice vigente: RV09_IMPLEMENTATION_INDEX_V4_CORRECCION_SECUENCIA_VALIDACION_PACKAGING_RELEASE
Siguiente unidad autorizada: FIA-RV09-011 — Validación MVP Completo funcional
Unidad packaging: FIA-RV09-012 — Empaquetado Desktop Instalable
Unidad cierre release: FIA-RV09-013 — Validación Post-Instalación / Release Candidate
Condición para avanzar: NO LOCK-FIA-RV09-011 → NO FIA-RV09-012. NO LOCK-FIA-RV09-012 → NO FIA-RV09-013.

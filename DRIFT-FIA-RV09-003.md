# DRIFT-FIA-RV09-003

- **Drift detectado antes de implementar:** Ninguno.
- **Drift detectado después de implementar:** Tests de regresión en `EntiHarness` fallando (`buildHarnessAttachmentDropIntent`, `useEntiHarnessAttachmentDrop`). Esto constituye una discrepancia entre el estado esperado (todo verde tras FIA-002) y la realidad del repositorio.
- **Drift corregido:** Ninguno (no se permite alterar `EntiHarness` bajo la FIA de Chats sin incurrir en scope creep).
- **Drift bloqueante:** Sí. Fallos en test de regresión.
- **Drift que requiere CHG:** No necesariamente un cambio arquitectónico, pero requiere autorización explícita para reparar la deuda técnica de una FIA pasada.
- **Evidencia:** Output de `npm run test`.
- **Archivos afectados:** `src/components/EntiHarness/__tests__/*`
- **Contratos afectados:** Ninguno directamente por esta FIA, pero la robustez de `EntiHarness` está comprometida.

---
FIA_ID: "FIA-HOTFIX-002"
STATUS: "LOCKED"
VEREDICTO: "HOTFIX APPROVED"
---

# LOCK: FIA-HOTFIX-002

## 1. Identificación del Cierre
Se emite este cerrojo documental para certificar que se ha corregido el error de compilación en GitHub Actions (`error[E0599]: no method named 'transparent' found for struct 'WebviewWindowBuilder'`) introduciendo el feature flag necesario para macOS, sin alterar alcance funcional o UI.

## 2. Puntos Certificados
- [x] Feature `macos-private-api` agregado a `Cargo.toml`.
- [x] Sincronización de configuración en `tauri.conf.json`.
- [x] Compilación local verificada limpia.

## 3. Autorización de Empaquetado
Código, SPEC, FIA y JSON reflejan el mismo comportamiento real. Se autoriza realizar el push que lanzará nuevamente el Action de GitHub (Release MVP1).

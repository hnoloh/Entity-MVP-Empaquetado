# SPEC-HOTFIX-002: Especificación Técnica de Corrección macOS

## 1. Error de Compilación en macOS (GitHub Actions)
- **Problema:** Las subidas a GitHub fallan en el workflow `Release Entity MVP1` para el runner de `macos-latest`. El error específico de Rust es `error[E0599]: no method named 'transparent' found for struct 'WebviewWindowBuilder'`.
- **Causa común:** En Tauri v2, habilitar la transparencia de ventana mediante el builder de Rust usando `.transparent(true)` exige que se incluya el feature flag `macos-private-api` al compilar para macOS. Al no estar este feature, la compilación falla solo en ese sistema operativo.
- **Solución técnica esperada:** Modificar el archivo `src-tauri/Cargo.toml` e incluir el feature correspondiente: `tauri = { version = "2.11.3", features = ["macos-private-api"] }`.
- **Tests:** Comprobar mediante `cargo check` que el proyecto sigue compilando. El test definitivo es observar el comportamiento en GitHub Actions en el próximo push.

## Criterios de Aceptación
- [ ] El archivo `Cargo.toml` incluye el feature `macos-private-api`.
- [ ] El código pasa la verificación de compilación.
- [ ] No existen efectos secundarios o arquitectónicos ni scope creep.

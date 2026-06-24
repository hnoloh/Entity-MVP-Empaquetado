# Entity App (V2)

Entity es una plataforma avanzada de asistentes basados en IA con capacidades de ejecución local y conexión a herramientas del sistema (generación de documentos y gestión de archivos). Está construida sobre **Tauri**, **React**, **Vite** y **TypeScript**.

## 🚀 Tecnologías Principales

- **Frontend:** React 19, TypeScript, Vite.
- **Backend / OS Integration:** Tauri v2, Rust.
- **IA y Runtime:** Sistema propio de Entis (agentes) y Grupos con orquestación secuencial, soporte para OpenAI (nube) y modelos locales.
- **Herramientas de IA:** Generación nativa de documentos (DOCX, PDF, HTML) e interacción directa con el sistema de archivos del usuario.

## 🛠️ Herramientas y Capacidades de los Agentes (Entis)

El sistema integra un entorno de herramientas (Tools) para que los Entis puedan interactuar de manera segura con el entorno del usuario:

### 1. Sistema de Archivos (Local Filesystem)
Los agentes pueden interactuar con la raíz del proyecto y directorios permitidos a través del `localFileToolExecutor`. Las operaciones disponibles incluyen listar, leer, escribir, sobrescribir, eliminar y crear carpetas. Este sistema utiliza internamente `@tauri-apps/plugin-fs` para garantizar un entorno sandbox seguro pero potente.

### 2. Generación de Documentos (DOCX, PDF, HTML)
El sistema permite que los Entis generen archivos formateados bajo demanda.
- **Modo Virtual (Enlace):** Si el usuario solicita un documento sin especificar destino, el sistema genera un artefacto virtual y proporciona un enlace de descarga interactivo en el chat. Al hacer clic, se abrirá el diálogo nativo del sistema (Tauri Dialog) que apuntará directamente al **Escritorio** por defecto.
- **Modo Guardado Directo:** Si el usuario especifica explícitamente una ruta de guardado (ej. "guárdalo en el escritorio" o "en la carpeta ./docs"), la IA utilizará la API nativa de Tauri (`BaseDirectory.Desktop` u otras rutas relativas) para escribir el archivo físicamente en el disco sin requerir interacción manual, y omitirá el enlace de descarga para mantener el chat limpio.

## 💻 Entorno de Desarrollo

### Requisitos Previos
- Node.js (v24+)
- Rust (cargo) y dependencias de Tauri v2.

### Comandos Útiles

```bash
# Instalar dependencias
npm install

# Iniciar el entorno de desarrollo (React + Tauri)
npm run tauri dev

# Compilar la aplicación para producción
npm run tauri build

# Revisión de tipos estáticos (TypeScript)
npm run typecheck

# Linter
npm run lint
```

## 🔒 Arquitectura de Seguridad (Tauri)
La aplicación utiliza configuraciones de capacidades estrictas de Tauri v2 (`src-tauri/capabilities/default.json`). 
El acceso al sistema de archivos mediante `@tauri-apps/plugin-fs` está diseñado para evitar ataques de *Path Traversal*. Las operaciones que implican el Escritorio físico están programadas nativamente usando `BaseDirectory.Desktop` en lugar de navegar mediante rutas relativas (`../`), garantizando que la aplicación respete las medidas de seguridad impuestas por el sistema operativo.

## 📝 Changelog (Últimas Modificaciones)
- Refactorización de herramientas (DOCX, PDF, HTML) para integrarse 100% con `@tauri-apps/plugin-fs` y `BaseDirectory.Desktop`.
- Mejora en la lógica del prompt de los Entis (`buildEntiPromptInput.ts`) para diferenciar inteligentemente entre peticiones de *enlace de descarga* vs *guardado automático en disco*.
- El botón de descarga ahora utiliza `@tauri-apps/api/path` para sugerir automáticamente el Escritorio como carpeta destino en el explorador de archivos nativo.
- Limpieza general de scripts de pruebas y logs generados durante la depuración.

# Entity

> **Proyecto Final (TFM) - Desarrollado bajo el "Método Entity" (Spec-Driven Development con Agentes IA)**

## a. Descripción General del Proyecto

**Entity** no es solo una aplicación, es la demostración técnica de un nuevo paradigma de ingeniería de software asistida por Inteligencia Artificial. 

Nace con el objetivo de solucionar el mayor problema del desarrollo actual con LLMs: la pérdida de contexto, las alucinaciones de código y la deuda técnica inmanejable. Para construir Entity, el programador humano no ha escrito código directamente, sino que ha actuado como Arquitecto, diseñando una **Cascada Documental** (Baseline) e instruyendo a un ecosistema de 4 Agentes de IA que operan en un pipeline estricto (Father Documentador -> Agente FIAs -> Generador SPECS -> Agente CLI). 

El resultado es un sistema robusto, con arquitectura limpia, protegido contra fugas de credenciales (Security by Design) y construido mediante micro-commits TDD.

## b. Stack Tecnológico Utilizado

El proyecto está diseñado bajo principios de *Clean Architecture* y escalabilidad extrema. *(Nota para el alumno: ajusta aquí las tecnologías exactas si usaste React, Node, etc.)*

*   **Arquitectura:** Clean Architecture (Separación estricta de Dominio, Casos de Uso e Infraestructura).
*   **Paradigma de Desarrollo:** Spec-Driven Development (SDD) / Test-Driven Development (TDD).
*   **Orquestación IA:**
    *   *ChatGPT Plus:* Modelado arquitectónico, generación de Rebanadas Verticales y SPECS (Generación *Just-In-Time*).
    *   *Gemini Advanced / AGY CLI:* Agente Implementador Ciego (Ejecución de código en bucles de 1 sesión = 1 FIA).
*   **Estado y Memoria (Mecanismo Anti-Amnesia IA):** JSON persistentes (`context_accumulated.json`, `repo_state.json`) para trazabilidad total y prevención de *Scope Creep*.

## c. Instalación y Ejecución

Al estar construido sobre contenedores modulares y seguir prácticas de *Security by Design*, la ejecución es predecible y segura. Los secretos están estrictamente extraídos fuera del código fuente.

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/hnoloh/Entity.git
   cd Entity
   ```

2. **Configuración de Entorno (Sanitación):**
   Copia el archivo de ejemplo para configurar las variables locales. **La IA tiene prohibido commitear o manipular este archivo.**
   ```bash
   cp .env.example .env
   # Edita el archivo .env con tus credenciales locales
   ```

3. **Instalación de Dependencias:**
   ```bash
   npm install
   ```

4. **Ejecución en Entorno de Desarrollo:**
   ```bash
   npm run dev
   ```

5. **Ejecución de Batería de Tests (La Regla de Sangre):**
   ```bash
   npm run test
   ```

## d. Estructura del Proyecto

El repositorio refleja la victoria del Análisis Funcional sobre la improvisación. La estructura está blindada para que el Agente Implementador no pueda crear acoplamientos ilegales.

```text
📦 Entity
 ┣ 📂 docs/                   # La Cascada Documental (El cerebro del proyecto)
 ┃ ┣ 📂 baseline/             # Specs Generales, Domain Model, Modulo Map
 ┃ ┣ 📂 fias/                 # Fichas de Implementación Arquitectónica (Las órdenes atómicas)
 ┃ ┗ 📂 locks/                # Certificados LOCK (Sin un Lock previo, no se avanza)
 ┣ 📂 src/
 ┃ ┣ 📂 domain/               # Entidades puras abstractas (Enti, Chat, Grupo)
 ┃ ┣ 📂 use-cases/            # Lógica de negocio orquestada
 ┃ ┣ 📂 infrastructure/       # Adaptadores externos, base de datos, repositorios
 ┃ ┗ 📂 ui/                   # Frontend desacoplado (UI Core, Visual States)
 ┣ 📜 context_accumulated.json # Memoria estratégica de la IA (Decisiones previas)
 ┣ 📜 repo_state.json          # Mapa de la realidad física del código
 ┗ 📜 README.md
```

## e. Funcionalidades Principales

Entity funciona como un ecosistema gestionado de interacciones e identidades (Entis). Todo el comportamiento está respaldado por los **Puntos de Verificación Funcional (PVFs)** dictados en el diseño.

1. **Gestión Integral de "Entis":** Creación, edición y persistencia de identidades abstractas a través del *Domain Model*.
2. **Sistema de Comunicaciones (Chats/Grupos):** Rutas y controladores hiper-aislados para manejar flujos de mensajes.
3. **AI Runtime Controlado:** El motor cognitivo no tiene permiso de ejecución automática (*Cero Auto-Run*). Todo *prompt* o llamada a un *Provider* externo está estrictamente orquestado y filtrado por los *Quality Gates*.
4. **Resiliencia Operativa (AS-BUILT):** Si ocurre un error técnico en el código, el sistema no colapsa, sino que se documenta mediante Change Requests (CHG) que actualizan el `context_accumulated.json` para que la arquitectura cicatrice orgánicamente.

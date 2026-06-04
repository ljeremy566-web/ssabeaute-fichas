# AGENTS.md

<!-- INSFORGE:START -->
## InsForge backend

This project uses [InsForge](https://insforge.dev): an all-in-one, open-source Postgres-based backend (BaaS) that gives this app a database, authentication, file storage, edge functions, realtime, an AI model gateway, and payments through one platform.

- **Project:** **Ficha-Medicas** (API base `https://zg83yibn.us-east.insforge.app`)
- **Skills:** these InsForge skills are installed for supported coding agents. Reach for them before implementing any InsForge feature instead of guessing the API:
  - `insforge`: app code with the `@insforge/sdk` client (database CRUD, auth, storage, edge functions, realtime, AI, email, and Stripe payments).
  - `insforge-cli`: backend and infrastructure via the `insforge` CLI (projects, SQL, migrations, RLS policies, storage buckets, functions, secrets, payment setup, schedules, deploys).
  - `insforge-debug`: diagnosing failures (SDK/HTTP errors, RLS denials, auth and OAuth issues) and running security or performance audits.
  - `insforge-integrations`: wiring external auth providers (Clerk, Auth0, WorkOS, Better Auth, etc.) for JWT-based RLS, or the OKX x402 payment facilitator.
  - `find-skills`: discovering additional skills on demand.
- **Credentials:** app code reads keys from `.env.local`; the CLI reads `.insforge/project.json`. Never hardcode or commit keys.

Key patterns:

- Database inserts take an array: `insert([{ ... }])`.
- Reference users with `auth.users(id)`; use `auth.uid()` in RLS policies.
- For storage uploads, persist both the returned `url` and `key`.
<!-- INSFORGE:END -->


## Front-end

Utiliza Clean Code y como regla manten el codigo simple e investigar acerca de mejores practicas de typescript y react.

### Tailwind

Para Tailwind Css usa los colores de material design. Puedes obtener los colores en https://m3.material.io/theme-builder

Usar bordes suaves y siempre rounded, nada debe ser tan cuadrado. Evitar el uso de sombras pesadas.

Siempre utilizar animaciones suaves de transitions.

Las funciones deben estar nombradas de modo que cumpla con la nomenclatura de react query y esten dedicadas a lo que se esta especificando en su nombre de manera que si el nombre de la funcion habla sobre una sola cosa y termina haciendo mas cosas de las especificadas en su nombre, se debe refactorizar aplicando clean code o sobrecarga de metodos y programacion funcional. No intentes optimizar el codigo de una manera excesiva, ni tampoco uses demasiados archivos.

## Backend
Evitar N+1 queries a la base de datos.

## Reglas generales
Siempre crear endpoints si son necesarios y bien documentados.
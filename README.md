
# Rumbos Envios - Panel de Logística

Este es un proyecto Next.js para Rumbos Envios, una plataforma de gestión de envíos y logística.

## Stack Tecnológico

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- ShadCN UI
- Genkit (para funcionalidades de IA con Google AI)
- Supabase (para base de datos y backend - requiere configuración manual)

## Empezando

1.  **Instalar dependencias:**
    ```bash
    npm install
    # o
    yarn install
    # o
    pnpm install
    ```

2.  **Configurar Variables de Entorno:**
    Crea un archivo `.env.local` en la raíz del proyecto y añade tus variables de entorno. Como mínimo, necesitarás configurar las de Supabase y Google AI (para Genkit).

    Ejemplo de `.env.local`:
    ```env
    # Supabase
    NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
    NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_de_supabase
    # Opcional: SUPABASE_SERVICE_ROLE_KEY si necesitas operaciones privilegiadas desde el backend
    # SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_de_supabase

    # Google AI (para Genkit)
    GOOGLE_API_KEY=tu_api_key_de_google_ai
    ```

3.  **Ejecutar el servidor de desarrollo:**
    ```bash
    npm run dev
    ```
    La aplicación estará disponible en [http://localhost:9002](http://localhost:9002).

4.  **Ejecutar Genkit Dev Server (para probar flujos de IA localmente):**
    En una terminal separada:
    ```bash
    npm run genkit:dev
    ```
    Esto iniciará el Genkit Developer UI, usualmente en `http://localhost:4000`.

## Estructura del Proyecto

-   `src/app/`: Contiene las rutas de la aplicación (App Router).
    -   `page.tsx`: Página principal (Dashboard).
    -   `/clientes`: Gestión de clientes.
    -   `/empresas`: Gestión de empresas.
    -   `/repartidores`: Gestión de repartidores.
    -   `/envios`: Gestión de envíos/pedidos.
    -   `/repartos`: Gestión de rutas de entrega.
    -   `/mapa-envios`: Visualización de envíos en mapa.
    -   `/configuracion`: Ajustes de la aplicación y cuenta.
-   `src/components/`: Componentes React reutilizables.
    -   `layout/`: Componentes de estructura principal (AppShell, Sidebar).
    -   `ui/`: Componentes de ShadCN UI.
    -   `icons/`: Iconos SVG personalizados.
-   `src/lib/`: Utilidades y lógica compartida.
-   `src/types/`: Definiciones de TypeScript.
-   `src/ai/`: Lógica relacionada con Genkit.
    -   `genkit.ts`: Configuración e inicialización de Genkit.
    -   `dev.ts`: Archivo para el servidor de desarrollo de Genkit.
    -   `flows/`: Implementaciones de flujos de IA.
-   `supabase/migrations/`: Contiene los scripts de migración de la base de datos de Supabase.

## Configuración de Supabase

Este proyecto está preparado para usar Supabase, pero **debes configurarlo manualmente**:

1.  Crea un proyecto en [Supabase](https://supabase.com/).
2.  Obtén la URL de tu proyecto y la `anon key` pública.
3.  Añádelas a tu archivo `.env.local` como `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4.  **Instala el cliente de Supabase:**
    ```bash
    npm install @supabase/supabase-js
    ```
5.  **Configura el cliente de Supabase en tu aplicación:**
    Crea un archivo, por ejemplo `src/lib/supabase/client.ts`, para inicializar el cliente de Supabase.
    ```typescript
    // src/lib/supabase/client.ts
    import { createBrowserClient } from '@supabase/ssr'; // o createClient si no usas SSR helpers

    export function createSupabaseBrowserClient() {
      return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
    }
    ```
    Si necesitas acceso desde el servidor (Server Actions, Route Handlers), considera usar `createSupabaseServerClient` de `@supabase/ssr` o el cliente estándar con la `service_role_key`.

6.  **Define tu esquema de base de datos:**
    El esquema inicial se encuentra en `supabase/migrations/0001_create_initial_schema.sql`. Puedes aplicar estas migraciones usando la [CLI de Supabase](https://supabase.com/docs/guides/cli) o ejecutando el script SQL directamente en el editor SQL de tu dashboard de Supabase.
    
    **Para aplicar con la CLI de Supabase (recomendado):**
    Asegúrate de tener la CLI instalada y configurada para tu proyecto.
    ```bash
    # Inicia sesión si aún no lo has hecho
    npx supabase login

    # Vincula tu proyecto local con tu proyecto Supabase remoto
    # npx supabase link --project-ref gtedfpsnrtpepwoeelfc
    # (Encuentra TU_PROJECT_ID en la URL de tu dashboard de Supabase o en Configuración del Proyecto > General)

    # Aplica las migraciones locales a tu base de datos remota
    npx supabase db push

    # O, para desarrollo local si usas Supabase localmente:
    # npx supabase start (si no está corriendo)
    # npx supabase db reset (para aplicar migraciones a una base local limpia)
    ```

7.  **Habilita extensiones necesarias:**
    El script de migración incluye comentarios para extensiones como `postgis`. Asegúrate de que estén habilitadas en tu instancia de Supabase si las funcionalidades correspondientes (ej. `GEOMETRY` type) son necesarias. Puedes hacerlo desde el Dashboard de Supabase > Database > Extensions.

## Componentes ShadCN UI

Puedes añadir más componentes de ShadCN UI fácilmente usando su CLI:
```bash
npx shadcn-ui@latest add [nombre-del-componente]
```

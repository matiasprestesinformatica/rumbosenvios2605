
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

## Configuración de Supabase

Este proyecto está preparado para usar Supabase, pero **debes configurarlo manualmente**:

1.  Crea un proyecto en [Supabase](https://supabase.com/).
2.  Obtén la URL de tu proyecto y la `anon key` pública.
3.  Añádelas a tu archivo `.env.local` como `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4.  Instala el cliente de Supabase: `npm install @supabase/supabase-js`.
5.  Configura el cliente de Supabase en tu aplicación (por ejemplo, en un archivo `src/lib/supabaseClient.ts`).
6.  Define tu esquema de base de datos en el dashboard de Supabase o mediante migraciones.

## Componentes ShadCN UI

Puedes añadir más componentes de ShadCN UI fácilmente usando su CLI:
```bash
npx shadcn-ui@latest add [nombre-del-componente]
```

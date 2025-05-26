
# Rumbos Envios - Panel de Logística

Este es un proyecto Next.js para Rumbos Envios, una plataforma de gestión de envíos y logística.

## Stack Tecnológico

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- ShadCN UI
- Genkit (para funcionalidades de IA con Google AI)
- Supabase (para base de datos y backend)

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
    NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase_aqui
    NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_de_supabase_aqui
    # Opcional: SUPABASE_SERVICE_ROLE_KEY si necesitas operaciones privilegiadas desde el backend (NO RECOMENDADO PARA CLIENTE)
    # SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_de_supabase

    # Google AI (para Genkit)
    GOOGLE_API_KEY=tu_api_key_de_google_ai_aqui
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
    -   `/pricing`: Calculadora de precios.
    -   `/delivery-suggestions`: Sugerencias de rutas por IA.
    -   `/tracking`: Seguimiento de envíos.
    -   `/orders`: Gestión de pedidos (órdenes).
-   `src/components/`: Componentes React reutilizables.
    -   `layout/`: Componentes de estructura principal (AppShell, Sidebar).
    -   `ui/`: Componentes de ShadCN UI.
    -   `icons/`: Iconos SVG personalizados.
    -   `forms/`: Formularios reutilizables (ClienteForm, EmpresaForm, etc.).
-   `src/lib/`: Utilidades y lógica compartida.
    -   `actions/`: Server Actions para interactuar con Supabase.
    -   `supabase/`: Configuración del cliente de Supabase.
    -   `validators/`: Esquemas de validación Zod.
    -   `utils.ts`: Funciones de utilidad general.
-   `src/types/`: Definiciones de TypeScript (incluyendo tipos de base de datos).
-   `src/ai/`: Lógica relacionada con Genkit.
    -   `genkit.ts`: Configuración e inicialización de Genkit.
    -   `dev.ts`: Archivo para el servidor de desarrollo de Genkit.
    -   `flows/`: Implementaciones de flujos de IA.
-   `supabase/migrations/`: Contiene los scripts de migración de la base de datos de Supabase.

## Configuración de Supabase

1.  Crea un proyecto en [Supabase](https://supabase.com/).
2.  Obtén la URL de tu proyecto y la `anon key` pública.
3.  Añádelas a tu archivo `.env.local` como `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4.  **Instala la CLI de Supabase globalmente (si no la tienes):**
    ```bash
    npm install supabase --save-dev 
    # o si prefieres globalmente (puede requerir sudo):
    # npm install supabase -g
    ```
5.  **Inicia sesión en la CLI de Supabase:**
    ```bash
    npx supabase login
    ```
6.  **Vincula tu proyecto local con tu proyecto Supabase remoto:**
    Navega al directorio raíz de tu proyecto y ejecuta:
    ```bash
    npx supabase link --project-ref TU_PROJECT_ID
    ```
    (Encuentra `TU_PROJECT_ID` en la URL de tu dashboard de Supabase o en Configuración del Proyecto > General).

7.  **Aplica las migraciones a tu base de datos remota:**
    El esquema inicial y los datos de ejemplo se encuentran en `supabase/migrations/0001_create_initial_schema.sql`.
    Para aplicar esta migración (y futuras) a tu base de datos remota:
    ```bash
    npx supabase db push
    ```
    Esto creará las tablas, tipos, funciones, RLS y datos de ejemplo definidos en el archivo de migración.

8.  **(Opcional) Para desarrollo local con Supabase local:**
    Si prefieres trabajar con una instancia local de Supabase:
    ```bash
    # Iniciar servicios de Supabase localmente (Docker debe estar corriendo)
    npx supabase start

    # Aplicar migraciones y datos de seed a la base de datos local
    npx supabase db reset
    ```
    Cuando termines el desarrollo local y quieras aplicar los cambios al proyecto remoto, usa `npx supabase db push`.

9.  **Habilita extensiones necesarias (si no se activaron automáticamente):**
    El script de migración intenta crear la extensión `uuid-ossp`. Si comentaste `postgis` y la necesitas, habilítala manualmente. Puedes hacerlo desde el Dashboard de Supabase > Database > Extensions.

## Componentes ShadCN UI

Puedes añadir más componentes de ShadCN UI fácilmente usando su CLI:
```bash
npx shadcn-ui@latest add [nombre-del-componente]
```

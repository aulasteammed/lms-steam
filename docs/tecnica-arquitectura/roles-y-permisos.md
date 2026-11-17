# Roles y permisos

## 1. Roles

| Rol | Cómo se identifica | Qué puede hacer |
|-----|--------------------|-----------------|
| Visitante | Sin sesión | Ver las páginas públicas |
| Estudiante | Sesión de Clerk | Inscribirse, ver cursos, presentar evaluaciones, obtener constancias |
| Profesor | `isTeacher(userId)` | Todo lo anterior y el panel `/teacher` |

La autenticación es de Clerk. La aplicación no guarda usuarios ni roles en la base de datos.

## 2. Profesor

`lib/teacher.ts` define `isTeacher(userId)`, que compara el `userId` de Clerk con la variable `NEXT_PUBLIC_TEACHER_ID`.

Se usa en:

- `app/(dashboard)/(routes)/teacher/layout.tsx`: redirige a `/` a quien no sea profesor; protege todas las páginas de `/teacher`.
- `sidebar-routes.tsx` y `navbar-routes.tsx`: muestran el menú del profesor y el botón "Modo Profesor" / "Modo Estudiante".
- Rutas de la API y acciones de servidor que lo exigen (ver [api.md](api.md)).
- `app/api/uploadthing/core.ts`: todas las subidas de archivos.

Para asignar el profesor se pone su `userId` de Clerk (formato `user_...`) en `NEXT_PUBLIC_TEACHER_ID` y se reinicia o redespliega la aplicación.

## 3. Rutas públicas

`middleware.ts` usa `clerkMiddleware`. Las rutas de esta lista no requieren sesión; todas las demás exigen sesión (`auth.protect()`).

| Páginas | API |
|---------|-----|
| `/`, `/about`, `/search`, `/feed` | `/api/event` |
| `/trayectoria` y subrutas | `/api/uploadthing` |
| `/blog` y subrutas | `/api/blog/articles/<slug>/views` |
| `/sign-in`, `/sign-up` | `/api/share-image` |
| `/certificate/verify/...` | |

El `matcher` excluye del middleware los archivos estáticos (`_next`, imágenes, fuentes, CSS, JS…), `robots.txt` y `sitemap.xml`.

## 4. Buscadores y vistas previas

Cuando el `User-Agent` corresponde a un buscador o a un servicio de vista previa (Googlebot, Bingbot, DuckDuckBot, Yandex, Baidu, Applebot, Facebook, X/Twitter, LinkedIn, WhatsApp, Telegram, Discord, Slack…) y la ruta es pública, el middleware reescribe la cabecera `accept` a `*/*` y quita `sec-fetch-dest` antes de pasar la petición a Clerk.

`app/robots.ts` permite rastrear el sitio y bloquea `/teacher/`, `/mycourses`, `/courses/`, `/api/`, `/sign-in` y `/sign-up`. `app/sitemap.ts` lista las páginas públicas, los artículos del blog y los proyectos de Trayectoria. La verificación de constancias se marca `noindex`.

# API

## 1. Convenciones

Las rutas están en `app/api/` (Route Handlers de Next.js). Reciben y devuelven JSON salvo donde se indica. Los errores responden con texto y el código HTTP correspondiente.

**Acceso**

| Nivel | Significado |
|-------|-------------|
| Público | Sin sesión (ruta pública en `middleware.ts`) |
| Sesión | Cualquier usuario con sesión de Clerk |
| Dueño | Sesión y el curso pertenece al usuario (`Course.userId`) |
| Profesor | `isTeacher(userId)` (ver [roles y permisos](roles-y-permisos.md)) |

Las acciones de servidor de Trayectoria (`actions/timeline.ts`) no son endpoints HTTP; se describen en el [módulo de Trayectoria](modulos/trayectoria.md).

## 2. Cursos y módulos

Prefijo: `/api/courses`.

| Ruta | Método | Acceso | Entrada | Respuesta |
|------|--------|--------|---------|-----------|
| `/` | POST | Profesor | `{ title }` | `Course` |
| `/[courseId]` | PATCH | Dueño | Campos del curso, `categoryIds[]` | `Course` con categorías |
| `/[courseId]` | DELETE | Dueño | — | `Course`. `403` si el curso tiene constancias |
| `/[courseId]/publish` | PATCH | Dueño | — | `Course`. Exige título, descripción, nivel, habilidades, imagen, precio, una categoría y un módulo publicado |
| `/[courseId]/unpublish` | PATCH | Dueño | — | `Course` |
| `/[courseId]/enroll` | POST | Sesión | — | `{ message }`. Curso publicado; `400` si ya está inscrito |
| `/[courseId]/attachments` | POST | Profesor y dueño | `{ url }` | `Attachment` |
| `/[courseId]/attachments/[attachmentId]` | DELETE | Profesor y dueño | — | `Attachment` |
| `/[courseId]/modules` | POST | Dueño | `{ title }` | `Module` |
| `/[courseId]/modules/reorder` | PUT | Dueño | `{ list: [{ id, position }] }` | `"Success"` |
| `/[courseId]/modules/[moduleId]` | PATCH | Dueño | Campos del módulo | `Module` |
| `/[courseId]/modules/[moduleId]` | DELETE | Dueño | — | `Module` |
| `/[courseId]/modules/[moduleId]/publish` | PATCH | Dueño | — | `Module`. Exige título, descripción y video |
| `/[courseId]/modules/[moduleId]/unpublish` | PATCH | Dueño | — | `Module` |
| `/[courseId]/modules/[moduleId]/progress` | PUT | Sesión | `{ isCompleted }` | `UserProgress` |

## 3. Evaluaciones

Prefijo: `/api/courses/[courseId]/modules/[moduleId]/evaluations`.

| Ruta | Método | Acceso | Entrada | Respuesta |
|------|--------|--------|---------|-----------|
| `/` | POST | Sesión | — | `Evaluation` (la existente si ya hay una) |
| `/[evaluationId]` | POST | Sesión | `{ maxAttempts }` | `{ updatedEvaluation }` |
| `/[evaluationId]` | DELETE | Sesión | — | Texto de confirmación |
| `/[evaluationId]/publish` | PATCH | Sesión | — | `Evaluation`. Exige preguntas válidas |
| `/[evaluationId]/unpublish` | PATCH | Sesión | — | `{ success: true }` |
| `/[evaluationId]/questions` | POST | Sesión | `{ title, type, answers: [{ title, isCorrect }] }` | `Question` con respuestas |
| `/[evaluationId]/questions/[questionId]` | PATCH | Dueño | `{ title, type, answers }` | `Question` con respuestas |
| `/[evaluationId]/questions/[questionId]` | DELETE | Dueño | — | Texto de confirmación |
| `/[evaluationId]/results` | POST | Sesión | `{ selectedAnswers: [{ title, questionId, isCorrect }], score }` | `EvaluationResult`. `403` sin intentos |
| `/[evaluationId]/retry-code` | POST | Sesión | `{ code }` | `{ success, message }` |

Editar o eliminar una pregunta despublica la evaluación y el módulo.

## 4. Blog

Prefijo: `/api/blog/articles`.

| Ruta | Método | Acceso | Entrada | Respuesta |
|------|--------|--------|---------|-----------|
| `/` | GET | Sesión | Query: `cursor`, `limit` (máx. 50), `year` | `{ articles, nextCursor }` (solo publicados) |
| `/` | POST | Profesor | `{ title }` (máx. 100) | `Article` en borrador |
| `/[slug]` | GET | Sesión | — | `Article` con conteo de vistas. Borradores y archivados solo para el profesor |
| `/[slug]` | PUT | Profesor | Campos del artículo | `Article` (+ `newSlug` si cambió) |
| `/[slug]` | DELETE | Profesor | — | `204` |
| `/[slug]/publish` | PATCH | Profesor | `{ action: "publish" \| "unpublish" \| "archive" }` | `Article` (+ `newSlug` si cambió) |
| `/[slug]/views` | POST | Público | `{ articleId }` | `{ ok: true }` |

## 5. Eventos

| Ruta | Método | Acceso | Entrada | Respuesta |
|------|--------|--------|---------|-----------|
| `/api/event` | GET | Público | — | `Event[]` que empiezan desde hace 30 días |
| `/api/event` | POST | Sesión | `{ title, description?, location, imageUrl?, startDateTime, endDateTime, link }` | `Event` (`201`) |
| `/api/event?id=<id>` | DELETE | Sesión (autor del evento) | — | `{ message, eventId }` |
| `/api/event/click` | POST | Sesión | `{ eventId }` | `{ ok: true }` |

## 6. Archivos e imágenes

| Ruta | Método | Acceso | Entrada | Respuesta |
|------|--------|--------|---------|-----------|
| `/api/uploadthing` | GET, POST | Público; cada subida exige Profesor | Protocolo de UploadThing | URL del archivo |
| `/api/share-image` | GET | Público | Query: `src` (URL de UploadThing) | Imagen JPEG 1200 × 630 |

Rutas de subida (`app/api/uploadthing/core.ts`):

| Ruta | Tipo | Límite |
|------|------|--------|
| `courseImage` | Imagen | 4 MB, 1 archivo |
| `courseAttachment` | Texto, imagen, video, audio, PDF | Límites por defecto de UploadThing |
| `moduleVideo` | Video | 1 archivo |
| `timelineImage` | Imagen | 4 MB, 2 archivos |
| `timelinePdf` | PDF | 32 MB, 1 archivo |
| `timelinePage` | Imagen | 2 MB, 12 archivos |

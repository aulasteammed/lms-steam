# Modelo de Datos

## 1. Tecnología y enfoque

La persistencia utiliza MongoDB con Prisma ORM (`provider = "mongodb"`). El esquema está en `prisma/schema.prisma` y el detalle de cada campo en [`prisma/documentation.md`](../../prisma/documentation.md). Los usuarios están en Clerk; los modelos guardan su `userId` como texto.

## 2. Entidades por dominio

| Dominio | Entidades |
|---------|-----------|
| Cursos | `Course`, `Category`, `CourseCategory`, `Module`, `Attachment`, `Registration`, `UserProgress`, `Rating` |
| Evaluaciones | `Evaluation`, `Question`, `Answer`, `EvaluationResult`, `SelectedAnswer`, `RetryAccessCode`, `EvaluationRetryGrant`, `EvaluationRetryEmailLog` |
| Certificados | `Certificate` |
| Blog | `Article`, `ArticleView` |
| Trayectoria | `TimelineEntry`, `TimelineInstitution`, `TimelineDocument` |
| Eventos | `Event` |

## 3. Diagramas entidad-relación

### 3.1 Cursos y certificados

```mermaid
erDiagram
    COURSE ||--o{ MODULE : contiene
    COURSE ||--o{ ATTACHMENT : adjunta
    COURSE ||--o{ REGISTRATION : registra
    COURSE ||--o{ RATING : recibe
    COURSE ||--o{ CERTIFICATE : emite
    COURSE ||--o{ COURSE_CATEGORY : clasifica
    CATEGORY ||--o{ COURSE_CATEGORY : agrupa
    MODULE ||--o{ USER_PROGRESS : sigue
```

### 3.2 Evaluaciones

```mermaid
erDiagram
    MODULE ||--o| EVALUATION : define
    EVALUATION ||--o{ QUESTION : incluye
    QUESTION ||--o{ ANSWER : tiene
    EVALUATION ||--o{ EVALUATION_RESULT : produce
    EVALUATION_RESULT ||--o{ SELECTED_ANSWER : guarda
    QUESTION ||--o{ SELECTED_ANSWER : registra
    EVALUATION ||--o{ EVALUATION_RETRY_GRANT : concede
    EVALUATION ||--o{ EVALUATION_RETRY_EMAIL_LOG : notifica
    RETRY_ACCESS_CODE {
        string code
        boolean isActive
    }
```

`RetryAccessCode` no tiene relaciones declaradas.

### 3.3 Blog

```mermaid
erDiagram
    ARTICLE ||--o{ ARTICLE_VIEW : registra
```

### 3.4 Trayectoria

```mermaid
erDiagram
    TIMELINE_ENTRY }o--o{ TIMELINE_INSTITUTION : involucra
    TIMELINE_ENTRY ||--o{ TIMELINE_DOCUMENT : tiene
    TIMELINE_ENTRY }o--o{ TIMELINE_ENTRY : "se relaciona"
```

Imágenes, lugares, historia, cita y páginas de documentos son tipos embebidos dentro de cada registro.

### 3.5 Eventos

```mermaid
erDiagram
    EVENT {
        string title
        datetime startDateTime
        string link
        int clickCount
    }
```

## 4. Restricciones clave

- `Module` 1:1 opcional `Evaluation` (`moduleId` único).
- `CourseCategory`: único `[courseId, categoryId]`.
- `EvaluationRetryEmailLog`: único `[userId, evaluationId, attempt]`.
- Únicos: `RetryAccessCode.code`, `Article.slug`, `TimelineEntry.slug`, `TimelineInstitution.name` y `slug`, `TimelineDocument` `[entryId, slug]`.
- `TimelineDocument` se borra en cascada con su `TimelineEntry`.

## 5. Notas para mantenimiento

- Los IDs son `ObjectId` mapeados en `_id`.
- `npx prisma db push` sincroniza índices y restricciones únicas. Los cambios en datos ya guardados se hacen con scripts como `scripts/migrate-course-categories.ts`.
- Un cambio de entidades debe reflejarse en las rutas API, las acciones del servidor, los formularios y [`prisma/documentation.md`](../../prisma/documentation.md).

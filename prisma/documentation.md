# Documentación de la Base de Datos -  Aplicativo Web para la Gestión del Aula STEAM

Este documento describe la estructura actual de la base de datos del aplicativo web para la gestión del Aula STEAM, incluyendo modelos, campos, relaciones y características clave. La fuente de verdad es `prisma/schema.prisma`.

## Cursos y estructura general
- `Course`
- `Category`
- `CourseCategory`
- `Module`
- `Attachment`

## Progreso y participación
- `UserProgress`
- `Registration`
- `Rating`
- `Certificate`

## Evaluaciones y resultados
- `EvaluationType` (enum)
- `QuestionType` (enum)
- `Evaluation`
- `Question`
- `Answer`
- `EvaluationResult`
- `SelectedAnswer`

## Reintentos de evaluación
- `RetryAccessCode`
- `EvaluationRetryGrant`
- `EvaluationRetryEmailLog`

## Blog
- `ArticleStatus` (enum)
- `ArticleTemplate` (enum)
- `SocialPlatform` (enum)
- `Article`
- `ArticleView`

## Trayectoria (mapa, línea de tiempo y publicaciones)
- `TimelineEntryType` (enum)
- `TimelineEntryStatus` (enum)
- `ParticipationModality` (enum)
- `TimelineDocumentKind` (enum)
- `TimelineEntry`
- `TimelineInstitution`
- `TimelineDocument`
- Tipos compuestos (embebidos): `TimelineImage`, `TimelineLocation`, `TimelineStory`, `TimelineQuote`, `TimelineDocumentPage`

## Eventos
- `Event`
---

## Modelo: `Course`

| Campo           | Tipo     | Descripción                               |
| --------------- | -------- | ----------------------------------------- |
| id              | String   | Identificador único del curso             |
| userId          | String   | ID del usuario que creó el curso          |
| title           | String   | Título del curso                          |
| description     | String?  | Descripción general del curso             |
| imageUrl        | String?  | URL de la imagen representativa del curso |
| previousSkills  | String?  | Habilidades previas esperadas             |
| developedSkills | String?  | Habilidades desarrolladas al finalizar    |
| level           | String?  | Nivel de dificultad                       |
| price           | Float?   | Precio del curso                          |
| isPublished     | Boolean  | Estado de publicación del curso           |
| createdAt       | DateTime | Fecha de creación                         |
| updatedAt       | DateTime | Fecha de última actualización             |

**Relaciones:**

* `courseCategories`: categorías del curso, a través de la tabla puente `CourseCategory`
* `modules`: módulos del curso
* `attachments`: archivos adjuntos
* `registered`: usuarios registrados
* `certificates`: certificaciones de los estudiantes
* `ratings`: calificaciones dejadas por los estudiantes

**Índices:** `[isPublished, createdAt]`.

---

## Modelo: `Category`

| Campo | Tipo   | Descripción                  |
| ----- | ------ | ---------------------------- |
| id    | String | Identificador único          |
| name  | String | Nombre único de la categoría |

**Relaciones:**

* `courseCategories`: cursos asociados a esta categoría, a través de `CourseCategory`

---

## Modelo: `CourseCategory`

Tabla puente que permite que un curso tenga varias categorías y que una categoría agrupe varios cursos (relación N:M).

| Campo      | Tipo     | Descripción              |
| ---------- | -------- | ------------------------ |
| id         | String   | Identificador único      |
| courseId   | String   | ID del curso             |
| categoryId | String   | ID de la categoría       |
| createdAt  | DateTime | Fecha de la asociación   |

**Relaciones:**

* `course`: curso clasificado
* `category`: categoría asignada

**Restricciones e índices:**

* `@@unique([courseId, categoryId])`: un curso no puede tener la misma categoría dos veces.
* `@@index([categoryId])`: búsqueda de cursos por categoría.

---

## Modelo: `Attachment`

| Campo     | Tipo     | Descripción                |
| --------- | -------- | -------------------------- |
| id        | String   | Identificador del adjunto  |
| name      | String   | Nombre del archivo         |
| url       | String   | URL del archivo            |
| courseId  | String   | Curso al que está asociado |
| createdAt | DateTime | Fecha de creación          |
| updatedAt | DateTime | Fecha de actualización     |

**Relaciones:**

* `course`: curso asociados a el archivo adjunto

---

## Modelo: `Module`

| Campo             | Tipo            | Descripción                   |
|-------------------|-----------------|-------------------------------|
| id                | String          | Identificador del módulo      |
| title             | String          | Título del módulo             |
| description       | String?         | Descripción del módulo        |
| videoUrl          | String?         | URL del video                 |
| videoTranscript   | String?         | Transcripción del video       |
| position          | Int             | Orden del módulo              |
| isPublished       | Boolean         | Estado de publicación         |
| isEnabled         | Boolean         | Si el módulo está habilitado  |
| isEvaluable       | Boolean         | Si el módulo es evaluable     |
| evaluationMethod  | EvaluationType? | Tipo de evaluación del módulo |
| courseId          | String          | ID del curso al que pertenece |
| createdAt         | DateTime        | Fecha de creación             |
| updatedAt         | DateTime        | Fecha de actualización        |

**Relaciones:**

* `course`: curso al que pertenece el módulo
* `userProgress`: progreso de los usuarios
* `evaluation`: evaluación del módulo

**Índices:** `[courseId, isPublished]`.

---

## Modelo: `UserProgress`

| Campo       | Tipo     | Descripción                 |
|-------------| -------- |-----------------------------|
| id          | String   | Identificador del progreso  |
| userId      | String   | ID del usuario              |
| moduleId    | String   | ID del módulo               |
| isCompleted | Boolean  | Si el módulo fue completado |
| createdAt   | DateTime | Fecha de creación           |
| updatedAt   | DateTime | Fecha de actualización      |

**Relaciones:**

* `module`: módulo al que pertenece el progreso

**Índices:** `[userId, moduleId]`.

---

## Modelo: `Registration`

| Campo     | Tipo     | Descripción            |
| --------- | -------- | ---------------------- |
| id        | String   | ID del registro        |
| userId    | String   | ID del estudiante      |
| courseId  | String   | ID del curso           |
| createdAt | DateTime | Fecha de inscripción   |
| updatedAt | DateTime | Fecha de actualización |

**Relaciones:**

* `course`: curso al que se registró

**Índices:** `[userId, courseId]`.

---

## Modelo: `Rating`

Permite a los estudiantes dejar una calificación opcional al finalizar el curso.

| Campo     | Tipo     | Descripción                        |
| --------- | -------- | ---------------------------------- |
| id        | String   | Identificador único                |
| userId    | String   | ID del estudiante que califica     |
| courseId  | String   | ID del curso calificado            |
| rating    | Int      | Puntuación del curso (1 a 5)       |
| comment   | String?  | Comentario opcional sobre el curso |
| createdAt | DateTime | Fecha de creación                  |
| updatedAt | DateTime | Fecha de última actualización      |

**Relaciones:**

* `course`: curso al que pertenece la calificación

---

## Enumeración: `EvaluationType`

Valores de `Module.evaluationMethod`. Al crear o eliminar una evaluación, la API asigna `null` a este campo. `normalizeQuestionType` (`lib/evaluation.ts`) lo usa para determinar el tipo de una pregunta que no tiene `type`. El tipo de cada pregunta está en `QuestionType`.

| Valor      | Etiqueta en `lib/evaluation.ts` | Descripción                                                             |
|------------|---------------------------------|-------------------------------------------------------------------------|
| `sequence` | Secuencial                      | El estudiante debe ordenar correctamente una serie de pasos o procesos. |
| `locate`   | Ubicar (obsoleto)               | `normalizeQuestionType` lo trata como `sequence`.                       |
| `single`   | Selección única                 | Preguntas con opciones múltiples pero solo una respuesta correcta.      |
| `multiple` | Selección múltiple              | Preguntas con varias respuestas correctas posibles.                     |
| `open`     | Respuesta abierta               | Preguntas que tienen una respuesta abierta.                             |

---

## Enumeración: `QuestionType`

Tipo de cada pregunta (`Question.type`). Una evaluación puede tener preguntas de distintos tipos. Los valores coinciden con `ACTIVE_QUESTION_TYPES` en `lib/evaluation.ts`.

| Valor      | Etiqueta           | Descripción                                               |
|------------|--------------------|-----------------------------------------------------------|
| `single`   | Selección única    | Una sola respuesta correcta entre varias opciones.        |
| `multiple` | Selección múltiple | Varias respuestas correctas posibles.                     |
| `open`     | Respuesta abierta  | El estudiante escribe su respuesta.                       |
| `sequence` | Secuencial         | El estudiante ordena las opciones en la secuencia correcta. |

Si una pregunta no tiene `type`, `normalizeQuestionType` usa el `EvaluationType` del módulo y, si tampoco existe, asume `single`.

---

## Modelo: `Evaluation`

| Campo        | Tipo           | Descripción                                        |
|--------------|----------------|----------------------------------------------------|
| id           | String         | Identificador único                                |
| maxAttempts  | Int?           | Número base de intentos. Si es nulo, se toma como 0 |
| moduleId     | String         | ID del módulo (único: una evaluación por módulo)   |
| isPublished  | Boolean        | Estado de la publicación                           |
| createdAt    | DateTime       | Fecha de creación                                  |
| updatedAt    | DateTime       | Fecha de actualización                             |


**Relaciones:**

* `module`: módulo al que pertenece la evaluación
* `questions`: preguntas de la evaluación
* `evaluationResults`: resultado de las evaluaciones
* `retryGrants`: intentos adicionales concedidos con código de reintento
* `retryEmailLogs`: correos enviados por intentos agotados

---

## Modelo: `Question`

| Campo        | Tipo          | Descripción                                   |
|--------------|---------------|-----------------------------------------------|
| id           | String        | Identificador único                           |
| title        | String        | Título de la pregunta                         |
| type         | QuestionType? | Tipo de pregunta                              |
| evaluationId | String        | ID de la evaluación                           |
| createdAt    | DateTime      | Fecha de creación                             |
| updatedAt    | DateTime      | Fecha de actualización                        |


**Relaciones:**

* `evaluation`: evaluación asociada a la pregunta
* `answers`: respuestas a la pregunta
* `selectedAnswers`: respuestas seleccionadas por los estudiantes

---

## Modelo: `Answer`

| Campo      | Tipo     | Descripción                        |
|------------|----------|------------------------------------|
| id         | String   | Identificador único                |
| title      | String   | Título de la respuesta             |
| questionId | String   | ID de la pregunta                  |
| isCorrect  | Boolean  | Estado si la respuesta es correcta |
| createdAt  | DateTime | Fecha de creación                  |
| updatedAt  | DateTime | Fecha de actualización             |

**Relaciones:**

* `question`: pregunta asociada a la respuesta

---

## Modelo: `EvaluationResult`

| Campo        | Tipo     | Descripción                                                  |
|--------------|----------|--------------------------------------------------------------|
| id           | String   | Identificador único                                          |
| userId       | String   | ID del estudiante que resuelve la evaluación                 |
| evaluationId | String   | ID de la evaluación que resuelve                             |
| attempt      |  Int     | Número de intento del usuario. Ej: 1 para el primer intento. |
| score        | Float    | Puntaje de la evaluación (se aprueba con 80 o más)           |
| completedAt  | DateTime | Fecha en la cual se completó                                 |

**Relaciones:**

* `evaluation`: evaluation a la que pertenecen los resultados
* `answers`: respuestas seleccionadas en la evaluación

---

## Modelo: `SelectedAnswer`

| Campo              | Tipo     | Descripción                        |
|--------------------|----------|------------------------------------|
| id                 | String   | Identificador único                |
| title              | String   | Título de la respuesta             |
| evaluationResultId | String   | ID de la evaluación resultado      |
| questionId         | String   | ID de la pregunta realizada        |
| isCorrect          | Boolean  | Estado si la respuesta es correcta |

**Relaciones:**

* `evaluationResult`: grupo de respuestas correspondiente a un intento específico del usuario.
* `question`: pregunta de la evaluación

---

## Modelo: `RetryAccessCode`

Código que el aula entrega en persona a un estudiante que agotó sus intentos. Solo hay **un código activo a la vez**, compartido por todas las evaluaciones: al usarse se desactiva y se genera otro (`lib/evaluation-retry.ts`). Los códigos tienen 8 caracteres del alfabeto `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`.

| Campo               | Tipo      | Descripción                                          |
|---------------------|-----------|------------------------------------------------------|
| id                  | String    | Identificador único                                  |
| code                | String    | Código de reintento (único)                          |
| isActive            | Boolean   | `true` mientras el código no se ha usado             |
| usedByUserId        | String?   | ID (Clerk) del estudiante que lo usó                 |
| usedForEvaluationId | String?   | ID de la evaluación en la que se usó                 |
| usedAt              | DateTime? | Fecha de uso                                         |
| createdAt           | DateTime  | Fecha de creación                                    |
| updatedAt           | DateTime  | Fecha de actualización                               |

**Relaciones:**

* No tiene relaciones declaradas en Prisma. `usedForEvaluationId` guarda el ID de la evaluación como referencia, sin relación.

---

## Modelo: `EvaluationRetryGrant`

Intentos adicionales concedidos a un estudiante en una evaluación al canjear un código. Los intentos permitidos son `Evaluation.maxAttempts` más la suma de `extraAttempts` de todas sus concesiones (`getAllowedAttempts` en `lib/evaluation-retry.ts`).

| Campo         | Tipo     | Descripción                                             |
|---------------|----------|---------------------------------------------------------|
| id            | String   | Identificador único                                     |
| userId        | String   | ID (Clerk) del estudiante                               |
| evaluationId  | String   | ID de la evaluación                                     |
| extraAttempts | Int      | Intentos adicionales concedidos (por defecto 2; el canje de un código concede 2) |
| codeUsed      | String   | Código de reintento con el que se concedieron           |
| createdAt     | DateTime | Fecha de la concesión                                   |

**Relaciones:**

* `evaluation`: evaluación a la que se suman los intentos

---

## Modelo: `EvaluationRetryEmailLog`

Registro de los correos "Agotaste tus intentos" enviados con Resend.

| Campo        | Tipo     | Descripción                                    |
|--------------|----------|------------------------------------------------|
| id           | String   | Identificador único                            |
| userId       | String   | ID (Clerk) del estudiante notificado           |
| evaluationId | String   | ID de la evaluación                            |
| attempt      | Int      | Número del intento que agotó los intentos      |
| sentAt       | DateTime | Fecha de envío                                 |

**Relaciones:**

* `evaluation`: evaluación a la que corresponde el aviso

**Restricciones:** `@@unique([userId, evaluationId, attempt])`: un solo correo por estudiante, evaluación e intento. Solo se crea el registro si Resend confirma el envío.

---

## Modelo: `Certificate`

| Campo          | Tipo       | Descripción                       |
|----------------|------------|-----------------------------------|
| id             | String     | Identificador único               |
| userId         | String     | ID del estudiante del certificado |
| courseId       | String     | ID del curso finalizado           |
| issuedAt       | DateTime   | Fecha certificación               |
| certificateUrl | String?    | Url del certificado               |
| createdAt      | DateTime   | Fecha de creación                 |
| updatedAt      | DateTime   | Fecha de actualización            |

**Relaciones:**

* `course`: curso a la que pertenece el certificado

---

## Enumeración: `ArticleStatus`

Estado de un artículo del blog. Lo cambia `PATCH /api/blog/articles/[slug]/publish`.

| Valor       | Descripción                                                                 |
|-------------|-----------------------------------------------------------------------------|
| `draft`     | Borrador. Estado inicial; solo lo ve el profesor. También al despublicar.   |
| `published` | Publicado: aparece en `/blog` y en la API pública.                          |
| `archived`  | Archivado: deja de mostrarse en el blog público pero no se borra.           |

---

## Enumeración: `ArticleTemplate`

Plantilla visual del artículo.

| Valor            | Descripción |
|------------------|-------------|
| `cover_person`   | Personaje   |
| `full_article`   | Artículo    |
| `profile_simple` | Perfil      |
| `news_short`     | Noticia     |

---

## Enumeración: `SocialPlatform`

Red social del autor de un artículo (`Article.authorSocialPlatform`).

| Valor       | Descripción        |
|-------------|--------------------|
| `instagram` | Instagram          |
| `facebook`  | Facebook           |
| `linkedin`  | LinkedIn           |
| `x`         | X (antes Twitter)  |
| `github`    | GitHub             |
| `website`   | Sitio web personal |

---

## Modelo: `Article`

Artículo del blog. El contenido se guarda como una lista de bloques JSON.

| Campo                | Tipo            | Descripción                                                          |
|----------------------|-----------------|----------------------------------------------------------------------|
| id                   | String          | Identificador único                                                  |
| slug                 | String          | Dirección del artículo: `/blog/<slug>` (único)                       |
| title                | String          | Título (máximo 100 caracteres al crearlo)                            |
| subtitle             | String?         | Subtítulo                                                            |
| hookPhrase           | String?         | Frase gancho. Si está vacía al publicar, se genera del subtítulo o el título (máx. 80 caracteres) |
| coverImage           | String?         | URL de la imagen de portada (Uploadthing)                            |
| authorName           | String          | Nombre del autor (obligatorio para publicar)                         |
| authorBio            | String?         | Biografía corta del autor                                            |
| authorPhoto          | String?         | URL de la foto del autor                                             |
| authorSocialPlatform | SocialPlatform? | Red social del autor                                                 |
| authorSocialUrl      | String?         | Enlace a esa red social                                              |
| template             | ArticleTemplate | Plantilla visual (por defecto `cover_person`)                        |
| accentColor          | String          | Color de acento en hexadecimal (por defecto `#e8622a`)               |
| darkColColor         | String          | Color de la columna oscura en hexadecimal (por defecto `#12110f`)    |
| blocks               | Json[]          | Bloques de contenido: `paragraph`, `pullquote`, `image`, `list`, `divider` |
| status               | ArticleStatus   | Estado (por defecto `draft`)                                         |
| publishedAt          | DateTime?       | Fecha de la primera publicación                                      |
| createdAt            | DateTime        | Fecha de creación                                                    |
| updatedAt            | DateTime        | Fecha de actualización                                               |

**Relaciones:**

* `views`: vistas registradas del artículo

---

## Modelo: `ArticleView`

Una vista de un artículo. Se registra cuando el lector llega al final del artículo.

| Campo     | Tipo     | Descripción                                                   |
|-----------|----------|---------------------------------------------------------------|
| id        | String   | Identificador único                                           |
| articleId | String   | ID del artículo                                               |
| userId    | String?  | La API guarda `null`                                          |
| sessionId | String?  | UUID aleatorio generado en el servidor en cada vista          |
| viewedAt  | DateTime | Fecha de la vista                                             |

**Relaciones:**

* `article`: artículo visto

---

## Enumeración: `TimelineEntryType`

Tipo de registro de la Trayectoria.

| Valor           | Etiqueta      | Descripción                                                                 |
|-----------------|---------------|-----------------------------------------------------------------------------|
| `project`       | Proyecto      | Proyecto del aula, con página propia |
| `participation` | Participación | Evento en el que participó el aula   |
| `alliance`      | Alianza       | Trabajo con una institución aliada   |

---

## Enumeración: `TimelineEntryStatus`

| Valor       | Descripción                                                              |
|-------------|--------------------------------------------------------------------------|
| `draft`     | Borrador; solo se ve en el panel                                         |
| `published` | Publicado en el sitio                                                    |

---

## Enumeración: `ParticipationModality`

Modalidad de una participación (`TimelineEntry.modality`).

| Valor       | Descripción |
|-------------|-------------|
| `in_person` | Presencial  |
| `virtual`   | Virtual     |
| `hybrid`    | Híbrida     |

---

## Enumeración: `TimelineDocumentKind`

Clase de documento de un proyecto. Los informes (`report`) se listan aparte de las demás clases.

| Valor         | Descripción |
|---------------|-------------|
| `newspaper`   | Periódico   |
| `magazine`    | Revista     |
| `booklet`     | Cartilla    |
| `book`        | Libro       |
| `deliverable` | Entregable  |
| `report`      | Informe     |
| `other`       | Otro        |

---

## Modelo: `TimelineEntry`

Un registro del mapa y la línea de tiempo: proyecto, participación o alianza.

| Campo             | Tipo                   | Aplica a          | Descripción |
|-------------------|------------------------|-------------------|-------------|
| id                | String                 | Todos             | Identificador único |
| type              | TimelineEntryType      | Todos             | Proyecto, participación o alianza |
| status            | TimelineEntryStatus    | Todos             | Estado (por defecto `draft`) |
| slug              | String                 | Todos             | Dirección: `/trayectoria/<slug>` (único). Lleva el año de cierre (ej. `entre-aguas-2026`) |
| previousSlugs     | String[]               | Todos             | Direcciones anteriores, que redirigen a la actual |
| title             | String                 | Todos             | Nombre del proyecto, de la participación o de la alianza |
| shortDescription  | String                 | Todos             | Descripción corta (máximo 250 caracteres) |
| startYear         | Int                    | Todos             | Año de inicio; en participaciones, el año en que ocurrió. Un borrador sin periodo guarda `0` |
| endYear           | Int?                   | Todos             | Año de cierre. Vacío = en curso (se ubica en el año actual) |
| locationText      | String                 | Todos             | Resumen de la ubicación: "Cauca, Chocó y Antioquia" |
| locations         | TimelineLocation[]     | Todos             | Lugares en el mapa, máximo 6. Vacío en participaciones virtuales |
| images            | TimelineImage[]        | Todos             | Fotos: 2 en proyectos, 1 en participaciones y alianzas |
| institutionIds    | String[]               | Todos             | Instituciones relacionadas (ver relación `institutions`) |
| story             | TimelineStory?         | Proyecto          | Historia: título y párrafos |
| quote             | TimelineQuote?         | Proyecto          | Cita destacada |
| acknowledgements  | String?                | Proyecto          | Agradecimientos |
| externalLinkUrl   | String?                | Proyecto          | Enlace externo |
| externalLinkText  | String?                | Proyecto          | Texto del enlace externo |
| participationDate | DateTime?              | Participación     | Fecha en que el aula participó |
| modality          | ParticipationModality? | Participación     | Presencial, virtual o híbrida |
| reason            | String?                | Participación     | Por qué se participó |
| speakerName       | String?                | Participación     | Nombre del ponente |
| speakerRole       | String?                | Participación     | Cargo o rol del ponente |
| organizer         | String?                | Participación     | Quién organizó el evento (texto libre, no es una institución del registro) |
| relatedEntryIds   | String[]               | Participación, alianza | Proyectos o participaciones con los que se relaciona |
| publishedAt       | DateTime?              | Todos             | Fecha de la primera publicación |
| createdAt         | DateTime               | Todos             | Fecha de creación |
| updatedAt         | DateTime               | Todos             | Fecha de actualización |

**Relaciones:**

* `institutions`: instituciones (`TimelineInstitution`). Proyecto: instituciones involucradas. Alianza: la institución aliada. Participación: instituciones aliadas con las que fue el aula.
* `documents`: documentos del proyecto (`TimelineDocument`).
* `relatedEntryIds`: referencia a otros `TimelineEntry` sin relación declarada en Prisma.

**Índices:** `[status, type]`, `[relatedEntryIds]`, `[institutionIds]`, `[previousSlugs]`.

---

## Modelo: `TimelineInstitution`

Institución u organización. Se registra una sola vez y se enlaza desde los proyectos, participaciones y alianzas en que aparece.

| Campo     | Tipo     | Descripción                                                        |
|-----------|----------|--------------------------------------------------------------------|
| id        | String   | Identificador único                                                |
| name      | String   | Nombre completo, sin siglas sueltas (único)                        |
| slug      | String   | Nombre sin tildes ni mayúsculas (único)                            |
| acronym   | String?  | Sigla, si tiene (ej. "UNAL")                                       |
| website   | String?  | Sitio web                                                          |
| entryIds  | String[] | IDs de los registros donde aparece                                 |
| createdAt | DateTime | Fecha de creación                                                  |
| updatedAt | DateTime | Fecha de actualización                                             |

**Relaciones:**

* `entries`: registros (`TimelineEntry`) en que aparece. Relación N:M: ambos lados guardan la lista de IDs.

---

## Modelo: `TimelineDocument`

Documento de un proyecto que se lee en el visor y se descarga: periódico, revista, informe u otro entregable. Al subirlo, el PDF se convierte en imágenes, una por página.

| Campo        | Tipo                   | Descripción                                                          |
|--------------|------------------------|----------------------------------------------------------------------|
| id           | String                 | Identificador único                                                  |
| entryId      | String                 | ID del proyecto (`TimelineEntry`)                                    |
| slug         | String                 | Dirección del visor: `/trayectoria/<proyecto>/lector/<slug>`         |
| title        | String                 | Título del documento                                                 |
| kind         | TimelineDocumentKind   | Clase de documento                                                   |
| description  | String?                | Descripción                                                          |
| pdfUrl       | String                 | URL del PDF original, para la descarga                               |
| pdfSizeBytes | Int?                   | Tamaño del PDF en bytes                                              |
| pages        | TimelineDocumentPage[] | Páginas convertidas a imagen, en orden                               |
| pageCount    | Int                    | Número de páginas                                                    |
| pageWidth    | Int                    | Ancho de una página en píxeles (da la proporción al visor)           |
| pageHeight   | Int                    | Alto de una página en píxeles                                        |
| position     | Int                    | Orden dentro del proyecto (por defecto 0)                            |
| createdAt    | DateTime               | Fecha de creación                                                    |
| updatedAt    | DateTime               | Fecha de actualización                                               |

**Relaciones:**

* `entry`: proyecto al que pertenece. Con `onDelete: Cascade`: al borrar el proyecto se borran sus documentos.

**Restricciones e índices:**

* `@@unique([entryId, slug])`: el slug es único dentro de cada proyecto.
* `@@index([entryId, position])`: documentos de un proyecto ya ordenados.

---

## Tipos compuestos de Trayectoria

MongoDB guarda estos tipos **embebidos** dentro del documento que los usa; no son colecciones aparte.

| Tipo                   | Campos                                               | Se usa en                     |
|------------------------|------------------------------------------------------|-------------------------------|
| `TimelineImage`        | `url`, `alt`, `credit?`                              | `TimelineEntry.images`        |
| `TimelineLocation`     | `name` (ej. "Guapi, Cauca"), `latitude`, `longitude` | `TimelineEntry.locations`     |
| `TimelineStory`        | `title`, `paragraphs` (String[])                     | `TimelineEntry.story`         |
| `TimelineQuote`        | `text`, `author`, `role?`                            | `TimelineEntry.quote`         |
| `TimelineDocumentPage` | `url`, `urlLarge?` (versión grande para el zoom)     | `TimelineDocument.pages`      |

---

## Modelo: `Event`
---
| Campo          | Tipo       | Descripción                                          |
|----------------|------------|------------------------------------------------------|
| id             | String     | Identificador único                                  |
| title          | String     | titulo del evento                                    |
| userId         | String     | ID del usuario que creó el evento                    |
| description    | String?    | Descripción del evento                               |
| imageUrl       | String?    | URL de la imagen promocional del evento              |
| startDateTime  | DateTime   | Fecha de inicio del evento                           |
| endDateTime    | DateTime   | Fecha de fin del evento                              |
| link           | String     | Enlace de inscripción (el formulario exige que empiece por `https://`) |
| location       | String     | Localización del evento                              |
| clickCount     | Int        | Clics en el botón "Inscribirme" del feed (por defecto 0); lo suma `POST /api/event/click`. El panel del profesor lo muestra como "visualizaciones" |
| createdAt      | DateTime   | Fecha de creación del evento                         |

---

## Gestión de Usuarios

La aplicación utiliza [Clerk](https://clerk.dev/) como proveedor de autenticación y gestión de usuarios. Por esta razón, no se utiliza un modelo `User` en la base de datos propia.

En su lugar, se almacena únicamente el `userId` (generado por Clerk) en los modelos que requieren asociación con un usuario:

| Modelo                    | Campo utilizado                |
|---------------------------|--------------------------------|
| `Course`                  | `userId: String`               |
| `Event`                   | `userId: String`               |
| `Registration`            | `userId: String`               |
| `Certificate`             | `userId: String`               |
| `Rating`                  | `userId: String`               |
| `UserProgress`            | `userId: String`               |
| `EvaluationResult`        | `userId: String`               |
| `EvaluationRetryGrant`    | `userId: String`               |
| `EvaluationRetryEmailLog` | `userId: String`               |
| `RetryAccessCode`         | `usedByUserId: String?`        |
| `ArticleView`             | `userId: String?` (la API guarda `null`) |

> ⚠️ Estos campos se usan solo como identificador de referencia. Cualquier información adicional del usuario (como nombre, email o rol) se gestiona directamente desde la API de Clerk y no se almacena en la base de datos.

### ¿Y el modelo `User`?

Existe un modelo `User` comentado en el esquema de Prisma como referencia futura. Si en algún momento se decide migrar la gestión de usuarios a una base de datos propia, puede activarse y sincronizar con Clerk vía webhooks o tareas programadas.

---

## Convenciones

- Todos los identificadores son de tipo `String` y corresponden a `ObjectId` de MongoDB.
- Los campos opcionales están marcados como `Tipo?`.
- Las fechas usan el tipo `DateTime` y están en formato ISO.
- Los tipos compuestos (`type` en Prisma) se guardan embebidos en el documento que los contiene.

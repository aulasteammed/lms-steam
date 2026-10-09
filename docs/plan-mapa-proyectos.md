# Plan: mapa y línea de tiempo de proyectos, participaciones y alianzas

Documento de trabajo. Reúne lo que se sabe, lo que se decidió y lo que falta por hacer.
Última actualización: 2026-10-06. Rama de trabajo: `Proyectos`.

## 1. Objetivo

La sección `/proyectos` nació como un mapa de proyectos comunitarios. Ahora debe mostrar
toda la historia del Aula STEAM Sonny Jiménez, desde su creación hasta hoy, en tres tipos
de registro:

- **Proyectos**
- **Participaciones** (eventos y congresos donde estuvo el aula)
- **Alianzas** (con instituciones u organizaciones)

El visitante los recorre en un mapa, con un selector de tipo y una línea de tiempo por años,
y cada registro tiene su propia página de detalle.

## 2. Estado actual del código

| Parte | Dónde | Cómo funciona hoy |
|---|---|---|
| Datos | `content/proyectos.json`, `content/proyectos-portada.json` | JSON editado a mano. 4 proyectos; solo "Entre Aguas" (`comuna-1`) es real, los otros 3 son de ejemplo. |
| Validación | `lib/projects.ts` | Valida el JSON con zod al compilar y exporta `PROJECTS` y `getProject`. |
| Archivos | `public/proyectos/<id>/` | Fotos y páginas del periódico en WebP (`md` y `lg`). |
| Mapa | `app/(dashboard)/(routes)/proyectos/_components/projects-map.tsx` | MapLibre con mapa base de OpenFreeMap y relieve. Marcadores HTML numerados. Columna de tarjetas a la izquierda (en celular ocupa el 60 % inferior). |
| Detalle | `app/(dashboard)/(routes)/proyectos/[id]/page.tsx` | Encabezado con texto y fotos, y lector tipo libro (`flip-book.tsx`) si hay publicación. |
| Acceso | `middleware.ts` | `/proyectos(.*)` es ruta pública. |
| Base de datos | `prisma/schema.prisma` | MongoDB con Prisma. Aún no hay modelos para esta sección. Existe un modelo `Event` (eventos próximos de `/feed`), que es otra cosa. |

## 3. Información que se va a recolectar

Se envió una guía de recolección al personal del aula. La información aún no ha llegado.
Llegará consolidada en `linea_tiempo_aula_steam.txt`, en el Drive del aula, organizada por
año (del más reciente al más antiguo) y en tres bloques por año.

Reglas generales de la guía:

- Un proyecto de varios años se ubica en su año de cierre.
- Descripciones cortas de máximo 250 caracteres.
- Archivos de máximo 3 MB.
- Campo sin dato: se escribe "Sin información".
- Las relaciones entre registros se hacen por nombre exacto.

Campos por tipo:

| Tipo | Campos |
|---|---|
| Proyecto | Nombre, periodo (`AAAA` o `AAAA-AAAA`), ubicación, descripción corta, 2 imágenes, entregable o informe (PDF o `.md`, enlace de Drive), personas clave (nombre, rol, participación, biografía y redes opcionales), instituciones involucradas, agradecimientos |
| Participación | Nombre del evento y edición, fecha (`AAAA-MM-DD`), modalidad (presencial, virtual o híbrida), ubicación, descripción corta, por qué se participó, ponente (nombre y rol), 1 imagen |
| Alianza | Año o periodo, institución, proyectos o participaciones en conjunto, ubicación, 1 imagen |

Ajustes pedidos a la guía el 2026-10-01. Julieth confirmó que los aplicó; la versión nueva
de la guía no se ha revisado en esta conversación:

- Pedir el punto exacto (barrio, vereda o enlace de Google Maps), no solo el municipio.
- Regla para participaciones virtuales, que no tienen lugar físico.
- Permitir proyectos y alianzas en curso (`AAAA-actual`).
- Unificar el formato de ubicación de las alianzas con el de los otros bloques.
- Una frase de descripción por imagen (texto alternativo).

## 4. Decisiones tomadas

- **Mantenimiento:** lo hará personal del aula, no desarrolladores. Por eso se necesita un panel.
- **Datos en base de datos** (MongoDB con Prisma), no en JSON. Las imágenes van en UploadThing, no en el repositorio.
- **Los tres tipos de registro van en una misma colección,** con un campo `type`. Las instituciones y los documentos tienen colección propia (ver sección 5).
- **Nombre de la pestaña:** "Participaciones", para no confundir con los eventos de `/feed`.
- **Selector de tipo** arriba a la derecha del mapa, con Proyectos por defecto.
- **Línea de tiempo** semitransparente en la parte inferior del mapa. En celular va como una fila delgada de años encima de las tarjetas.
- **Puntos apilados:** agrupación automática (clustering) de MapLibre. Al hacer clic en un grupo que no se puede separar, la columna de tarjetas muestra la lista. No se desplazan puntos artificialmente.
- **Orden de trabajo:** primero el diseño de las páginas de detalle con datos de prueba; después el backend.

## 5. Modelo de datos propuesto

La versión vigente está en [propuesta-base-de-datos-proyectos.md](propuesta-base-de-datos-proyectos.md)
(aprobado y aplicado el 2026-10-06 en la base de pruebas `pruebasLMS`; falta producción). Son tres
colecciones: `TimelineEntry` (proyectos, participaciones y alianzas), `TimelineInstitution`
(instituciones) y `TimelineDocument` (periódicos, revistas, informes y entregables).

Respuestas de Julieth del 2026-10-06:

- Sin `createdBy`: los registros los crea siempre el mismo usuario.
- Personas sin red social; biografía corta (quién es).
- Instituciones en colección propia, para no perder información.
- Plan de UploadThing: gratuito, 2 GB, 83,68 MB usados.
- La palabra "eventos" queda solo para `/feed`. El nombre visible "Participaciones" queda fijo.
- La lista de tipos de documento no es definitiva.
- Un solo tamaño de página por documento, de 1400 px.
- Todos los slugs siguen la misma regla y llevan el año de finalización; "Entre Aguas" pasará de `comuna-1` a `entre-aguas-2026` al migrarlo. Los registros en curso se publican sin año y lo ganan al cerrarse, con redirección desde la dirección anterior (`previousSlugs`).

## 6. Páginas de detalle (trabajo actual)

Julieth compartió un boceto de la página de un proyecto ("Casa del Río Guapi"). Bloques, de
arriba hacia abajo:

1. Barra superior: "Volver al mapa", botón "Compartir" y botón principal "Leer la revista".
2. Etiqueta (tipo y periodo), título y párrafo de entrada.
3. Imagen principal con pie de foto (autor y año).
4. Fila de datos en 4 columnas: ubicación, año, un dato destacado y aliados.
5. Sección de texto con subtítulo y varios párrafos, con un mapa pequeño al lado y el enlace "Ver en el mapa completo".
6. Galería de 3 imágenes.
7. Cita destacada de una persona del territorio, con nombre y rol.
8. Bloque de publicación asociada: título, número de páginas, "Abrir el lector" y "Descargar PDF".

Lo que el boceto pide y la guía no recolecta:

| El boceto necesita | La guía recolecta |
|---|---|
| 4 imágenes (1 principal y 3 de galería) | Exactamente 2 por proyecto |
| Texto largo con subtítulo y varios párrafos | Solo la descripción corta de 250 caracteres. El informe `.md` podría servir de fuente. |
| Cita con nombre y rol | No se pide |
| Dato destacado (por ejemplo, metros cuadrados) | No se pide |
| Pie de foto con autor y año | No se pide |

Decisiones sobre las páginas (2026-10-01):

- **Solo los proyectos tienen página propia.** Las participaciones y las alianzas viven en el mapa y, cuando están relacionadas con un proyecto, se listan al final de la página de ese proyecto (propuesto, por confirmar).
- **No se amplía la guía con campos obligatorios.** Muchos proyectos ya cerraron y no se podrá conseguir cita, equipo ni más fotos.
- **Una sola plantilla con bloques opcionales.** Cada bloque aparece solo si tiene dato. Con lo mínimo queda una ficha; con todo, un reportaje.
- **Máximo 2 imágenes por proyecto,** por el límite del plan de UploadThing. Las mismas dos se reutilizan en la página y en la tarjeta del mapa. No hay galería de 3.
- **Las publicaciones (periódicos, revistas) son lo más valioso** y deben tener un lugar especial, tanto en la página del proyecto como fuera de ella.
- **Personas:** opcional y mínimo (nombre y rol). Biografía y redes solo con autorización; confirmar con la universidad el manejo de datos personales (Ley 1581 de 2012).
- Se quita el "dato destacado" de la fila de datos.
- **Las fotos van juntas en una sola sección, pequeñas** (2026-10-02). A todo el ancho ocupaban demasiado y empujaban la información hacia abajo. Al tocarlas se abren completas. La fila de datos va justo debajo del encabezado.

Bloques de la plantilla:

| Bloque | Regla |
|---|---|
| Título, periodo, descripción corta | Obligatorio |
| Publicación | Si existe, va en el encabezado, con la portada grande |
| Fila de datos | De 2 a 4 columnas: ubicación y periodo siempre; instituciones y coordinador si existen |
| Texto largo con mapa pequeño | Opcional. Sin texto, las fotos ocupan su lugar junto al mapa pequeño |
| Fotos (1 o 2) | Una sola sección, lado a lado y pequeñas; pie de foto opcional |
| Cita | Opcional |
| Entregable sin lector | Botón "Ver el informe" hacia el PDF en Drive |

Prueba visual construida el 2026-10-01, con datos de prueba en `content/proyectos.json`
(sin commit; pendiente de revisión de Julieth):

| Pantalla | Ruta | Archivo |
|---|---|---|
| Página del proyecto | `/proyectos/<id>` | `proyectos/[id]/page.tsx` |
| Lector con dirección propia | `/proyectos/<id>/lector` | `proyectos/[id]/lector/page.tsx` |
| Estantería de publicaciones | `/proyectos/publicaciones` | `proyectos/publicaciones/page.tsx` |

- Los cuatro proyectos de prueba cubren los casos: `comuna-1` completo con periódico, `proyecto-2` mínimo, `proyecto-3` intermedio (instituciones, coordinación, informe, alianza) y `proyecto-4` mínimo con revista. La revista de `proyecto-4` reutiliza las páginas de "Entre Aguas".
- Lo que no se conoce del proyecto real va entre corchetes, como en el boceto.
- El lector ya no va incrustado en la página del proyecto; así esa página no carga la librería de pasar páginas.
- El lector abre directo a ventana completa, sin vista intermedia y sin el menú del sitio (2026-10-02). Al salir vuelve a la página del proyecto.
- En la página del proyecto hay un solo botón de lectura, dentro de la tarjeta de la publicación. La portada también lleva al lector.
- En el mapa: botón "Publicaciones", etiqueta "Con periódico" en la tarjeta y punto azul en el marcador.
- El mapa pequeño usa 4 teselas de OpenStreetMap como imágenes. Es provisional: su política de uso es para tráfico bajo.

Cambios del 2026-10-02 sobre documentos:

- **Cada proyecto tiene una lista de documentos** (`documentos` en el JSON): periódico, revista, informe u otro entregable. Reemplaza a `publicacion` y al enlace de Drive del informe.
- **Los informes se leen en el mismo visor,** sin pedir acceso a ninguna cuenta. El visor toma la proporción de la hoja de la primera página (tabloide, carta…).
- **Todo documento se puede descargar en PDF,** desde la página del proyecto, la estantería y el visor. El PDF es obligatorio en los datos.
- La dirección del visor pasa a `/proyectos/<id>/lector/<documento>`.
- El primer documento que no sea informe es la publicación destacada del encabezado; los demás van en "Informes y documentos". La estantería los separa en "Periódicos y revistas" e "Informes y entregables".
- **Botón de volver unificado** (`_components/back-link.tsx`): siempre "Volver a <lugar>". El visor vuelve al proyecto o a la estantería, según desde dónde se abrió.
- Archivos de prueba: `public/proyectos/comuna-1/periodico.pdf` es provisional, armado con las páginas (6,3 MB); hay que reemplazarlo por el original. `public/proyectos/proyecto-3/informe*` es un informe de ejemplo de 6 páginas.

- Los botones "Leer" y "Descargar" van siempre juntos, lado a lado y con el mismo texto (`_components/document-actions.tsx`).

Conversión del PDF al visor (pendiente, va con el panel del paso 4):

- Regla de Julieth: de cada entregable se sube **solo el PDF** y el sistema debe convertirlo para el visor.
- **Hoy no es automático.** La conversión se hace a mano con `scripts/pdf-a-paginas.py` (requiere Python) y editando `content/proyectos.json`.
- Propuesta: convertir en el navegador al subir, con pdf.js. El panel dibuja cada página, la guarda como WebP y sube las páginas junto con el PDF. No necesita servidor de conversión, así que funciona en Vercel.
- Alternativa descartada por ahora: que el visor dibuje el PDF directamente al leer. Ahorra almacenamiento, pero el visitante tendría que descargar el PDF completo antes de ver la primera página.
- Por decidir: guardar un solo tamaño de página en vez de dos, para gastar menos almacenamiento.

Consecuencias para la guía y el backend:

- La guía pide el informe como enlace de Drive o como `.md`. Ahora se necesita el **PDF**. Un informe en `.md` habría que convertirlo a PDF.
- El almacenamiento crece: cada documento guarda su PDF más las páginas en dos tamaños.

Problema anterior a este trabajo, sin resolver: error de hidratación en `NavbarRoutes`
(barra de navegación), visible en todas las páginas del panel, incluida `/about`.

Pendiente de definir:

- Dónde se guardan las páginas de las publicaciones. "Entre Aguas" (24 páginas) pesa 11,4 MB en dos tamaños, lo mismo que unas 80 fotos; hoy está en `public/`, dentro del repositorio.
- Cómo convierte el personal del aula un PDF en páginas. Hoy se hace con `scripts/pdf-a-paginas.py`, que requiere Python.

Las pruebas visuales se hacen con datos de prueba, antes de tocar la base de datos.

## 7. Rendimiento

En orden de impacto:

1. **Imágenes:** comprimir al subir, a WebP en dos tamaños. El original de 3 MB nunca llega al visitante. Carga diferida.
2. **Lista liviana y detalle aparte:** el mapa recibe solo título, año, tipo, coordenadas y miniatura.
3. **Caché en el servidor:** la consulta se guarda y se invalida cuando alguien guarda en el panel.
4. **Cambio de tipo sin recargar:** se cargan los tres tipos y el selector filtra en memoria.
5. **Tarjetas solo de lo visible:** las del año y tipo seleccionados.
6. **`useMemo` y `React.memo`:** para la fluidez de la interacción; no aceleran la carga.

Los puntos del mapa pasan de marcadores HTML a una capa GeoJSON con agrupación. Se pierde
el número de orden de cada marcador.

Por confirmar: el límite de optimización de imágenes del plan de Vercel.

## 8. Orden de trabajo

| # | Paso | Estado |
|---|---|---|
| 0 | Diseño de las páginas de detalle por tipo, con datos de prueba | Hecho |
| 1 | Esquema en la base de datos y capa de datos con caché. Migrar los proyectos del JSON. | Esquema e índices aplicados en pruebas. Falta la capa de datos con caché y la migración. |
| 2 | Mapa con agrupación, selector de tipo y línea de tiempo | Construido el 2026-10-08 con datos de prueba (`lib/timeline-sample.ts`). Falta la revisión visual de Julieth. |
| 3 | Importador del `.txt`, con reporte de errores | Pendiente, depende de que llegue la información |
| 4 | Panel de profesor para crear y editar, con compresión de imágenes | Pendiente |
| 5 | Agregar los registros al sitemap | Pendiente |

## 9. Fuera del alcance por ahora

- Logo de las instituciones.
- Líneas en el mapa que conecten alianzas con sus proyectos.
- Tarjetas automáticas para compartir en redes por cada registro.

## 10. Pendientes de SEO (trabajo anterior, rama `3.0`)

Hecho: metadatos, isotipo adaptativo, `robots.txt`, `sitemap.xml`, verificación en Google
Search Console y sitemap enviado (15 páginas descubiertas).

Pendiente:

- **Google no puede leer las páginas.** Producción usa claves de desarrollo de Clerk, y Googlebot recibe una redirección 307 en todas las páginas. `robots.txt` y `sitemap.xml` sí responden.
  - Solución definitiva: dominio propio (idealmente un subdominio de la UNAL) y Clerk en producción. Clerk no admite `*.vercel.app` en producción.
  - Solución temporal ofrecida y no aplicada: que el middleware no aplique el handshake a los buscadores.
- Imagen para compartir en redes (1200 × 630).
- La rama `Proyectos` tiene el merge de `3.0` sin subir a GitHub.

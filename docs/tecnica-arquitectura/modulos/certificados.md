# Módulo: Certificados (constancias)

## 1. Propósito

El estudiante que completa un curso descarga su constancia en PDF, y cualquiera puede verificarla en una dirección pública. El profesor consulta y descarga las constancias por curso y año. En la interfaz se llaman **constancias**; en el código, `Certificate`.

## 2. Rutas

| Ruta | Quién | Qué hace |
|------|-------|----------|
| `/courses/<courseId>/certificates/certificate` | Estudiante | Ver y descargar su constancia |
| `/certificate/verify/<courseId>/<token>` | Público | Verificar una constancia |
| `/teacher/certificates` | Profesor | Consultar y descargar constancias |

## 3. Obtener la constancia

1. Cada módulo se marca como completado al aprobar su evaluación o con el botón "Marcar como completo".
2. El avance del curso es módulos completados / módulos publicados × 100 (`actions/get-progress-batch.ts`).
3. Con 100 % aparece "Constancia" en el menú del curso.
4. Al abrirla por primera vez se crea el `Certificate`, con un token `<courseId>-<UUID>` en `certificateUrl`.

## 4. PDF

Se genera en el navegador: `course-certificate-template.tsx` dibuja la constancia (logo, nombre, curso, nivel, fecha y firma), `html2canvas` la convierte en imagen y `jsPDF` arma el PDF. No se guarda ningún archivo. Los botones son **Descargar constancia** y **Compartir constancia** (abre la verificación). El logo y la firma son imágenes de `public/`.

## 5. Verificación

`/certificate/verify/<courseId>/<token>` es pública y no se indexa en buscadores. Busca la constancia por token y curso, consulta el nombre del estudiante en Clerk y su progreso, y muestra "Constancia verificada" con botones para copiar y compartir el enlace.

## 6. Panel del profesor

`/teacher/certificates` lista los cursos publicados con su número de constancias. Por curso muestra un gráfico por año y la lista de estudiantes, con descarga individual en PDF, enlace de verificación y descarga de todas las del año en un ZIP. Los datos salen de `actions/get-certificates-facets.ts`.

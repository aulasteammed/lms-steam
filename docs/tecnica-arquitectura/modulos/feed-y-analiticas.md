# Módulo: Feed de eventos y analíticas

## 1. Feed de eventos

`/feed` es la agenda del Aula STEAM. Modelo: `Event`.

| Ruta | Qué hace |
|------|----------|
| `/feed` | Próximos eventos y calendario |
| `/teacher/feed` | Eventos con su número de clics; eliminar |
| `/teacher/feed/create` | Crear un evento con vista previa |

- El feed carga los eventos desde `GET /api/event` (los que empiezan desde hace 30 días). Muestra los próximos; al elegir un día en el calendario muestra los de ese día.
- Cada evento tiene título, descripción, lugar, fecha y hora, imagen y enlace de inscripción (`https://`). Los ya empezados se ven como "Finalizado".
- Al crear, la fecha de inicio no puede estar en el pasado y debe ser anterior a la de fin. Los eventos no se editan: se eliminan y se crean de nuevo.
- El botón "Inscribirme" abre el enlace y suma un clic con `POST /api/event/click` (`Event.clickCount`). El panel lo muestra como "visualizaciones".

## 2. Analíticas

`/teacher/analytics` muestra cuatro secciones con datos de `actions/get-analytics.ts`:

| Sección | Origen |
|---------|--------|
| Inscripciones en los cursos | `Registration` de los cursos del profesor, por curso |
| Cursos por nivel | `Course` del profesor, por `level` |
| Inscripciones por nivel | Las inscripciones anteriores, por nivel del curso |
| Inscripciones en los últimos 6 meses | `Registration` con `userId` del profesor, por mes |

Los niveles graficados son Principiante, Intermedio y Avanzado. Otros indicadores están en sus módulos: vistas en `/teacher/blog`, clics en `/teacher/feed` y constancias en `/teacher/certificates`.

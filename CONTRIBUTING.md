# Cómo contribuir

## 1. Ramas

| Rama | Uso |
|------|-----|
| `3.0` | Versión actual y rama por defecto del repositorio `aulasteammed/lms-steam` |
| `1.0`, `2.0` | Versiones anteriores |
| `blog`, `Proyectos`, `certificados`… | Una rama por módulo o funcionalidad |

Flujo:

1. Crear la rama de trabajo desde `3.0`.
2. Antes de integrar, traer los últimos cambios de `3.0` a la rama (`git merge 3.0`) y resolver conflictos.
3. Integrar en `3.0` con un pull request o un merge.

## 2. Mensajes de commit

Formato: `tipo: descripción breve`, con el tipo en minúsculas y la descripción en español.

| Tipo | Uso | Ejemplo del historial |
|------|-----|-----------------------|
| `feat` | Funcionalidad nueva | `feat: compartir en blog y trayectorias` |
| `fix` | Corrección | `fix: robots and sitemap` |
| `perf` | Rendimiento | `perf: Uploadthing detede previous file` |
| `refactor` | Cambio de código sin cambiar el comportamiento | `refactor: change from chapter to module` |
| `style` | Cambios visuales o de formato | `style: new visual styles` |
| `docs` | Documentación | `docs: updated readme and .env.example` |
| `update` | Actualización de contenido o configuración | `update: Trayectorias` |

## 3. Correr el proyecto

~~~bash
npm install
cp .env.example .env   # completar las variables
npm run dev
~~~

Antes de integrar:

~~~bash
npm run lint
npm run build
~~~

Detalle en [instalación y despliegue](docs/tecnica-arquitectura/instalacion-despliegue.md) y [variables de entorno](docs/tecnica-arquitectura/variables-entorno.md).

## 4. Documentar los cambios

| Si el cambio afecta… | Actualizar |
|----------------------|------------|
| `prisma/schema.prisma` | [`prisma/documentation.md`](prisma/documentation.md) y [modelo de datos](docs/tecnica-arquitectura/modelo-datos.md) |
| Una ruta de `app/api` | [api.md](docs/tecnica-arquitectura/api.md) |
| Un módulo (blog, Trayectoria, evaluaciones, constancias, feed) | Su documento en [`docs/tecnica-arquitectura/modulos/`](docs/tecnica-arquitectura/modulos/) |
| Lo que ve el estudiante o el visitante | [Manual de usuario](docs/usuario/manual-usuario.md) |
| El panel del profesor | [Manual del docente](docs/usuario/manual-docente.md) |
| Una variable de entorno | [`.env.example`](.env.example) y [variables de entorno](docs/tecnica-arquitectura/variables-entorno.md) |
| Rutas públicas o permisos | [Roles y permisos](docs/tecnica-arquitectura/roles-y-permisos.md) |

Además:

- Agregar el cambio en [CHANGELOG.md](CHANGELOG.md), en la sección del mes.
- Si el cambio agrega un flujo nuevo, sumarlo a la checklist de [mantenimiento](docs/tecnica-arquitectura/mantenimiento.md#10-flujos-críticos-para-validar).
- La documentación describe lo que existe, en español y con las rutas de los archivos en lugar de bloques de código largos. Los diagramas van en Mermaid.

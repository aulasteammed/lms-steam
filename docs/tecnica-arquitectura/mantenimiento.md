# Mantenimiento del Sistema

## 1. Objetivo

Este documento reúne las recomendaciones, cuidados y necesidades del LMS STEAM para realizar mantenimiento preventivo, correctivo y evolutivo sin comprometer la disponibilidad, la integridad de los datos ni la seguridad de la plataforma.

## 2. Alcance

Aplica a tareas de mantenimiento sobre:

- aplicación Next.js,
- rutas API y acciones del servidor,
- base de datos MongoDB gestionada con Prisma,
- autenticación con Clerk,
- carga de archivos con UploadThing,
- envío de correos con Resend,
- dependencias npm,
- configuración de variables de entorno,
- infraestructura de despliegue.

## 3. Tipos de mantenimiento

## 3.1 Mantenimiento preventivo

Actividades periódicas para reducir incidentes:

- revisar logs de aplicación y errores del proveedor de despliegue,
- validar uso de base de datos y crecimiento de colecciones,
- verificar estado de integraciones externas,
- actualizar dependencias con control de cambios,
- ejecutar validaciones antes de cada despliegue,
- confirmar que las variables de entorno siguen vigentes.

## 3.2 Mantenimiento correctivo

Actividades para resolver fallas:

- reproducir el problema en entorno controlado,
- identificar si el error está en frontend, API, base de datos o servicio externo,
- revisar logs y trazas del momento del incidente,
- aplicar el cambio mínimo necesario,
- validar el flujo afectado antes de publicar,
- documentar causa raíz y solución aplicada.

## 3.3 Mantenimiento evolutivo

Actividades para ampliar o mejorar el sistema:

- analizar impacto en rutas, componentes, base de datos y permisos,
- crear o modificar modelos Prisma cuando sea necesario,
- actualizar documentación técnica y manual de usuario si cambia el flujo,
- validar compatibilidad con datos existentes,
- probar flujos de estudiante y administrador/docente.

## 4. Recomendaciones antes de cualquier mantenimiento

- Crear respaldo reciente de la base de datos o trabajar en rama alterna a la principal.
- Ejecutar cambios en entornos de prueba y no sobre producción.
- Verificar que se trabaja sobre la rama correcta.
- Revisar cambios pendientes en el repositorio antes de editar.
- Confirmar variables de entorno necesarias para el entorno objetivo.
- Ejecutar `npm install` si hubo cambios en dependencias.
- Ejecutar `npx prisma generate` si cambió el esquema de Prisma.
- Ejecutar `npm run lint` y `npm run build` antes de desplegar.
- Validar manualmente los flujos críticos después del cambio.

## 5. Cuidados con la base de datos

La base de datos usa MongoDB con Prisma. Se recomienda:

- No modificar datos de producción directamente sin respaldo.
- Evitar eliminar colecciones o campos sin validar dependencias en el código.
- Mantener consistencia entre `prisma/schema.prisma` y las consultas de la aplicación.
- Revisar índices cuando crezcan las colecciones de cursos, módulos, progreso o evaluaciones.
- Tener especial cuidado con campos `userId`, porque dependen de identidades externas de Clerk.
- Probar scripts de datos en un entorno de pruebas antes de ejecutarlos en producción.

## 6. Cuidados con autenticación y permisos

El sistema depende de Clerk para autenticación. Se recomienda:

- Rotar secretos de Clerk según políticas del aula.
- No exponer `CLERK_SECRET_KEY` en frontend ni documentación pública.
- Validar que rutas protegidas sigan exigiendo sesión activa.
- Revisar el valor de `NEXT_PUBLIC_TEACHER_ID` cuando cambie el usuario administrador/docente (Este se puede encontrar en el dashboard de clerk iniciando sesion con la cuenta del Aula STEAM).
- Probar inicio de sesión, registro y cierre de sesión después de cambios en middleware o layouts.

## 7. Cuidados con archivos y contenido multimedia

UploadThing se usa para carga de archivos. Se recomienda:

- Verificar límites de tamaño y tipo de archivo permitidos.
- Revisar periódicamente archivos obsoletos o no referenciados.
- Confirmar que `UPLOADTHING_SECRET` esté vigente.
- Validar carga y visualización de imágenes, videos o adjuntos después de cambios en cursos y módulos.

## 8. Cuidados con evaluaciones y certificados

Los flujos de evaluación tienen impacto directo en el progreso del usuario. Se recomienda ante cambios en este apartado:

- Probar creación, publicación y consulta de evaluaciones.
- Validar preguntas de selección única, selección múltiple, secuencia, localización y abiertas cuando aplique.
- Revisar reglas de intentos máximos y reintentos.
- Confirmar que los resultados se registren correctamente en `EvaluationResult`.
- Verificar generación y consulta de certificados después de cambios en progreso o evaluaciones.

## 9. Dependencias y actualizaciones

Antes de actualizar dependencias:

- Revisar cambios mayores de Next.js, Prisma, Clerk, UploadThing y React.
- Actualizar primero en entorno local o staging.
- Ejecutar `npm run lint`.
- Ejecutar `npm run build`.
- Probar autenticación, cursos, evaluaciones, certificados y carga de archivos.
- Revisar si `package-lock.json` cambió de forma esperada.

## 10. Flujos críticos para validar

Después de cada mantenimiento, validar como mínimo:

- inicio de sesión y registro,
- navegación del dashboard,
- búsqueda de cursos,
- inscripción a un curso,
- visualización de módulos,
- actualización de progreso,
- carga de archivos,
- visualización de certificados,
- acceso a rutas administrativas/docente.

## 12. Monitoreo recomendado

Se recomienda monitorear:

- errores de build y despliegue,
- errores 4xx y 5xx en rutas API,
- tiempo de respuesta de páginas principales,
- fallos de autenticación,
- fallos de carga de archivos,
- errores de conexión con MongoDB,
- errores de envío de correos,
- crecimiento de almacenamiento y número de documentos en colecciones principales.

## 13. Plan de reversión

Todo mantenimiento debe tener una ruta de retorno:

- identificar el último commit o despliegue estable,
- conservar respaldo de base de datos previo al cambio,
- documentar comandos o pasos para restaurar,
- revertir primero la aplicación si la falla está en código,
- restaurar base de datos solo si hubo afectación de datos,
- validar nuevamente flujos críticos después de revertir.

## 14. Registro de mantenimiento

Se recomienda mantener una bitácora con:

- fecha y hora,
- responsable,
- tipo de mantenimiento,
- descripción del cambio,
- archivos o módulos afectados,
- validaciones realizadas,
- incidentes encontrados,
- acciones posteriores requeridas.

## 15. Necesidades operativas del sistema

Para operar correctamente, el sistema necesita:

- proveedor de despliegue disponible,
- MongoDB accesible desde la aplicación,
- credenciales válidas de Clerk,
- credenciales válidas de UploadThing,
- variables de entorno completas,
- versión compatible de Node.js,
- dependencias instaladas y sincronizadas con `package-lock.json`,
- cliente Prisma generado,
- monitoreo básico de errores y disponibilidad.


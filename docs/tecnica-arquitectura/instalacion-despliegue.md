# Guía de Instalación y Despliegue

## 1. Requisitos

- Node.js 20+
- npm 10+
- Base de datos MongoDB accesible
- Cuenta y credenciales de Clerk
- Cuenta y credenciales de UploadThing
- Cuenta y credenciales de Resend

## 2. Instalación en entorno de desarrollo

1. Clonar repositorio:

```bash
git clone <url-del-repositorio>
cd lms-steam
```

2. Instalar dependencias:

```bash
npm install
```

3. Crear archivo `.env` basado en `.env.example` y completar las variables descritas en [variables de entorno](variables-entorno.md).

4. Generar cliente Prisma (si no se genera automáticamente):

```bash
npx prisma generate
```

5. Si la base de datos es nueva, crear índices y categorías:

```bash
npx prisma db push
npm run db:seed
```

6. Ejecutar en local:

```bash
npm run dev
```

## 3. Scripts útiles

- `npm run dev`: entorno local.
- `npm run build`: compilación de producción.
- `npm run start`: ejecución en modo producción.
- `npm run lint`: validación de código.

### 3.1 Scripts de datos

Se ejecutan con `tsx` contra la base de `DATABASE_URL`.

| Script | Qué hace | Cuándo correrlo |
|--------|----------|-----------------|
| `npm run db:seed` (`scripts/seed.ts`) | Crea las 49 categorías de cursos definidas en el script. Las que ya existen no se modifican | Al preparar una base nueva y cuando se agreguen categorías al script. Se puede repetir |
| `npm run db:migrate-course-categories` (`scripts/migrate-course-categories.ts`) | Copia el campo `categoryId` de los cursos que lo tengan a la tabla `CourseCategory` | Una sola vez, en bases con cursos que tengan `categoryId`. En una base nueva no hace cambios. Se puede repetir sin duplicar |

`db:seed` usa una transacción de Prisma, que requiere un clúster de MongoDB con transacciones (réplica, como MongoDB Atlas).

## 4. Despliegue a producción (referencia)

## 4.1 Preparación

1. Configurar variables de entorno en el proveedor de despliegue.
2. Verificar conectividad a MongoDB.
3. Validar credenciales de Clerk y UploadThing.

## 4.2 Build y ejecución

```bash
npm ci
npm run build
npm run start
```

## 4.3 Checklist post-despliegue

- Inicio de sesión y registro.
- Navegación de catálogo de cursos.
- Inscripción y avance por módulos.
- Publicación/consulta de evaluaciones.
- Generación/consulta de certificados.
- Carga de archivos en UploadThing.

## 5. Consideraciones operativas

- Mantener `DATABASE_URL` y secretos fuera del repositorio.
- Versionar cambios de esquema Prisma de forma controlada.
- Ejecutar `npm run lint` y pruebas funcionales antes de desplegar.

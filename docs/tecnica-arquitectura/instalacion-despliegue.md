# Guía de Instalación y Despliegue

## 1. Requisitos

- Node.js 20+
- npm 10+
- Base de datos MongoDB accesible
- Cuenta y credenciales de Clerk
- Cuenta y credenciales de UploadThing

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

3. Crear archivo `.env` basado en `.env.example` y completar variables:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
DATABASE_URL=
UPLOADTHING_SECRET=
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_TEACHER_ID=
```

4. Generar cliente Prisma (si no se genera automáticamente):

```bash
npx prisma generate
```

5. Ejecutar en local:

```bash
npm run dev
```

## 3. Scripts útiles

- `npm run dev`: entorno local.
- `npm run build`: compilación de producción.
- `npm run start`: ejecución en modo producción.
- `npm run lint`: validación de código.
- `npm run db:seed`: carga de datos semilla.
- `npm run db:migrate-course-categories`: script de migración de categorías.

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

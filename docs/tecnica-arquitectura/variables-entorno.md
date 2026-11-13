# Variables de entorno

Se definen en un archivo `.env` en la raíz, a partir de `.env.example`. Los archivos `.env` y `.env_*` están en `.gitignore`. En el servidor desplegado se configuran en el panel del proveedor de hosting.

Las variables con prefijo `NEXT_PUBLIC_` se incluyen en el código del navegador; las demás solo existen en el servidor. Los ejemplos son ficticios.

| Variable | Para qué sirve | Tipo | Dónde se obtiene | Ejemplo |
|----------|----------------|------|------------------|---------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clave pública de Clerk | Pública | Clerk → API Keys | `pk_test_abc123` |
| `CLERK_SECRET_KEY` | Clave secreta de Clerk (servidor, verificación de constancias) | Secreta | Clerk → API Keys | `sk_test_abc123` |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | Ruta de inicio de sesión | Pública | Valor fijo | `/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Ruta de registro | Pública | Valor fijo | `/sign-up` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | Destino después de iniciar sesión | Pública | Valor fijo | `/` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | Destino después de registrarse | Pública | Valor fijo | `/` |
| `DATABASE_URL` | Conexión a MongoDB para Prisma | Secreta | MongoDB Atlas → Connect → Drivers | `mongodb+srv://usuario:clave@cluster0.ejemplo.mongodb.net/aula` |
| `UPLOADTHING_TOKEN` | Subida y borrado de archivos en UploadThing | Secreta | UploadThing → API Keys | `eyJhcGlLZXkiOi...` |
| `NEXT_PUBLIC_APP_URL` | URL base de la aplicación | Pública | Valor fijo | `http://localhost:3000` |
| `NEXT_PUBLIC_TEACHER_ID` | `userId` de Clerk del profesor (ver [roles y permisos](roles-y-permisos.md)) | Pública | Clerk → Users → ID del usuario | `user_2abcDEF123` |
| `RESEND_API_KEY` | Envío de correos con Resend | Secreta | Resend → API Keys | `re_abc123` |
| `RESEND_FROM_EMAIL` | Remitente de los correos | Servidor | Resend → Domains | `"Aula STEAM <notificaciones@ejemplo.edu.co>"` |

## Clerk: desarrollo y producción

Las claves `pk_test_` / `sk_test_` corresponden a una instancia de desarrollo de Clerk. Las claves `pk_live_` / `sk_live_` corresponden a una instancia de producción, que se configura con un dominio propio.

## Resend: remitente en producción

`.env.example` usa el dominio de pruebas de Resend (`@resend.dev`). Con ese dominio, Resend solo entrega correos a la dirección de la cuenta de Resend.

Para que los estudiantes reciban el correo de intentos agotados:

1. En Resend → **Domains**, agregar el dominio desde el que se enviará.
2. Crear en el DNS del dominio los registros que indica Resend y esperar a que aparezca como verificado.
3. Cambiar `RESEND_FROM_EMAIL` a una dirección de ese dominio, con el formato `"Nombre <correo@dominio>"`.
4. Redesplegar la aplicación.

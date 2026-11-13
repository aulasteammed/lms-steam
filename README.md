# 🎓 Aplicativo Web del Aula STEAM - UNAL Medellín

Plataforma web del Aula STEAM Sonny Jiménez de la Facultad de Minas, Universidad Nacional de Colombia - Sede Medellín. Reúne cursos con evaluaciones y constancias, la agenda de eventos, un blog y la Trayectoria del aula (mapa de proyectos, participaciones y alianzas).

## 🚀 Características

✔️ **Cursos** con módulos, video, anexos, categorías y progreso por estudiante  
✔️ **Evaluaciones** de selección única, múltiple, respuesta abierta y secuencia, con intentos limitados y código de reintento  
✔️ **Constancias** en PDF con verificación pública  
✔️ **Agendate**: agenda de eventos con calendario e inscripción externa  
✔️ **Blog** con editor por bloques, plantillas y conteo de vistas  
✔️ **Trayectoria**: mapa interactivo, línea de tiempo, páginas de proyectos y lector de publicaciones  
✔️ **Panel del profesor** para administrar todo el contenido, con analíticas de inscripciones  
✔️ Autenticación con **Clerk**, diseño adaptable a celulares y despliegue en **Vercel**

## 🛠️ Tecnologías

- **Next.js 15** (App Router), React, TypeScript
- **Tailwind CSS** y **shadcn/ui**
- **MongoDB** con **Prisma ORM**
- **Clerk** (autenticación), **UploadThing** (archivos), **Resend** (correo)
- **MapLibre GL** (mapa), **pdfjs-dist**, **html2canvas** y **jsPDF** (documentos)

Detalle en [arquitectura del sistema](docs/tecnica-arquitectura/arquitectura-sistema.md).

## ⚙️ Instalación rápida

~~~bash
git clone https://github.com/aulasteammed/lms-steam.git
cd lms-steam
npm install
cp .env.example .env   # completar las variables
npm run dev
~~~

La aplicación queda en `http://localhost:3000`. Variables en [variables de entorno](docs/tecnica-arquitectura/variables-entorno.md); pasos completos y despliegue en [instalación y despliegue](docs/tecnica-arquitectura/instalacion-despliegue.md).

## 🎯 Cómo usar la aplicación

| Quién | Qué puede hacer | Guía |
|-------|-----------------|------|
| Visitante | Ver inicio, cursos, Agendate, blog y Trayectoria; verificar constancias | [Manual de usuario](docs/usuario/manual-usuario.md) |
| Estudiante | Inscribirse, avanzar por módulos, presentar evaluaciones y descargar constancias | [Manual de usuario](docs/usuario/manual-usuario.md) |
| Profesor | Administrar cursos, evaluaciones, reintentos, constancias, eventos, blog y Trayectoria | [Manual del docente](docs/usuario/manual-docente.md) |

## 📚 Estructura de carpetas

~~~plaintext
lms-steam/
├── actions/          # Consultas de servidor y acciones de Trayectoria
├── app/
│   ├── (auth)/       # Inicio de sesión y registro
│   ├── (course)/     # Vista del estudiante dentro de un curso
│   ├── (dashboard)/  # Inicio, cursos, Agendate, blog, Trayectoria y panel /teacher
│   ├── (public)/     # Verificación pública de constancias
│   └── api/          # Rutas de la API
├── components/       # Componentes compartidos y shadcn/ui
├── content/          # Texto de la portada del mapa de Trayectoria
├── docs/             # Documentación técnica y manuales
├── hooks/            # Hooks de React
├── lib/              # Utilidades, Prisma, evaluaciones, correo, blog, Trayectoria
├── prisma/           # Esquema y documentación de la base de datos
├── public/           # Imágenes y archivos estáticos
├── scripts/          # Scripts de datos
└── types/            # Tipos adicionales
~~~

Descripción de cada carpeta en [arquitectura del sistema](docs/tecnica-arquitectura/arquitectura-sistema.md#5-organización-del-código).

## 📖 Documentación

Índice completo en [docs/README.md](docs/README.md). Para contribuir, ver [CONTRIBUTING.md](CONTRIBUTING.md); historial de cambios en [CHANGELOG.md](CHANGELOG.md).

## 👥 Autores

- Juan D. Villa ( https://github.com/danielvillam ) - _Desarrollador_
- Nicolás Ruiz (https://github.com/Nicorb72) - _Desarrollador_
- Julieth A. Bautista (https://github.com/JulbautistaT) - _Desarrolladora_

## 📄 Licencia

Este proyecto está bajo la [Licencia MIT](LICENSE).

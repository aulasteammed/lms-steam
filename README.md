# 🎓 Aplicativo Web para la Gestión del Aula STEAM - UNAL Medellín

Este aplicativo web fue desarrollado para optimizar la gestión de capacitaciones y recursos del Aula STEAM de la Facultad de Minas en la Universidad Nacional de Colombia - Sede Medellín. La plataforma facilita el acceso a tutoriales, el registro de eventos, la reserva de materiales y la certificación de competencias en el uso de equipos.

## 🚀 Características

✔️ **Interfaz intuitiva y moderna** basada en **ShadCN UI** y **Tailwind CSS**  
✔️ **Sistema de autenticación** con roles de usuario usando Clerk  
✔️ **Registro de eventos y capacitaciones**  
✔️ **Módulo de aprendizaje** con acceso a tutoriales y recursos  
✔️ **Sistema de certificación** para competencias en el aula STEAM  
✔️ **Gestión de materiales y reservas** para el uso de equipos  
✔️ **Accesibilidad optimizada** para dispositivos móviles  
✔️ **Despliegue en Vercel** para acceso desde cualquier lugar

## 🛠️ Tecnologías utilizadas

### **Frontend**
- Next.js
- TypeScript
- Tailwind CSS
- ShadCN UI
- Clerk (para autenticación)
- UploadThing (para gestión de archivos)

### **Backend**
- Node.js
- Express
- MongoDB con Prisma ORM
- JWT para autenticación
- UploadThing para gestión de archivos multimedia

---

## ⚙️ Instalación y Configuración

### 🔹 Clonar el repositorio

~~~bash
git clone https://github.com/danielvillam/lms-steam.git
~~~

### 🔹 Configuración del Repositorio (Backend y Frontend)

1. **Instalar dependencias**
~~~bash
npm install
~~~

2. **Configurar variables de entorno**  
   Crea un archivo `.env` en la carpeta raíz `/` con el siguiente contenido:

~~~env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/

DATABASE_URL="your_mongo_database_url"

UPLOADTHING_SECRET=your_uploadthing_secret

NEXT_PUBLIC_APP_URL=http://localhost:3000

NEXT_PUBLIC_TEACHER_ID=your_teacher_id
~~~

3. **Ejecutar el servidor**
~~~bash
npm run dev
~~~

---

## 📚 Estructura de Carpetas del Proyecto

~~~plaintext
lms-steam/
├── actions/                # Acciones específicas del proyecto
│   ├── get-all-courses.tsx  
│   ├── get-module.ts      
│   ├── get-dashboard-courses.ts
│   ├── get-courses.ts  
│   ├── get-analytics.ts    
│   ├── get-courses.ts      
│   └── get-progress-batch.ts     
├── app/                    # Carpeta principal de la aplicación
│   ├── (auth)/             # Rutas relacionadas con la autenticación
│   │   ├── (routes)/
│   │   │   ├── sign-in/
│   │   │   │   └── [[...sign-in]]/
│   │   │   │       └── page.tsx
│   │   │   ├── sign-up/
│   │   │   │   └── [[...sign-up]]/
│   │   │   │       └── page.tsx
│   │   └── layout.tsx  
│   ├── (course)/           # Rutas relacionadas con los cursos
│   │   ├── courses/
│   │   │   ├── [courseId]/
│   │   │   │   ├── _components/
│   │   │   │   │   ├── course-mobile-sidebar.tsx
│   │   │   │   │   ├── course-navbar.tsx
│   │   │   │   │   ├── course-sidebar.tsx
│   │   │   │   │   └── course-sidebar-item.tsx
│   │   │   │   ├── modules/
│   │   │   │   │   ├── [moduleId]/
│   │   │   │   │   │   ├── _components/
│   │   │   │   │   │   │   ├── course-enroll-button.tsx
│   │   │   │   │   │   │   ├── course-progress-button.tsx
│   │   │   │   │   │   │   ├── video-player.tsx
│   │   │   │   │   │   │   └── video-player-youtube.tsx
│   │   │   │   │   │   └── page.tsx
│   │   │   │   ├── layout.tsx
│   │   │   │   └── page.tsx
│   ├── (dashboard)/        # Rutas del dashboard
│   │   ├── (routes)/
│   │   │   ├── (root)/
│   │   │   │   ├── _components/
│   │   │   │   │   └── carousel.tsx
│   │   │   │   └── page.tsx
│   │   │   ├── about/
│   │   │   │   └── page.tsx
|   |   |   ├── feed/
│   │   │   │   ├── _components/
│   │   │   │   │   └── custom-calendar.tsx
│   │   │   │   │   └── event-card.tsx
│   │   │   │   └── page.tsx
│   │   │   ├── mycourses/
│   │   │   │   ├── _components/
│   │   │   │   │   └── info-card.tsx
│   │   │   │   └── page.tsx
│   │   │   ├── search/
│   │   │   │   ├── _components/
│   │   │   │   │   ├── categories.tsx
│   │   │   │   │   └── category-item.tsx
│   │   │   │   └── page.tsx
│   │   │   ├── feed/
|   │   │   │   ├── create/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── page.tsx
│   │   │   ├── teacher/
│   │   │   │   ├── analytics/
│   │   │   │   │   ├── _components/
│   │   │   │   │   │   ├── chart-courses-level.tsx
│   │   │   │   │   │   ├── chart-registrations.tsx
│   │   │   │   │   │   ├── chart-registrations-bymonth.tsx
│   │   │   │   │   │   ├── chart-registrations-level.tsx
│   │   │   │   │   │   └── data-card.tsx
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── courses/
│   │   │   │   │   ├── [courseId]/
│   │   │   │   │   │   ├── _components/
│   │   │   │   │   │   │   ├── actions.tsx
│   │   │   │   │   │   │   ├── attachment-form.tsx
│   │   │   │   │   │   │   ├── category-form.tsx
│   │   │   │   │   │   │   ├── modules-form.tsx
│   │   │   │   │   │   │   ├── modules-list.tsx
│   │   │   │   │   │   │   ├── description-form.tsx
│   │   │   │   │   │   │   ├── developed-skills-form.tsx
│   │   │   │   │   │   │   ├── image-form.tsx
│   │   │   │   │   │   │   ├── level-form.tsx
│   │   │   │   │   │   │   ├── previous-skills-form.tsx
│   │   │   │   │   │   │   ├── price-form.tsx
│   │   │   │   │   │   │   └── title-form.tsx
│   │   │   │   │   │   ├── modules/
│   │   │   │   │   │   │   ├── [moduleId]/
│   │   │   │   │   │   │   │   ├── _components/
│   │   │   │   │   │   │   │   │   ├── access-form.tsx
│   │   │   │   │   │   │   │   │   ├── actions.tsx
│   │   │   │   │   │   │   │   │   ├── description-form.tsx
│   │   │   │   │   │   │   │   │   ├── title-form.tsx
│   │   │   │   │   │   │   │   │   ├── video-form.tsx
│   │   │   │   │   │   │   │   │   ├── videoTranscript-form.tsx
│   │   │   │   │   │   │   │   │   ├── videoUrl-form.tsx
│   │   │   │   │   │   │   │   │   └── videoYoutube-form.tsx
│   │   │   │   │   │   │   │   └── page.tsx
│   ├── api/                # Rutas API del backend
│   │   ├── courses/
│   │   │   ├── [courseId]/
│   │   │   │   ├── attachments/
│   │   │   │   ├── modules/
│   │   │   │   ├── enroll/
│   │   │   │   ├── publish/
│   │   │   │   ├── unpublish/
│   │   ├── courses/
│   │   │   └── route.ts
│   │   ├── uploadthing/
│   │   │   ├── core.ts
│   │   │   └── route.ts
├── components/             # Componentes reutilizables de la UI
├── hooks/                  # Custom hooks
├── lib/                    # Bibliotecas y utilidades
├── prisma/                 # Configuración de Prisma y base de datos
├── public/                 # Archivos estáticos (imágenes, fuentes, etc.)
├── scripts/                # Scripts auxiliares
├── styles/                 # Archivos de estilos y configuración de Tailwind CSS
├── config/                 # Configuración de Next.js, TypeScript y PostCSS
├── package.json            # Dependencias y scripts del proyecto
├── README.md               # Documentación principal

~~~

---

## 📸 Gestión de Imágenes, Videos y Archivos con Uploadthing

La carga y visualización de imágenes, videos y archivos en Uploadthing está integrada en el backend y frontend.

### **Ejemplo de carga de imagen, video y archivo en el frontend**

```tsx
export const UploadDropzone = generateUploadDropzone<OurFileRouter>();

export const FileUpload = ({ action, endpoint }: FileUploadProps) => {
    return (
        <UploadDropzone
            endpoint={endpoint}
            onClientUploadComplete={(res) => {
                action(res?.[0].url);
            }}
            onUploadError={(error: Error) => {
                toast.error(`${error?.message}`);
            }}
        />
    );
};

<FileUpload
    endpoint="courseImage"
    action={(url) => {
        if (url) {
            onSubmit({ imageUrl: url });
        }
    }}
/>
```

### **Ejemplo de almacenamiento en el backend**

```ts
export const ourFileRouter = {
    courseImage: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
        .middleware(async ({ req }) => {
            const userId = await handleAuth(req);
            return { userId: userId };
        })
        .onUploadComplete(async ({ metadata, file }) => {
            console.log("Upload complete for userId:", metadata.userId);
            console.log("File URL:", file.url);
        }),
};
```

---

## 🎯 Cómo Usar la Aplicación

El Aplicativo Web - Aula STEAM ha sido diseñado para facilitar el acceso a tutoriales, la gestión de eventos y la certificación de competencias. A continuación, se explica cómo utilizar sus principales funcionalidades.

### **1️⃣ Acceso y Autenticación**
- Para ingresar, los usuarios deben registrarse o iniciar sesión con sus credenciales.
- Se cuenta con roles de usuario que determinan los permisos de acceso a las funcionalidades.
- El acceso es seguro gracias al uso de Clerk para la autenticación.

### **2️⃣ Registro y Gestión de Eventos**
- Los administradores pueden crear, modificar y eliminar eventos de capacitación.
- Los usuarios pueden inscribirse en eventos disponibles y recibir notificaciones.
- Se registra la asistencia y se generan reportes de participación.

### **3️⃣ Módulo de Aprendizaje**
- Acceso a tutoriales y recursos educativos sobre el uso de equipos y metodologías STEAM.
- Los usuarios pueden visualizar contenido multimedia como videos, documentos PDF y guías interactivas.
- Se realizan evaluaciones para medir el aprendizaje y certificar competencias.

### **4️⃣ Sistema de Certificación**
- Una vez completadas las capacitaciones, los usuarios pueden presentar una evaluación.
- Si aprueban, reciben una certificación digital validada dentro del sistema.
- Se genera un historial de certificaciones disponibles en el perfil del usuario.

### **5️⃣ Accesibilidad y Experiencia en Dispositivos Móviles**
- La aplicación es completamente responsive, adaptándose a dispositivos móviles y tabletas.
- Se ha utilizado ShadCN UI y Tailwind CSS, asegurando una interfaz optimizada y accesible.
- La navegación es fluida, permitiendo una experiencia intuitiva en cualquier tamaño de pantalla.

---

## 🔧 Mantenimiento de la Plataforma

El mantenimiento del aplicativo puede ser realizado por desarrolladores con conocimientos en **Next.js, Node.js, MongoDB y Tailwind CSS**. Se recomienda contar con experiencia en **Prisma ORM** para la gestión de datos y en **Uploadthing** para la administración de imágenes, videos y archivos.

Se recomienda realizar revisiones periódicas en la base de datos, seguridad y accesibilidad, asegurando que los recursos estén actualizados y la plataforma siga operando de manera eficiente. La actualización del contenido educativo y la gestión de usuarios pueden ser llevadas a cabo por administradores del Aula STEAM con acceso al panel de control.

---

## 👥 Autores

- Juan D. Villa ( https://github.com/danielvillam ) - _Desarrollador_
- Nicolás Ruiz (https://github.com/Nicorb72) - _Desarrollador_
- Julieth A. Bautista (https://github.com/JulbautistaT) * _Desarolladora_

---

## 📄 Licencia

Este proyecto está bajo la **Licencia MIT**, lo que significa que puedes usarlo, modificarlo y distribuirlo libremente. ¡Siéntete libre de contribuir! 🎉


// scripts/seed.ts
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const categories = [
  "Equipos del Aula STEAM",
  "Ciencias de la Computación",
  "Inteligencia Artificial",
  "Desarrollo Web",
  "Bases de Datos",
  "Robótica",
  "Internet de las Cosas (IoT)",
  "Matemáticas",
  "Física",
  "Química",
  "Biología",
  "Astronomía",
  "Administración de Empresas",
  "Finanzas Personales",
  "Contabilidad",
  "Marketing",
  "Recursos Humanos",
  "Liderazgo y Gestión",
  "Economía",
  "Diseño Gráfico",
  "Fotografía",
  "Dibujo y Pintura",
  "Filmación y Video",
  "Animación",
  "Música",
  "Inglés",
  "Idiomas",
  "Historia",
  "Filosofía",
  "Literatura",
  "Comunicación",
  "Nutrición",
  "Ingeniería Civil",
  "Ingeniería Eléctrica",
  "Ingeniería Electrónica",
  "Ingeniería Mecánica",
  "Automatización",
  "CAD/CAM",
  "Cocina",
  "Manualidades",
  "Moda y Estilo",
  "Pedagogía",
  "STEAM",
  "Educación Inclusiva",
  "Gamificación del Aprendizaje",
  "Redes",
  "Cloud Computing",
  "Sistemas Operativos",
  "Administración de Sistemas",
];

async function main() {
  // Normaliza (evita duplicados por espacios accidentales)
  const unique = Array.from(new Set(categories.map((c) => c.trim())));

  // upsert idempotente por nombre único (Mongo requiere que "where" use un campo único)
  await prisma.$transaction(
    unique.map((name) =>
      prisma.category.upsert({
        where: { name },   // ← requiere name @unique (ya lo tienes)
        update: {},        // no cambies nada si ya existe
        create: { name },
      })
    ),
    // Nota: en Mongo los $transaction requieren cluster con transacciones habilitadas (>=4.2).
    // Si tu clúster no soporta transacciones, comenta la línea de $transaction y usa un for-await secuencial abajo.
  );

  console.log(`✅ Categorías aseguradas: ${unique.length}`);
}

/*
// Alternativa segura sin transacciones (por si tu cluster no las soporta):
async function main() {
  const unique = Array.from(new Set(categories.map((c) => c.trim())));
  for (const name of unique) {
    await prisma.category.upsert({ where: { name }, update: {}, create: { name } });
  }
  console.log(`✅ Categorías aseguradas: ${unique.length}`);
}
*/

main()
  .catch((e) => {
    console.error("❌ Error al inicializar las categorías:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
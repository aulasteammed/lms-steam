import { MongoClient, ObjectId } from "mongodb";

const uri = process.env.DATABASE_URL;

if (!uri) {
  throw new Error("DATABASE_URL no está definido");
}

const mongoUri = uri;

const dbName = (() => {
  const url = new URL(mongoUri);
  const name = url.pathname.replace(/^\//, "");
  if (!name) {
    throw new Error("No se pudo determinar el nombre de la base de datos desde DATABASE_URL");
  }
  return name;
})();

async function migrateCourseCategories() {
  const client = new MongoClient(mongoUri);

  try {
    await client.connect();

    const database = client.db(dbName);
    const courses = database.collection("Course");
    const courseCategories = database.collection("CourseCategory");

    const legacyCourses = await courses
      .find({ categoryId: { $exists: true, $ne: null } })
      .project({ _id: 1, categoryId: 1 })
      .toArray();

    let migrated = 0;

    for (const course of legacyCourses) {
      const categoryId =
        typeof course.categoryId === "string"
          ? new ObjectId(course.categoryId)
          : course.categoryId;

      if (!categoryId) {
        continue;
      }

      const result = await courseCategories.updateOne(
        {
          courseId: course._id,
          categoryId,
        },
        {
          $setOnInsert: {
            courseId: course._id,
            categoryId,
            createdAt: new Date(),
          },
        },
        { upsert: true }
      );

      if (result.upsertedCount > 0) {
        migrated += 1;
      }
    }

    console.log(`✅ Cursos migrados a relación múltiple: ${migrated}`);
  } finally {
    await client.close();
  }
}

migrateCourseCategories().catch((error) => {
  console.error("❌ Error al migrar categorías de cursos:", error);
  process.exit(1);
});

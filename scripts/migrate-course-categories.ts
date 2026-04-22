import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const courses = (await prisma.course.findRaw({
    filter: {
      categoryId: {
        $exists: true,
      },
    },
    options: {
      projection: {
        _id: true,
        categoryId: true,
      },
    },
  })) as unknown as Array<{
    _id?: { $oid?: string };
    categoryId?: string;
  }>;

  let migrated = 0;

  for (const course of courses) {
    const courseId = course._id?.$oid;

    if (!courseId || !course.categoryId) {
      continue;
    }

    await prisma.courseCategory.upsert({
      where: {
        courseId_categoryId: {
          courseId,
          categoryId: course.categoryId,
        },
      },
      update: {},
      create: {
        courseId,
        categoryId: course.categoryId,
      },
    });

    migrated += 1;
  }

  console.log(`Categorias migradas: ${migrated}`);
}

main()
  .catch((error) => {
    console.error("Error migrando categorias de cursos:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { db } from "@/lib/db";

type DbLike = any;

const RETRY_CODE_LENGTH = 8;
const RETRY_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateRetryCode() {
  let code = "";
  for (let i = 0; i < RETRY_CODE_LENGTH; i++) {
    const idx = Math.floor(Math.random() * RETRY_ALPHABET.length);
    code += RETRY_ALPHABET[idx];
  }
  return code;
}

export async function getOrCreateActiveRetryCode(client: DbLike = db) {
  const active = await client.retryAccessCode.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
  });

  if (active) return active;

  // Retry on rare collision with unique code constraint.
  for (let i = 0; i < 5; i++) {
    try {
      return await client.retryAccessCode.create({
        data: {
          code: generateRetryCode(),
          isActive: true,
        },
      });
    } catch {
      // Keep retrying code generation.
    }
  }

  throw new Error("No se pudo generar un código de reintento");
}

export async function rotateRetryCode(client: DbLike = db) {
  for (let i = 0; i < 5; i++) {
    try {
      return await client.retryAccessCode.create({
        data: {
          code: generateRetryCode(),
          isActive: true,
        },
      });
    } catch {
      // Keep retrying code generation.
    }
  }

  throw new Error("No se pudo rotar el código de reintento");
}

export async function getGrantedAttempts(
  userId: string,
  evaluationId: string,
  client: DbLike = db
) {
  const grants = await client.evaluationRetryGrant.findMany({
    where: {
      userId,
      evaluationId,
    },
    select: {
      extraAttempts: true,
    },
  });

  return grants.reduce(
    (sum: number, grant: { extraAttempts: number }) => sum + grant.extraAttempts,
    0
  );
}

export async function getAllowedAttempts(
  userId: string,
  evaluationId: string,
  baseMaxAttempts: number,
  client: DbLike = db
) {
  const grantedAttempts = await getGrantedAttempts(userId, evaluationId, client);
  return baseMaxAttempts + grantedAttempts;
}

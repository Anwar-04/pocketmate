import { PrismaClient } from "@prisma/client";

/**
 * Normalizes database connection URLs.
 * Handles edge cases like quotes, 'DATABASE_URL=' prefix in Vercel value box,
 * unencoded characters in password, and trailing whitespace.
 */
function cleanDatabaseUrl(raw?: string): string | undefined {
  if (!raw) return undefined;
  let url = raw.trim();

  // Strip leading and trailing quotes (single, double, backticks)
  url = url.replace(/^["'`]+|["'`]+$/g, "").trim();

  // If user pasted KEY=VALUE into the Vercel value field
  if (url.includes("=")) {
    const eqIdx = url.indexOf("=");
    const key = url.slice(0, eqIdx).trim();
    if (key.includes("DATABASE_URL") || key.includes("DIRECT_URL")) {
      url = url.slice(eqIdx + 1).trim().replace(/^["'`]+|["'`]+$/g, "").trim();
    }
  }

  // Handle unencoded special characters in password (like # or @)
  if (url.includes("://") && url.includes("@")) {
    try {
      const protoEnd = url.indexOf("://");
      const protocol = url.slice(0, protoEnd + 3);
      const afterProto = url.slice(protoEnd + 3);
      const lastAt = afterProto.lastIndexOf("@");
      if (lastAt !== -1) {
        const credentials = afterProto.slice(0, lastAt);
        const hostAndRest = afterProto.slice(lastAt + 1);
        const firstColon = credentials.indexOf(":");
        if (firstColon !== -1) {
          const user = credentials.slice(0, firstColon);
          let password = credentials.slice(firstColon + 1);
          // If password contains unencoded #, encode as %23
          if (password.includes("#") && !password.includes("%23")) {
            password = password.replace(/#/g, "%23");
          }
          // If password contains unencoded @, encode as %40
          if (password.includes("@") && !password.includes("%40")) {
            password = password.replace(/@/g, "%40");
          }
          url = `${protocol}${user}:${password}@${hostAndRest}`;
        }
      }
    } catch {}
  }

  return url;
}

const cleanedDbUrl = cleanDatabaseUrl(process.env.DATABASE_URL);
const cleanedDirectUrl = cleanDatabaseUrl(process.env.DIRECT_URL);

if (cleanedDbUrl) {
  process.env.DATABASE_URL = cleanedDbUrl;
}
if (cleanedDirectUrl) {
  process.env.DIRECT_URL = cleanedDirectUrl;
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: cleanedDbUrl
      ? {
          db: {
            url: cleanedDbUrl,
          },
        }
      : undefined,
    log: ["error"],
  });

// Persist prisma singleton across requests and hot-reloads to prevent connection churn
globalForPrisma.prisma = prisma;

export default prisma;

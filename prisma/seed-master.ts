import { PrismaClient } from "../src/generated/prisma-master/client";
import { hashSync } from "bcryptjs";

function createClient(): PrismaClient {
  if (process.env.MASTER_TURSO_DATABASE_URL) {
    const { PrismaLibSql } = require("@prisma/adapter-libsql");
    return new PrismaClient({
      adapter: new PrismaLibSql({
        url: process.env.MASTER_TURSO_DATABASE_URL,
        authToken: process.env.MASTER_TURSO_AUTH_TOKEN,
      }),
    });
  }

  const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");
  return new PrismaClient({
    adapter: new PrismaBetterSqlite3({
      url: process.env.MASTER_DATABASE_URL || "file:./prisma/master.db",
    }),
  });
}

async function main() {
  const prisma = createClient();

  const email = process.env.SUPER_ADMIN_EMAIL ?? "admin@faixappreta.com.br";
  const password = process.env.SUPER_ADMIN_PASSWORD ?? "faixappreta123";

  const existing = await prisma.superAdmin.findUnique({ where: { email } });

  if (!existing) {
    await prisma.superAdmin.create({
      data: {
        email,
        passwordHash: hashSync(password, 10),
      },
    });
    console.log(`Super admin created: ${email}`);
  } else {
    console.log(`Super admin already exists: ${email}`);
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

import { createClient } from "@libsql/client";
import { readFileSync } from "fs";
import { join } from "path";
import { hashSync } from "bcryptjs";
import { createId } from "@paralleldrive/cuid2";

export async function migrateTenantDatabase(
  dbUrl: string,
  authToken: string | undefined,
  admin: { name: string; email: string; password: string }
) {
  const client = createClient({
    url: dbUrl,
    ...(authToken ? { authToken } : {}),
  });

  // Run DDL
  const ddl = readFileSync(
    join(process.cwd(), "prisma/tenant-schema.sql"),
    "utf-8"
  );

  const statements = ddl
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const stmt of statements) {
    await client.execute(stmt);
  }

  // Create admin user
  const passwordHash = hashSync(admin.password, 10);
  const adminId = createId();

  await client.execute({
    sql: `INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "status", "isOwner") VALUES (?, ?, ?, ?, 'ADMIN', 'APPROVED', 1)`,
    args: [adminId, admin.name, admin.email, passwordHash],
  });

  // Seed BeltRequirement
  const belts = [
    { belt: "AZUL", classes: 100 },
    { belt: "ROXA", classes: 200 },
    { belt: "MARROM", classes: 300 },
    { belt: "PRETA", classes: 400 },
  ];

  for (const b of belts) {
    await client.execute({
      sql: `INSERT INTO "BeltRequirement" ("id", "belt", "requiredClasses") VALUES (?, ?, ?)`,
      args: [createId(), b.belt, b.classes],
    });
  }

  // Seed DegreeRequirement
  const degrees = [
    { belt: "BRANCA", degree: 1, classes: 25 },
    { belt: "BRANCA", degree: 2, classes: 50 },
    { belt: "BRANCA", degree: 3, classes: 75 },
    { belt: "BRANCA", degree: 4, classes: 100 },
    { belt: "AZUL", degree: 1, classes: 50 },
    { belt: "AZUL", degree: 2, classes: 100 },
    { belt: "AZUL", degree: 3, classes: 150 },
    { belt: "AZUL", degree: 4, classes: 200 },
    { belt: "ROXA", degree: 1, classes: 75 },
    { belt: "ROXA", degree: 2, classes: 150 },
    { belt: "ROXA", degree: 3, classes: 225 },
    { belt: "ROXA", degree: 4, classes: 300 },
    { belt: "MARROM", degree: 1, classes: 100 },
    { belt: "MARROM", degree: 2, classes: 200 },
    { belt: "MARROM", degree: 3, classes: 300 },
    { belt: "MARROM", degree: 4, classes: 400 },
  ];

  for (const d of degrees) {
    await client.execute({
      sql: `INSERT INTO "DegreeRequirement" ("id", "belt", "degree", "requiredClasses") VALUES (?, ?, ?, ?)`,
      args: [createId(), d.belt, d.degree, d.classes],
    });
  }

  client.close();
}

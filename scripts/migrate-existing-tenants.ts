/**
 * Migration script to add isOwner, instructorId columns to existing tenant databases.
 * Run with: npx tsx scripts/migrate-existing-tenants.ts
 */
import { PrismaClient as MasterPrismaClient } from "../src/generated/prisma-master/client";
import { createClient } from "@libsql/client";

async function main() {
  const masterUrl = process.env.MASTER_TURSO_DATABASE_URL || process.env.MASTER_DATABASE_URL || "file:./prisma/master.db";
  const masterToken = process.env.MASTER_TURSO_AUTH_TOKEN;

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  let master: MasterPrismaClient;
  if (masterUrl.startsWith("libsql://")) {
    const { PrismaLibSql } = require("@prisma/adapter-libsql");
    master = new MasterPrismaClient({
      adapter: new PrismaLibSql({ url: masterUrl, authToken: masterToken }),
    });
  } else {
    const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");
    master = new MasterPrismaClient({
      adapter: new PrismaBetterSqlite3({ url: masterUrl }),
    });
  }

  const tenants = await master.tenant.findMany({ where: { isActive: true } });
  console.log(`Found ${tenants.length} active tenants to migrate`);

  for (const tenant of tenants) {
    console.log(`\nMigrating tenant: ${tenant.slug}`);
    const client = createClient({
      url: tenant.tursoDbUrl,
      ...(tenant.tursoAuthToken ? { authToken: tenant.tursoAuthToken } : {}),
    });

    try {
      // Add isOwner column to User
      await client.execute(`ALTER TABLE "User" ADD COLUMN "isOwner" INTEGER NOT NULL DEFAULT 0`).catch(() => {
        console.log(`  isOwner column already exists`);
      });

      // Add instructorId to GroupClass
      await client.execute(`ALTER TABLE "GroupClass" ADD COLUMN "instructorId" TEXT REFERENCES "User"("id") ON DELETE SET NULL`).catch(() => {
        console.log(`  GroupClass.instructorId column already exists`);
      });

      // Add instructorId to PrivateSlot
      await client.execute(`ALTER TABLE "PrivateSlot" ADD COLUMN "instructorId" TEXT REFERENCES "User"("id") ON DELETE SET NULL`).catch(() => {
        console.log(`  PrivateSlot.instructorId column already exists`);
      });

      // Set the first ADMIN as owner
      const admins = await client.execute(`SELECT "id" FROM "User" WHERE "role" = 'ADMIN' ORDER BY "createdAt" ASC LIMIT 1`);
      if (admins.rows.length > 0) {
        const ownerId = admins.rows[0].id as string;
        await client.execute({ sql: `UPDATE "User" SET "isOwner" = 1 WHERE "id" = ?`, args: [ownerId] });
        console.log(`  Set owner: ${ownerId}`);

        // Assign existing GroupClasses and PrivateSlots to the owner
        await client.execute({ sql: `UPDATE "GroupClass" SET "instructorId" = ? WHERE "instructorId" IS NULL`, args: [ownerId] });
        await client.execute({ sql: `UPDATE "PrivateSlot" SET "instructorId" = ? WHERE "instructorId" IS NULL`, args: [ownerId] });
        console.log(`  Assigned classes/slots to owner`);
      }

      console.log(`  Done`);
    } catch (err) {
      console.error(`  Error migrating ${tenant.slug}:`, err);
    } finally {
      client.close();
    }
  }

  await master.$disconnect();
  console.log("\nMigration complete!");
}

main().catch(console.error);

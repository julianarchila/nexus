import "dotenv/config";
import { sql } from "drizzle-orm";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { db } from "../src/core/db/client";

/**
 * Migration runner script
 *
 * Runs SQL migration files from src/core/db/migrations/ in order.
 * Tracks executed migrations in a migrations table.
 *
 * Usage: bun run scripts/migrate.ts
 */

const MIGRATIONS_DIR = join(__dirname, "../src/core/db/migrations");

interface Migration {
  name: string;
  executed_at: Date;
}

async function ensureMigrationsTable() {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS _migrations (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      executed_at TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `);
}

async function getExecutedMigrations(): Promise<string[]> {
  const result = await db.execute(sql`
    SELECT name FROM _migrations ORDER BY name
  `);
  return (result.rows as unknown as Migration[]).map((r) => r.name);
}

async function recordMigration(name: string) {
  await db.execute(sql`
    INSERT INTO _migrations (name) VALUES (${name})
  `);
}

/**
 * Split SQL content into individual statements
 * Handles comments and ensures clean statement separation
 */
function splitSqlStatements(sqlContent: string): string[] {
  // Remove single-line comments
  const withoutComments = sqlContent
    .split("\n")
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n");

  // Split by semicolons and filter empty statements
  return withoutComments
    .split(";")
    .map((stmt) => stmt.trim())
    .filter((stmt) => stmt.length > 0);
}

async function runMigration(name: string, sqlContent: string) {
  console.log(`  Running: ${name}`);

  // Split into individual statements for better error handling
  // and compatibility with PlanetScale/PostgreSQL
  const statements = splitSqlStatements(sqlContent);

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    console.log(
      `    [${i + 1}/${statements.length}] ${stmt.substring(0, 60)}...`,
    );
    try {
      await db.execute(sql.raw(stmt));
    } catch (error) {
      console.error(`    ❌ Failed on statement ${i + 1}:`);
      console.error(`       ${stmt}`);
      throw error;
    }
  }

  await recordMigration(name);
  console.log(`  ✅ Completed: ${name}`);
}

async function migrate() {
  try {
    console.log("🔄 Starting migrations...\n");

    // Ensure migrations tracking table exists
    await ensureMigrationsTable();

    // Get list of migration files
    let migrationFiles: string[];
    try {
      migrationFiles = readdirSync(MIGRATIONS_DIR)
        .filter((f) => f.endsWith(".sql"))
        .sort();
    } catch {
      console.log("📁 No migrations directory found. Creating it...");
      console.log("   No migrations to run.\n");
      process.exit(0);
    }

    if (migrationFiles.length === 0) {
      console.log("📁 No migration files found.\n");
      process.exit(0);
    }

    // Get already executed migrations
    const executed = await getExecutedMigrations();
    console.log(`📋 Found ${migrationFiles.length} migration file(s)`);
    console.log(`✅ Already executed: ${executed.length}\n`);

    // Find pending migrations
    const pending = migrationFiles.filter((f) => !executed.includes(f));

    if (pending.length === 0) {
      console.log("✨ All migrations are up to date!\n");
      process.exit(0);
    }

    console.log(`⏳ Pending migrations: ${pending.length}\n`);

    // Run each pending migration
    for (const file of pending) {
      const filePath = join(MIGRATIONS_DIR, file);
      const sqlContent = readFileSync(filePath, "utf-8");
      await runMigration(file, sqlContent);
    }

    console.log("\n🎉 All migrations completed successfully!\n");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    process.exit(1);
  }
}

migrate();

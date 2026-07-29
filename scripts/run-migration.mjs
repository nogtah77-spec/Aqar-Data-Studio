/**
 * Run Supabase migration SQL directly against the PostgreSQL database.
 * Usage: node scripts/run-migration.mjs
 */
import pg from "pg";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const projectRef = "fsyvpeuzgsajdywovjsf";
const password = process.env.SUPABASE_DB_PASSWORD;

if (!password) {
  console.error("SUPABASE_DB_PASSWORD environment variable is required");
  process.exit(1);
}

// Supabase direct connection (works regardless of region)
const connectionString = `postgresql://postgres:${password}@db.${projectRef}.supabase.co:5432/postgres`;

const { Client } = pg;

async function run() {
  const sqlPath = resolve(__dirname, "../supabase/migrations/001_initial_schema.sql");
  const sql = readFileSync(sqlPath, "utf-8");

  console.log("Connecting to Supabase...");
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });

  try {
    await client.connect();
    console.log("Connected. Running migration...");
    await client.query(sql);
    console.log("✅ Migration completed successfully.");
  } finally {
    await client.end();
  }
}

run().catch((err) => {
  console.error("Migration failed:", err.message);
  process.exit(1);
});

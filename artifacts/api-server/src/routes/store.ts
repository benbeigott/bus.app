import { Router } from "express";
import { Pool } from "pg";

const router = Router();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("sslmode=disable") ? false : { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  statement_timeout: 60000,
});

// Ensure table exists on startup
pool.query(`
  CREATE TABLE IF NOT EXISTS store_data (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )
`).catch(err => console.error("store_data table init error:", err.message));

router.get("/store", async (req, res) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  res.setHeader("Pragma", "no-cache");

  const key = req.query.key as string;
  if (!key) return res.status(400).json({ error: "key required" });

  try {
    const result = await pool.query(
      "SELECT value FROM store_data WHERE key = $1",
      [key]
    );

    if (result.rows.length === 0) {
      return res.json(key === "depot" ? null : []);
    }

    try {
      return res.json(JSON.parse(result.rows[0].value));
    } catch {
      return res.json(result.rows[0].value);
    }
  } catch (err: any) {
    console.error(`[DB GET] Fehler für key='${key}':`, err?.message);
    return res.status(503).json({ error: "DB unavailable: " + err?.message });
  }
});

router.post("/store", async (req, res) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");

  const key = req.query.key as string;
  if (!key) return res.status(400).json({ error: "key required" });

  const value = req.body?.value;
  if (value === undefined) return res.status(400).json({ error: "value required" });

  const serialized = JSON.stringify(value);
  console.log(`[DB POST] key='${key}' | Größe: ${(serialized.length / 1024).toFixed(1)} KB (${serialized.length} Zeichen)`);

  try {
    await pool.query(
      `INSERT INTO store_data (key, value, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
      [key, serialized]
    );
    console.log(`[DB POST] ✓ key='${key}' erfolgreich gespeichert`);
    return res.json({ ok: true });
  } catch (err: any) {
    console.error(`[DB POST] ✗ FEHLER für key='${key}':`, err?.message, err?.code);
    return res.status(503).json({ error: "DB write failed: " + err?.message });
  }
});

export default router;

import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 5,
});

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  const key = req.query.key as string;
  if (!key) return res.status(400).json({ error: "key required" });

  try {
    if (req.method === "GET") {
      const r = await pool.query("SELECT value FROM bd_store WHERE key = $1", [key]);
      return res.json(r.rows[0]?.value ?? []);
    }

    if (req.method === "POST") {
      const value = req.body?.value;
      if (value === undefined) return res.status(400).json({ error: "value required" });
      await pool.query(
        `INSERT INTO bd_store (key, value, updated_at)
         VALUES ($1, $2::jsonb, NOW())
         ON CONFLICT (key) DO UPDATE SET value = $2::jsonb, updated_at = NOW()`,
        [key, JSON.stringify(value)]
      );
      return res.json({ ok: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err: any) {
    console.error("DB error:", err?.message);
    return res.status(500).json({ error: err?.message || "Server error" });
  }
}

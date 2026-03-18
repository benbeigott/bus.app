import { Router } from "express";
import https from "https";
import http from "http";

const router = Router();

const DB_URL = process.env.REPLIT_DB_URL || "";

function kvRequest(method: string, path: string, body?: string): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    if (!DB_URL) return reject(new Error("REPLIT_DB_URL not set"));
    const url = new URL(DB_URL + path);
    const mod = url.protocol === "https:" ? https : http;
    const opts: any = {
      hostname: url.hostname,
      port: url.port || (url.protocol === "https:" ? 443 : 80),
      path: url.pathname + url.search,
      method,
      headers: {} as Record<string, string | number>,
    };
    if (body) {
      opts.headers["Content-Type"] = "application/x-www-form-urlencoded";
      opts.headers["Content-Length"] = Buffer.byteLength(body);
    }
    const req = mod.request(opts, (res: any) => {
      let data = "";
      res.on("data", (c: any) => (data += c));
      res.on("end", () => resolve({ status: res.statusCode || 200, body: data }));
    });
    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

router.get("/store", async (req, res) => {
  const key = req.query.key as string;
  if (!key) return res.status(400).json({ error: "key required" });
  const kvKey = "bd_" + key;
  try {
    const r = await kvRequest("GET", "/" + encodeURIComponent(kvKey));
    if (r.status !== 200 && r.status !== 404) {
      console.error("KV GET error status:", r.status, r.body.slice?.(0, 100));
      return res.status(503).json({ error: "KV unavailable", status: r.status });
    }
    if (r.status === 404 || r.body === "") {
      return res.json(key === "depot" ? null : []);
    }
    try { return res.json(JSON.parse(r.body)); }
    catch { return res.json(r.body); }
  } catch (err: any) {
    return res.status(500).json({ error: err?.message });
  }
});

router.post("/store", async (req, res) => {
  const key = req.query.key as string;
  if (!key) return res.status(400).json({ error: "key required" });
  const value = req.body?.value;
  if (value === undefined) return res.status(400).json({ error: "value required" });
  const kvKey = "bd_" + key;
  try {
    const encoded = encodeURIComponent(kvKey) + "=" + encodeURIComponent(JSON.stringify(value));
    const r = await kvRequest("POST", "", encoded);
    if (r.status !== 200) {
      console.error("KV POST error status:", r.status, r.body?.slice?.(0, 100));
      return res.status(503).json({ error: "KV write failed", status: r.status });
    }
    return res.json({ ok: true });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message });
  }
});

export default router;

const https = require("https");
const http = require("http");

const DB_URL = process.env.REPLIT_DB_URL;

function kvRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    if (!DB_URL) return reject(new Error("REPLIT_DB_URL not set"));
    const url = new URL(DB_URL + path);
    const mod = url.protocol === "https:" ? https : http;
    const opts = {
      hostname: url.hostname,
      port: url.port || (url.protocol === "https:" ? 443 : 80),
      path: url.pathname + url.search,
      method,
      headers: {},
    };
    if (body) {
      opts.headers["Content-Type"] = "application/x-www-form-urlencoded";
      opts.headers["Content-Length"] = Buffer.byteLength(body);
    }
    const req = mod.request(opts, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => resolve({ status: res.statusCode, body: data }));
    });
    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

async function kvGet(kvKey) {
  const r = await kvRequest("GET", "/" + encodeURIComponent(kvKey), null);
  return r;
}

async function kvSet(kvKey, encoded) {
  // Retry up to 3 times on failure
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const r = await kvRequest("POST", "", encoded);
      if (r.status === 200) return r;
      if (attempt < 3) await new Promise(res => setTimeout(res, 300 * attempt));
    } catch (e) {
      if (attempt === 3) throw e;
      await new Promise(res => setTimeout(res, 300 * attempt));
    }
  }
}

module.exports = async function handler(req, res) {
  // CRITICAL: Disable ALL caching so every device gets fresh data
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
  res.setHeader("Surrogate-Control", "no-store");
  res.setHeader("CDN-Cache-Control", "no-store");
  res.setHeader("Vercel-CDN-Cache-Control", "no-store");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const key = req.query.key;
  if (!key) return res.status(400).json({ error: "key required" });
  const kvKey = "bd_" + key;

  try {
    if (req.method === "GET") {
      const r = await kvGet(kvKey);

      if (r.status !== 200 && r.status !== 404) {
        console.error("KV GET error status:", r.status, r.body.slice(0, 200));
        return res.status(503).json({ error: "KV unavailable", status: r.status });
      }

      if (r.status === 404 || r.body === "") {
        return res.json(key === "depot" ? null : []);
      }

      try {
        return res.json(JSON.parse(r.body));
      } catch {
        return res.json(r.body);
      }
    }

    if (req.method === "POST") {
      const value = req.body && req.body.value;
      if (value === undefined) return res.status(400).json({ error: "value required" });
      const encoded = encodeURIComponent(kvKey) + "=" + encodeURIComponent(JSON.stringify(value));
      
      try {
        const r = await kvSet(kvKey, encoded);
        if (!r || r.status !== 200) {
          console.error("KV POST failed after retries:", r && r.status, r && r.body.slice(0, 200));
          return res.status(503).json({ error: "KV write failed after retries", status: r && r.status });
        }
        return res.json({ ok: true });
      } catch (writeErr) {
        console.error("KV write exception:", writeErr && writeErr.message);
        return res.status(503).json({ error: "KV write exception: " + (writeErr && writeErr.message) });
      }
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("KV error:", err && err.message);
    return res.status(500).json({ error: (err && err.message) || "Server error" });
  }
};

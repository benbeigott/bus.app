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

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const key = req.query.key;
  if (!key) return res.status(400).json({ error: "key required" });
  const kvKey = "bd_" + key;

  try {
    if (req.method === "GET") {
      const r = await kvRequest("GET", "/" + encodeURIComponent(kvKey), null);
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
      await kvRequest("POST", "", encoded);
      return res.json({ ok: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("KV error:", err && err.message);
    return res.status(500).json({ error: (err && err.message) || "Server error" });
  }
};

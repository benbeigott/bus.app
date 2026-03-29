const REPLIT_API = process.env.REPLIT_API_URL || "";
const TIMEOUT_MS = 8000; // 8 seconds max — never hang

module.exports = async function handler(req, res) {
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

  if (!REPLIT_API) {
    return res.status(503).json({ error: "REPLIT_API_URL not configured" });
  }

  const key = req.query.key;
  if (!key) return res.status(400).json({ error: "key required" });

  const targetUrl = `${REPLIT_API}?key=${encodeURIComponent(key)}&t=${Date.now()}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    if (req.method === "GET") {
      const upstream = await fetch(targetUrl, {
        signal: controller.signal,
        headers: { "Cache-Control": "no-cache" },
      });
      clearTimeout(timer);
      const data = await upstream.json();
      return res.status(upstream.ok ? 200 : upstream.status).json(data);
    }

    if (req.method === "POST") {
      const upstream = await fetch(targetUrl, {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: req.body?.value }),
      });
      clearTimeout(timer);
      const data = await upstream.json();
      return res.status(upstream.ok ? 200 : upstream.status).json(data);
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    clearTimeout(timer);
    const isTimeout = err?.name === "AbortError";
    console.error(`[Proxy] ${isTimeout ? "TIMEOUT" : "ERROR"} key='${key}':`, err?.message);
    return res.status(502).json({ error: isTimeout ? "Server timeout" : "Proxy error: " + (err?.message || "unknown") });
  }
};

module.exports.config = {
  api: { bodyParser: { sizeLimit: "50mb" } },
};

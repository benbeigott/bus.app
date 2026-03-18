import { Router } from "express";

const router = Router();

interface ChatMessage {
  id: string;
  from: string;
  fromName: string;
  to: string | null;
  text: string;
  timestamp: number;
}

const messages: ChatMessage[] = [];
const MAX_MESSAGES = 500;

router.get("/", (req, res) => {
  const since = Number(req.query.since) || 0;
  const to = req.query.to as string | undefined;
  const from = req.query.from as string | undefined;

  let filtered = messages.filter(m => m.timestamp > since);

  if (to !== undefined) {
    filtered = filtered.filter(m => {
      if (to === "group") return m.to === null;
      return (m.to === to && m.from === from) || (m.to === from && m.from === to);
    });
  }

  res.json(filtered);
});

router.post("/", (req, res) => {
  const { from, fromName, to, text } = req.body;
  if (!from || !fromName || !text) {
    return res.status(400).json({ error: "from, fromName, text required" });
  }
  const msg: ChatMessage = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    from,
    fromName,
    to: to || null,
    text: String(text).slice(0, 2000),
    timestamp: Date.now(),
  };
  messages.push(msg);
  if (messages.length > MAX_MESSAGES) messages.splice(0, messages.length - MAX_MESSAGES);
  res.json(msg);
});

export default router;

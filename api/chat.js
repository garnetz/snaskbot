// SNASKBOT backend on Vercel: POST /api/chat
// The API key is a Vercel environment variable; visitors' browsers never see it.
import Anthropic from "@anthropic-ai/sdk";
import { PERSONA } from "./_persona.js";

const MODEL = process.env.SNASK_MODEL || "claude-opus-5-5"; // set to claude-haiku-5-5 for a much cheaper bot
const PER_VISITOR = Number(process.env.MAX_MESSAGES_PER_VISITOR || 30); // per 10 minutes
const client = new Anthropic(); // reads ANTHROPIC_API_KEY

// Best-effort limit: Vercel may run several copies of this function, each with its own memory.
// Add Vercel's Firewall rate limiting and a Claude Console spend limit for real protection.
const visitors = new Map();
function allow(ip) {
  const now = Date.now();
  const recent = (visitors.get(ip) || []).filter((t) => now - t < 10 * 60_000);
  if (recent.length >= PER_VISITOR) return false;
  recent.push(now);
  visitors.set(ip, recent);
  return true;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ code: "invalid_request" });

  // Only the chat page (served from this same site) may call the API from a browser.
  const origin = req.headers.origin;
  if (origin && new URL(origin).host !== req.headers.host) return res.status(403).json({ code: "forbidden" });

  const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "unknown";
  if (!allow(ip)) return res.status(429).json({ code: "rate_limited" });

  const messages = Array.isArray(req.body?.messages) ? req.body.messages : [];
  const clean = messages
    .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
    .slice(-20)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }));
  while (clean.length && clean[0].role !== "user") clean.shift();
  if (!clean.length || clean.at(-1).role !== "user") return res.status(400).json({ code: "invalid_request" });

  const params = {
    model: MODEL,
    max_tokens: 1024,
    system: [{ type: "text", text: PERSONA, cache_control: { type: "ephemeral" } }],
    output_config: { effort: "low" }, // chat, not rocket science
    messages: clean,
  };
  try {
    const response = MODEL.startsWith("claude-opus")
      ? await client.beta.messages.create({ ...params, betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" })
      : await client.messages.create(params);
    if (response.stop_reason === "refusal") return res.status(502).json({ code: "refused" });
    const text = response.content.filter((b) => b.type === "text").map((b) => b.text).join("").trim();
    return res.status(200).json({ text });
  } catch (e) {
    const code = e instanceof Anthropic.RateLimitError ? "rate_limited" : "upstream_error";
    console.error(code, e.message);
    return res.status(code === "rate_limited" ? 429 : 502).json({ code });
  }
}

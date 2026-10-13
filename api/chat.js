// SNASKBOT backend on Vercel: POST /api/chat, streams the reply as plain text.
// The API key is a Vercel environment variable; visitors' browsers never see it.
import Anthropic from "@anthropic-ai/sdk";
import { getCatalog, catalogPrompt, PERSONA_BASE, MODES, allow, sameSite } from "./_lib.js";

const MODEL = process.env.SNASK_MODEL || "claude-opus-5-5"; // set to claude-haiku-5-5 for a much cheaper bot
const PER_VISITOR = Number(process.env.MAX_MESSAGES_PER_VISITOR || 30); // per 10 minutes, best effort
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const client = new Anthropic(); // reads ANTHROPIC_API_KEY

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ code: "invalid_request" });
  if (!sameSite(req)) return res.status(403).json({ code: "forbidden" });
  if (!allow(req, PER_VISITOR)) return res.status(429).json({ code: "rate_limited" });

  const body = req.body || {};
  const messages = Array.isArray(body.messages) ? body.messages : [];
  const clean = messages
    .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
    .slice(-20)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }));
  while (clean.length && clean[0].role !== "user") clean.shift();
  if (!clean.length || clean.at(-1).role !== "user") return res.status(400).json({ code: "invalid_request" });

  // An image (logo or screenshot to roast) rides along with the newest message only.
  const img = body.image;
  if (img && IMAGE_TYPES.includes(img.media_type) && typeof img.data === "string" && img.data.length < 3_500_000) {
    const last = clean.at(-1);
    last.content = [
      { type: "image", source: { type: "base64", media_type: img.media_type, data: img.data } },
      { type: "text", text: last.content },
    ];
  }

  const catalog = await getCatalog();
  const mode = MODES[body.mode] && MODES[body.mode].instruction;
  const system = [
    { type: "text", text: PERSONA_BASE },
    { type: "text", text: catalogPrompt(catalog), cache_control: { type: "ephemeral" } },
  ];
  if (mode) system.push({ type: "text", text: mode });

  const params = { model: MODEL, max_tokens: 1024, system, output_config: { effort: "low" }, messages: clean };
  try {
    const stream = MODEL.startsWith("claude-opus")
      ? client.beta.messages.stream({ ...params, betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" })
      : client.messages.stream(params);
    let started = false;
    stream.on("text", (delta) => {
      if (!started) {
        res.writeHead(200, { "content-type": "text/plain; charset=utf-8", "cache-control": "no-cache", "x-accel-buffering": "no" });
        started = true;
      }
      res.write(delta);
    });
    const final = await stream.finalMessage();
    if (!started) {
      const code = final.stop_reason === "refusal" ? "refused" : "empty";
      return res.status(502).json({ code });
    }
    if (final.stop_reason === "refusal") res.write("\n[[error:refused]]");
    res.end();
  } catch (e) {
    const code = e instanceof Anthropic.RateLimitError ? "rate_limited" : "upstream_error";
    console.error(code, e.message);
    if (res.headersSent) { res.write("\n[[error:" + code + "]]"); return res.end(); }
    return res.status(code === "rate_limited" ? 429 : 502).json({ code });
  }
}

// POST /api/brief: a visitor's project brief from the chat.
// Delivery is OFF until BRIEF_WEBHOOK_URL is set (e.g. a Slack, Zapier or Make webhook).
// Only set it once SNASK has agreed to receive briefs from the bot.
import { allow, sameSite } from "./_lib.js";

const clip = (v, n) => String(v || "").trim().slice(0, n);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ code: "invalid_request" });
  if (!sameSite(req)) return res.status(403).json({ code: "forbidden" });
  if (!allow(req, 5)) return res.status(429).json({ code: "rate_limited" });

  const b = req.body || {};
  if (b.website) return res.status(200).json({ delivered: false }); // honeypot field, bots fill it
  const brief = {
    name: clip(b.name, 100),
    email: clip(b.email, 200),
    company: clip(b.company, 120),
    project: clip(b.project, 2000),
    budget: clip(b.budget, 60),
  };
  if (!brief.name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(brief.email) || brief.project.length < 10)
    return res.status(400).json({ code: "invalid_request" });

  const url = process.env.BRIEF_WEBHOOK_URL;
  if (!url) return res.status(200).json({ delivered: false });

  const text = `New brief from SNASKBOT\nName: ${brief.name}\nEmail: ${brief.email}\nCompany: ${brief.company || "-"}\nBudget: ${brief.budget || "-"}\n\n${brief.project}`;
  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text, ...brief }),
      signal: AbortSignal.timeout(5000),
    });
    if (!r.ok) throw new Error("webhook " + r.status);
    return res.status(200).json({ delivered: true });
  } catch (e) {
    console.error("brief delivery failed", e.message);
    return res.status(502).json({ code: "upstream_error" });
  }
}

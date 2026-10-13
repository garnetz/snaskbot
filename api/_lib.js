// Shared helpers for the SNASKBOT functions: catalog (static + live from snask.com),
// system prompt, and a best-effort per-visitor rate limit.
import { PERSONA_BASE, RICH_RULES, MODES, STATIC_CATALOG } from "./_generated.js";

const SIX_HOURS = 6 * 60 * 60 * 1000;
let cache = { at: 0, data: null };

const decode = (s) =>
  String(s || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&#0?38;|&amp;/g, "&")
    .replace(/&#8217;|&rsquo;/g, "'")
    .replace(/&#8211;|&ndash;/g, "–")
    .replace(/&quot;/g, '"')
    .replace(/&#\d+;/g, "")
    .replace(/\s+/g, " ")
    .trim();
const titleFromSlug = (slug) => slug.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");

async function getText(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(4000), headers: { "user-agent": "SNASKBOT/1.0" } });
  if (!res.ok) throw new Error(`${url} ${res.status}`);
  return res.text();
}

// The live shop, via WooCommerce's public Store API.
async function liveShop() {
  const items = JSON.parse(await getText("https://snask.com/wp-json/wc/store/v1/products?per_page=100"));
  const shop = {};
  for (const p of items) {
    const pr = p.prices || {};
    const price = pr.price ? `${(Number(pr.price) / 10 ** (pr.currency_minor_unit ?? 2)).toFixed(0)} ${pr.currency_code || "EUR"}` : "";
    shop[p.slug] = {
      title: decode(p.name),
      kind: decode(p.short_description).split(". ")[0].slice(0, 60) || "SNASK shop",
      price,
      url: p.permalink,
      img: (p.images && p.images[0] && (p.images[0].thumbnail || p.images[0].src)) || "",
    };
  }
  if (!Object.keys(shop).length) throw new Error("empty shop");
  return shop;
}

// New cases on the Our Work page that the static list doesn't know yet.
async function liveCases(known) {
  const html = await getText("https://snask.com/our-work/");
  const added = {};
  for (const m of html.matchAll(/href="https:\/\/snask\.com\/case\/([a-z0-9-]+)\/?"/g)) {
    const slug = m[1];
    const url = `https://snask.com/case/${slug}/`;
    if (known.has(url) || added[slug]) continue;
    added[slug] = { title: titleFromSlug(slug), client: "", kind: "Case", blurb: "", url, img: "" };
  }
  return added;
}

export async function getCatalog() {
  if (cache.data && Date.now() - cache.at < SIX_HOURS) return cache.data;
  const data = { case: { ...STATIC_CATALOG.case }, shop: { ...STATIC_CATALOG.shop } };
  const known = new Set(Object.values(data.case).map((c) => c.url));
  const [shop, cases] = await Promise.allSettled([liveShop(), liveCases(known)]);
  if (shop.status === "fulfilled") data.shop = shop.value;
  else console.warn("live shop unavailable, using static list:", shop.reason?.message);
  if (cases.status === "fulfilled") Object.assign(data.case, cases.value);
  else console.warn("live cases unavailable, using static list:", cases.reason?.message);
  cache = { at: Date.now(), data };
  return data;
}

export function catalogPrompt(catalog) {
  const lines = [RICH_RULES.trim(), "", "Project cards (ID: client, title, what it is):"];
  for (const [id, c] of Object.entries(catalog.case)) lines.push(`- ${id}: ${c.client ? c.client + ", " : ""}"${c.title}" (${c.kind})${c.blurb ? ". " + c.blurb : ""}`);
  lines.push("", "Shop cards (ID: product, price as listed on the shop right now):");
  for (const [id, s] of Object.entries(catalog.shop)) lines.push(`- ${id}: ${s.title}${s.price ? ", " + s.price : ""}`);
  return lines.join("\n");
}

export { PERSONA_BASE, MODES };

const visitors = new Map();
export function allow(req, perTenMinutes) {
  const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "unknown";
  const now = Date.now();
  const recent = (visitors.get(ip) || []).filter((t) => now - t < 10 * 60_000);
  if (recent.length >= perTenMinutes) return false;
  recent.push(now);
  visitors.set(ip, recent);
  return true;
}

export function sameSite(req) {
  const origin = req.headers.origin;
  return !origin || new URL(origin).host === req.headers.host;
}

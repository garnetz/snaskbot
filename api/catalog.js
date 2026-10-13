// GET /api/catalog: the project and shop cards the chat page can render.
import { getCatalog } from "./_lib.js";

export default async function handler(req, res) {
  const catalog = await getCatalog();
  res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
  res.status(200).json(catalog);
}

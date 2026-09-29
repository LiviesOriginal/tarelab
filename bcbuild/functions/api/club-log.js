// Cloudflare Pages Function: /api/club-log
const ALLOWED_STATUS = new Set(["Currently Reading", "Reading Next", "On the Radar", "Read Together"]);
const ALLOWED_READER = new Set(["XY", "ZZ", "Shared"]);
const MAX_ENTRIES = 999;
const MAX = { book_title: 200, author: 200, notes: 4000, quote: 1000, reflection: 4000 };

const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }
});

function validateString(value, field, maxLength, required = false) {
  if (typeof value !== "string") return `${field} must be a string`;
  const trimmed = value.trim();
  if (required && !trimmed) return `${field} is required`;
  if (trimmed.length > maxLength) return `${field} is too long`;
  return null;
}

function validateEntry(body) {
  for (const [field, maxLength] of [["book_title", MAX.book_title], ["author", MAX.author]]) {
    const error = validateString(body[field], field, maxLength, true);
    if (error) return error;
  }
  for (const field of ["notes", "quote", "reflection"]) {
    const error = validateString(body[field] ?? "", field, MAX[field]);
    if (error) return error;
  }
  if (!ALLOWED_STATUS.has(body.status)) return "Invalid status";
  if (!ALLOWED_READER.has(body.reader)) return "Invalid reader";
  if (body.rating !== null && body.rating !== undefined && body.rating !== "") {
    const rating = Number(body.rating);
    if (!Number.isFinite(rating) || rating < 0 || rating > 5 || Math.round(rating * 2) !== rating * 2) {
      return "Rating must be between 0 and 5 in 0.5 increments";
    }
  }
  return null;
}

async function listEntries(env) {
  const { results } = await env.DB.prepare(`
    SELECT id, book_title, author, status, reader, notes, rating, quote, reflection, created_at, updated_at
    FROM club_log ORDER BY updated_at DESC
  `).all();
  return json(results);
}

async function createEntry(request, env) {
  const count = await env.DB.prepare("SELECT COUNT(*) AS count FROM club_log").first();
  if (Number(count?.count || 0) >= MAX_ENTRIES) return json({ error: "The club log has reached its entry limit." }, 409);

  let body;
  try { body = await request.json(); } catch (_) { return json({ error: "Request body must be valid JSON." }, 400); }
  if (typeof body.website === "string" && body.website.trim()) return json({ error: "Invalid submission." }, 400);

  const validationError = validateEntry(body);
  if (validationError) return json({ error: validationError }, 400);

  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  await env.DB.prepare(`
    INSERT INTO club_log (id, book_title, author, status, reader, notes, rating, quote, reflection, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id, body.book_title.trim(), body.author.trim(), body.status, body.reader,
    (body.notes || "").trim(), body.rating === null || body.rating === undefined || body.rating === "" ? null : Number(body.rating),
    (body.quote || "").trim(), (body.reflection || "").trim(), now, now
  ).run();

  const created = await env.DB.prepare(`
    SELECT id, book_title, author, status, reader, notes, rating, quote, reflection, created_at, updated_at
    FROM club_log WHERE id = ?
  `).bind(id).first();
  return json(created, 201);
}

/* DELETE is implemented in functions/api/club-log/[id].js. */
async function deleteEntry(request, env, id) {
  const auth = request.headers.get("Authorization") || "";
  if (!env.ADMIN_API_KEY || auth !== `Bearer ${env.ADMIN_API_KEY}`) return json({ error: "Unauthorized" }, 401);
  const result = await env.DB.prepare("DELETE FROM club_log WHERE id = ?").bind(id).run();
  if (!result.meta?.changes) return json({ error: "Entry not found" }, 404);
  return new Response(null, { status: 204 });
}

export async function onRequest(context) {
  const { request, env, params } = context;
  const url = new URL(request.url);
  if (!url.pathname.startsWith("/api/club-log")) return json({ error: "Not found" }, 404);
  if (request.method === "GET" && url.pathname === "/api/club-log") return listEntries(env);
  if (request.method === "POST" && url.pathname === "/api/club-log") return createEntry(request, env);
  return json({ error: "Method not allowed" }, 405);
}

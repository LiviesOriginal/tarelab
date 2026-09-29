// Cloudflare Pages Function: /api/club-log/:id
export async function onRequestDelete(context) {
  const { request, env, params } = context;
  const auth = request.headers.get("Authorization") || "";

  // ADMIN_API_KEY is a Cloudflare secret; never put it in browser code.
  if (!env.ADMIN_API_KEY || auth !== `Bearer ${env.ADMIN_API_KEY}`) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json; charset=utf-8" }
    });
  }

  const id = params.id;
  if (!id) {
    return new Response(JSON.stringify({ error: "Missing entry ID" }), {
      status: 400,
      headers: { "Content-Type": "application/json; charset=utf-8" }
    });
  }

  const result = await env.DB.prepare("DELETE FROM club_log WHERE id = ?").bind(id).run();
  if (!result.meta?.changes) {
    return new Response(JSON.stringify({ error: "Entry not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json; charset=utf-8" }
    });
  }

  return new Response(null, { status: 204 });
}

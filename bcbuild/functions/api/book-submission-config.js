const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  }
});

export async function onRequestGet({ env }) {
  if (!env.TURNSTILE_SITE_KEY) {
    return json({ error: "Book submissions are not configured." }, 503);
  }
  return json({ siteKey: env.TURNSTILE_SITE_KEY });
}

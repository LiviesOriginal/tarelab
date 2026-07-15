/**
 * Group Board API — Cloudflare Pages Function.
 *
 * GET  /api/board   -> { links: [...], events: [...] }
 * POST /api/board   -> { action: "...", ...payload }
 *
 * Bindings expected:
 *   DB              D1 database (see schema.sql)
 *   BOARD_PASSCODE  optional secret. If set, every request must send a
 *                   matching `x-board-pass` header. If unset, the board is
 *                   open to anyone with the URL.
 */

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });

const bad = (msg, status = 400) => json({ error: msg }, status);

/** Constant-time-ish compare so we don't leak the passcode by timing. */
function sameSecret(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function guard(request, env) {
  const required = env.BOARD_PASSCODE;
  if (!required) return null; // open board
  const given = request.headers.get("x-board-pass") || "";
  if (!sameSecret(given, required)) return bad("passcode", 401);
  return null;
}

const str = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");

function cleanUrl(v) {
  let u = str(v, 2000);
  if (!u) return "";
  if (!/^https?:\/\//i.test(u)) u = "https://" + u;
  try {
    const p = new URL(u);
    return p.protocol === "http:" || p.protocol === "https:" ? p.href : "";
  } catch {
    return "";
  }
}

const isDay = (v) => /^\d{4}-\d{2}-\d{2}$/.test(v);
const isTime = (v) => v === "" || /^\d{2}:\d{2}$/.test(v);

/* ------------------------------- read ------------------------------- */

async function readBoard(env) {
  const [links, events, rsvps] = await env.DB.batch([
    env.DB.prepare("SELECT * FROM links ORDER BY created_at DESC LIMIT 500"),
    env.DB.prepare("SELECT * FROM events ORDER BY day ASC, at ASC LIMIT 500"),
    env.DB.prepare("SELECT * FROM rsvps"),
  ]);

  const going = new Map();
  for (const r of rsvps.results) {
    if (!going.has(r.event_id)) going.set(r.event_id, []);
    going.get(r.event_id).push(r.name);
  }

  return {
    links: links.results.map((l) => ({
      id: l.id,
      url: l.url,
      title: l.title || "",
      note: l.note || "",
      by: l.author || "",
      ts: l.created_at,
    })),
    events: events.results.map((e) => ({
      id: e.id,
      title: e.title,
      date: e.day,
      time: e.at || "",
      place: e.place || "",
      note: e.note || "",
      by: e.author || "",
      ts: e.created_at,
      going: (going.get(e.id) || []).sort(),
    })),
  };
}

export async function onRequestGet({ request, env }) {
  const blocked = guard(request, env);
  if (blocked) return blocked;
  try {
    return json(await readBoard(env));
  } catch (err) {
    return bad("read failed: " + err.message, 500);
  }
}

/* ------------------------------ write ------------------------------- */

export async function onRequestPost({ request, env }) {
  const blocked = guard(request, env);
  if (blocked) return blocked;

  let body;
  try {
    body = await request.json();
  } catch {
    return bad("bad json");
  }

  const who = str(body.by, 24);
  const now = Date.now();

  try {
    switch (body.action) {
      case "add_link": {
        const url = cleanUrl(body.url);
        if (!url) return bad("that isn't a valid link");
        await env.DB.prepare(
          "INSERT INTO links (id, url, title, note, author, created_at) VALUES (?, ?, ?, ?, ?, ?)"
        )
          .bind(
            crypto.randomUUID(),
            url,
            str(body.title, 120),
            str(body.note, 400),
            who,
            now
          )
          .run();
        break;
      }

      case "add_event": {
        const title = str(body.title, 120);
        const day = str(body.date, 10);
        const at = str(body.time, 5);
        if (!title) return bad("the event needs a name");
        if (!isDay(day)) return bad("the event needs a date");
        if (!isTime(at)) return bad("bad time");

        const id = crypto.randomUUID();
        const stmts = [
          env.DB.prepare(
            "INSERT INTO events (id, title, day, at, place, note, author, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
          ).bind(
            id,
            title,
            day,
            at,
            str(body.place, 80),
            str(body.note, 400),
            who,
            now
          ),
        ];
        // Whoever adds an event is in it by default.
        if (who) {
          stmts.push(
            env.DB.prepare(
              "INSERT OR IGNORE INTO rsvps (event_id, name) VALUES (?, ?)"
            ).bind(id, who)
          );
        }
        await env.DB.batch(stmts);
        break;
      }

      case "toggle_rsvp": {
        const id = str(body.id, 40);
        if (!id || !who) return bad("missing event or name");
        const existing = await env.DB.prepare(
          "SELECT 1 FROM rsvps WHERE event_id = ? AND name = ?"
        )
          .bind(id, who)
          .first();
        if (existing) {
          await env.DB.prepare(
            "DELETE FROM rsvps WHERE event_id = ? AND name = ?"
          )
            .bind(id, who)
            .run();
        } else {
          await env.DB.prepare(
            "INSERT OR IGNORE INTO rsvps (event_id, name) VALUES (?, ?)"
          )
            .bind(id, who)
            .run();
        }
        break;
      }

      case "remove_link": {
        const id = str(body.id, 40);
        if (!id) return bad("missing id");
        await env.DB.prepare("DELETE FROM links WHERE id = ?").bind(id).run();
        break;
      }

      case "remove_event": {
        const id = str(body.id, 40);
        if (!id) return bad("missing id");
        await env.DB.batch([
          env.DB.prepare("DELETE FROM rsvps WHERE event_id = ?").bind(id),
          env.DB.prepare("DELETE FROM events WHERE id = ?").bind(id),
        ]);
        break;
      }

      default:
        return bad("unknown action");
    }

    // Hand back the whole board so the client never has to guess at state.
    return json(await readBoard(env));
  } catch (err) {
    return bad("write failed: " + err.message, 500);
  }
}

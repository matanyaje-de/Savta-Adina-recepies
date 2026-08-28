/* Cloudflare Pages Function — /api/comments
   GET  ?recipe=<id>  → { comments: [{ id, name, text, created_at }] }
   POST { recipe, name, text, website }  → 201 { comment: { ... } }

   הפונקציה יושבת על אותו דומיין כמו האתר, ולכן אין כאן CORS.
   השדה website הוא מלכודת לבוטים: אדם לא רואה אותו ולא ממלא אותו. */

/* להפעלת מודרציה: לשנות ל-false. תגובות חדשות יישמרו עם approved = 0
   ולא יוצגו עד עדכון ידני ב-D1. אין צורך במיגרציה. */
const AUTO_APPROVE = true;

const NAME_MAX = 40;
const TEXT_MAX = 1000;
const MAX_LIST = 200;
const MAX_PER_MINUTE = 3;
const MAX_PER_HOUR = 15;

export async function onRequestGet(context) {
  const recipeId = parseRecipeId(new URL(context.request.url).searchParams.get("recipe"));
  if (recipeId === null) {
    return json({ error: "invalid_recipe" }, 400);
  }

  const query = await context.env.DB.prepare(
    "SELECT id, name, text, created_at FROM comments" +
      " WHERE recipe_id = ?1 AND approved = 1" +
      " ORDER BY created_at ASC, id ASC LIMIT ?2"
  )
    .bind(recipeId, MAX_LIST)
    .all();

  return json({ comments: query.results || [] });
}

export async function onRequestPost(context) {
  const request = context.request;
  const db = context.env.DB;

  let payload;
  try {
    payload = await request.json();
  } catch (error) {
    return json({ error: "invalid_body" }, 400);
  }

  const recipeId = parseRecipeId(payload.recipe);
  if (recipeId === null) {
    return json({ error: "invalid_recipe" }, 400);
  }

  /* בוט מילא את המלכודת: מדווחים הצלחה ולא שומרים כלום */
  if (typeof payload.website === "string" && payload.website.trim() !== "") {
    return json({ comment: null }, 201);
  }

  const name = typeof payload.name === "string" ? payload.name.trim() : "";
  const text = typeof payload.text === "string" ? payload.text.trim() : "";
  if (name === "" || text === "") {
    return json({ error: "empty_field" }, 400);
  }
  if (name.length > NAME_MAX) {
    return json({ error: "name_too_long" }, 400);
  }
  if (text.length > TEXT_MAX) {
    return json({ error: "text_too_long" }, 400);
  }

  const now = Math.floor(Date.now() / 1000);
  const ipHash = await hashIp(
    request.headers.get("CF-Connecting-IP") || "",
    context.env.IP_SALT || ""
  );

  const recent = await db
    .prepare(
      "SELECT COUNT(*) AS hour_count," +
        " SUM(CASE WHEN created_at > ?2 THEN 1 ELSE 0 END) AS minute_count" +
        " FROM comments WHERE ip_hash = ?1 AND created_at > ?3"
    )
    .bind(ipHash, now - 60, now - 3600)
    .first();

  if (recent && (recent.minute_count >= MAX_PER_MINUTE || recent.hour_count >= MAX_PER_HOUR)) {
    return json({ error: "rate_limited" }, 429);
  }

  const inserted = await db
    .prepare(
      "INSERT INTO comments (recipe_id, name, text, created_at, ip_hash, approved)" +
        " VALUES (?1, ?2, ?3, ?4, ?5, ?6)"
    )
    .bind(recipeId, name, text, now, ipHash, AUTO_APPROVE ? 1 : 0)
    .run();

  if (!AUTO_APPROVE) {
    return json({ comment: null, pending: true }, 201);
  }

  return json(
    {
      comment: {
        id: inserted.meta.last_row_id,
        name: name,
        text: text,
        created_at: now
      }
    },
    201
  );
}

function parseRecipeId(value) {
  const id = Number(value);
  if (!Number.isInteger(id) || id < 1 || id > 100000) {
    return null;
  }
  return id;
}

async function hashIp(ip, salt) {
  const bytes = new TextEncoder().encode(salt + "|" + ip);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)]
    .map(function (byte) {
      return byte.toString(16).padStart(2, "0");
    })
    .join("");
}

function json(data, status) {
  return new Response(JSON.stringify(data), {
    status: status || 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}

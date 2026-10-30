async function getUser(request, env) {
  const auth = request.headers.get("Authorization") || "";
  const token = auth.replace("Bearer ", "");
  if (!token) return null;
  return await env.DB.prepare(
    "SELECT users.id, users.username FROM sessions JOIN users ON users.id = sessions.user_id WHERE sessions.token = ?"
  )
    .bind(token)
    .first();
}

export async function onRequestGet({ request, env }) {
  const user = await getUser(request, env);
  if (!user) return Response.json({ error: "Не авторизован" }, { status: 401 });

  const { results } = await env.DB.prepare(
    "SELECT messages.id, messages.text, messages.created_at, users.username FROM messages JOIN users ON users.id = messages.sender_id ORDER BY messages.id DESC LIMIT 50"
  ).all();

  return Response.json({ ok: true, messages: results.reverse() });
}

export async function onRequestPost({ request, env }) {
  const user = await getUser(request, env);
  if (!user) return Response.json({ error: "Не авторизован" }, { status: 401 });

  const { text } = await request.json().catch(() => ({}));
  if (typeof text !== "string" || !text.trim() || text.length > 1000) {
    return Response.json({ error: "Пустое или слишком длинное" }, { status: 400 });
  }

  await env.DB.prepare(
    "INSERT INTO messages (sender_id, text, created_at) VALUES (?, ?, ?)"
  )
    .bind(user.id, text.trim(), Date.now())
    .run();

  return Response.json({ ok: true });
}

// конец

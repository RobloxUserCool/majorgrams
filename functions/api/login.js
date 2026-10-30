const enc = new TextEncoder();
const hex = (b) =>
  [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
const fromHex = (h) =>
  new Uint8Array(h.match(/.{2}/g).map((x) => parseInt(x, 16)));

export async function onRequestPost({ request, env }) {
  const { username, password } = await request.json().catch(() => ({}));

  if (typeof username !== "string" || typeof password !== "string") {
    return Response.json({ error: "Введи ник и пароль" }, { status: 400 });
  }

  const user = await env.DB.prepare(
    "SELECT id, password_hash, salt FROM users WHERE username = ?"
  )
    .bind(username)
    .first();

  const fail = () =>
    Response.json({ error: "Неверный ник или пароль" }, { status: 401 });

  if (!user) return fail();

  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: fromHex(user.salt),
      iterations: 100000,
      hash: "SHA-256",
    },
    key,
    256
  );

  if (hex(bits) !== user.password_hash) return fail();

  const token = hex(crypto.getRandomValues(new Uint8Array(32)));
  await env.DB.prepare(
    "INSERT INTO sessions (token, user_id, created_at) VALUES (?, ?, ?)"
  )
    .bind(token, user.id, Date.now())
    .run();

  return Response.json({ ok: true, token, username });
    }

const enc = new TextEncoder();
const hex = (b) =>
  [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");

export async function onRequestPost({ request, env }) {
  const { username, password } = await request.json().catch(() => ({}));

  if (
    typeof username !== "string" ||
    typeof password !== "string" ||
    username.length < 3 ||
    username.length > 20 ||
    password.length < 6
  ) {
    return Response.json(
      { error: "Ник от 3 до 20 символов, пароль от 6" },
      { status: 400 }
    );
  }

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    key,
    256
  );

  try {
    await env.DB.prepare(
      "INSERT INTO users (username, password_hash, salt, created_at) VALUES (?, ?, ?, ?)"
    )
      .bind(username, hex(bits), hex(salt), Date.now())
      .run();
  } catch (e) {
    return Response.json({ error: "Ник занят" }, { status: 409 });
  }

  return Response.json({ ok: true });
      }

const $ = (id) => document.getElementById(id);
let timer = null;

function token() {
  try { return localStorage.getItem("mg_token"); } catch (e) { return null; }
}

function showAuth() {
  clearInterval(timer);
  $("app").style.display = "none";
  $("auth").style.display = "block";
}

function showApp() {
  $("auth").style.display = "none";
  $("app").style.display = "block";
  load();
  clearInterval(timer);
  timer = setInterval(load, 3000);
}

async function load() {
  try {
    const r = await fetch("/api/messages", {
      headers: { Authorization: "Bearer " + token() },
    });
    if (r.status === 401) return showAuth();
    const d = await r.json();
    const list = $("list");
    const atBottom = list.scrollTop + list.clientHeight >= list.scrollHeight - 30;
    list.innerHTML = "";
    for (const m of d.messages) {
      const row = document.createElement("div");
      row.className = "m";
      const name = document.createElement("b");
      name.textContent = m.username + ": ";
      row.appendChild(name);
      row.appendChild(document.createTextNode(m.text));
      list.appendChild(row);
    }
    if (atBottom) list.scrollTop = list.scrollHeight;
  } catch (e) {}
}

async function send(path) {
  $("msg").textContent = "Отправляю...";
  try {
    const r = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: $("u").value, password: $("p").value }),
    });
    return await r.json();
  } catch (e) {
    return { error: "Ошибка связи с сервером" };
  }
}

$("reg").onclick = async () => {
  const d = await send("/api/register");
  $("msg").textContent = d.ok ? "Готово, теперь нажми «Войти»" : d.error;
};

$("login").onclick = async () => {
  const d = await send("/api/login");
  if (d.ok) {
    try { localStorage.setItem("mg_token", d.token); } catch (e) {}
    $("msg").textContent = "";
    showApp();
  } else {
    $("msg").textContent = d.error;
  }
};

$("send").onclick = async () => {
  const text = $("t").value.trim();
  if (!text) return;
  $("t").value = "";
  await fetch("/api/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token(),
    },
    body: JSON.stringify({ text }),
  });
  await load();
  $("list").scrollTop = $("list").scrollHeight;
};

$("t").onkeydown = (e) => {
  if (e.key === "Enter") $("send").onclick();
};

$("logout").onclick = () => {
  try { localStorage.removeItem("mg_token"); } catch (e) {}
  showAuth();
};

if (token()) showApp();

// конец

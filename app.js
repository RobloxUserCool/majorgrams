const $ = (id) => document.getElementById(id);

function showApp(name) {
  $("auth").style.display = "none";
  $("app").style.display = "block";
  $("hello").textContent = "Ты вошёл как " + name;
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
    try {
      localStorage.setItem("mg_token", d.token);
      localStorage.setItem("mg_user", d.username);
    } catch (e) {}
    $("msg").textContent = "";
    showApp(d.username);
  } else {
    $("msg").textContent = d.error;
  }
};

$("logout").onclick = () => {
  try {
    localStorage.removeItem("mg_token");
    localStorage.removeItem("mg_user");
  } catch (e) {}
  $("app").style.display = "none";
  $("auth").style.display = "block";
};

try {
  if (localStorage.getItem("mg_token")) {
    showApp(localStorage.getItem("mg_user"));
  }
} catch (e) {}

// конец

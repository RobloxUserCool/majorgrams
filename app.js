const $ = (id) => document.getElementById(id);
const titles = {
  chats: "Чаты", chat: "Общий чат", contacts: "Контакты",
  settings: "Настройки", profile: "Профиль",
};
let current = "chats";
let timer = null;

function store(k, v) {
  try {
    if (v === null) localStorage.removeItem(k);
    else if (v !== undefined) localStorage.setItem(k, v);
    else return localStorage.getItem(k) || "";
  } catch (e) {}
  return "";
}
const token = () => store("mg_token");
const myName = () => store("mg_user");

function show(p) {
  current = p;
  document.querySelectorAll(".page").forEach((el) => {
    el.classList.remove("on");
    el.style.display = "";
  });
  const pg = $("pg-" + p);
  pg.classList.add("on");
  if (p === "chat") {
    pg.style.display = "flex";
    pg.style.flexDirection = "column";
  }
  $("title").textContent = titles[p];
  $("back").style.display = p === "chat" ? "block" : "none";
  const tab = p === "chat" ? "chats" : p;
  document.querySelectorAll("#nav button").forEach((b) => {
    b.classList.toggle("on", b.dataset.p === tab);
  });
  if (p === "profile") {
    $("pname").textContent = myName();
    $("bigava").textContent = myName().charAt(0).toUpperCase();
  }
  if (p === "chat") load(true);
}

function showAuth() {
  clearInterval(timer);
  $("app").style.display = "none";
  $("auth").style.display = "flex";
}

function showApp() {
  $("auth").style.display = "none";
  $("app").style.display = "flex";
  show("chats");
  clearInterval(timer);
  timer = setInterval(() => {
    if (current === "chat") load(false);
  }, 3000);
}

async function load(force) {
  try {
    const r = await fetch("/api/messages", {

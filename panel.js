const $ = id => document.getElementById(id);
const DEFAULT_SITES = ["tiktok.com","instagram.com","facebook.com","x.com","twitter.com","reddit.com","netflix.com","twitch.tv","kick.com","disneyplus.com"];
let game, settings, tickHandle = null, lastUiTick = Date.now();

async function load() {
  const data = await chrome.storage.local.get(["game","settings","currentTab"]);
  game = data.game || {points:0,streak:0,lastStudyDate:"",buddy:"dog",accessories:[],session:null};
  settings = data.settings || {distractingSites:DEFAULT_SITES,graceSeconds:10,healthLossPerMinute:8};
  $("sites").value = (settings.distractingSites || DEFAULT_SITES).join("\n");
  render(data.currentTab);
  if (game.session?.running) startUiTicker();
}
function session() { return game.session; }
function render(tab) {
  $("points").textContent = game.points || 0;
  $("streak").textContent = `${game.streak || 0} day${game.streak === 1 ? "" : "s"}`;
  const s = session();
  $("bigpet").textContent = game.buddy === "fox" ? "🦊" : "🐶";
  $("mood").textContent = !s ? "Ready to focus?" : s.failed ? "Your buddy needs a cuddle" : s.completed ? "You did it! 🎉" : s.health < 50 ? "A little worried…" : "You're doing great!";
  $("message").textContent = tab?.distracted ? "This site is on your distraction list. Your buddy needs you!" : "One little step at a time. You've got this.";
  $("healthText").textContent = `${s?.health ?? 100} / 100`;
  $("healthBar").style.width = `${s?.health ?? 100}%`;
  $("healthBar").style.background = (s?.health ?? 100) < 30 ? "#ed8d9c" : (s?.health ?? 100) < 60 ? "#f1c06b" : "linear-gradient(90deg,#74d9b0,#4abf99)";
  $("state").textContent = s?.running ? "Focusing" : s?.completed ? "Complete" : s?.failed ? "Session ended" : "Ready";
  $("start").disabled = !!s?.running;
  $("pause").disabled = !s?.running;
  $("pause").textContent = s?.paused ? "▶ Resume" : "Ⅱ Pause";
  $("focused").textContent = `${Math.floor((s?.focusedSeconds || 0)/60)} min`;
  if (s?.running) {
    const seconds = Math.max(0, Math.ceil((s.endAt - Date.now())/1000));
    $("timer").textContent = `${String(Math.floor(seconds/60)).padStart(2,"0")}:${String(seconds%60).padStart(2,"0")}`;
  } else if (s?.paused) {
    const seconds = Math.max(0, s.remainingSeconds || 0);
    $("timer").textContent = `${String(Math.floor(seconds/60)).padStart(2,"0")}:${String(seconds%60).padStart(2,"0")}`;
  } else if (s?.completed) $("timer").textContent = "Done!";
  else $("timer").textContent = `${String(Number($("minutes").value)||25).padStart(2,"0")}:00`;
}
function startUiTicker() {
  if (tickHandle) clearInterval(tickHandle);
  tickHandle = setInterval(async () => {
    const data = await chrome.storage.local.get(["game","currentTab"]);
    game = data.game || game;
    render(data.currentTab);
    if (!game.session?.running) { clearInterval(tickHandle); tickHandle = null; }
  }, 1000);
}
$("start").addEventListener("click", async () => {
  const minutes = Math.min(180, Math.max(1, Number($("minutes").value) || 25));
  const now = Date.now();
  game.session = {running:true,paused:false,completed:false,failed:false,health:100,durationSeconds:minutes*60,endAt:now+minutes*60000,lastTick:now,focusedSeconds:0,distractedSeconds:0,earned:0};
  await chrome.storage.local.set({game});
  startUiTicker(); render();
});
$("pause").addEventListener("click", async () => {
  const s = session(); if (!s) return;
  if (s.running) {
    s.remainingSeconds = Math.max(0, Math.ceil((s.endAt-Date.now())/1000));
    s.running = false; s.paused = true; s.lastTick = Date.now();
    await chrome.alarms.clear("focus-friend-tick");
  } else if (s.paused) {
    s.running = true; s.paused = false; s.endAt = Date.now() + s.remainingSeconds*1000; s.lastTick = Date.now();
    chrome.alarms.create("focus-friend-tick", {periodInMinutes:0.1}); startUiTicker();
  }
  await chrome.storage.local.set({game}); render();
});
$("reset").addEventListener("click", async () => {
  if (tickHandle) clearInterval(tickHandle);
  game.session = null; await chrome.storage.local.set({game}); render();
  chrome.alarms.clear("focus-friend-tick");
});
$("saveSites").addEventListener("click", async () => {
  const list = $("sites").value.split(/\n|,/).map(x=>x.trim().toLowerCase().replace(/^https?:\/\//,"").replace(/^www\./,"").split("/")[0]).filter(Boolean);
  settings.distractingSites = [...new Set(list)];
  await chrome.storage.local.set({settings});
  $("shopMessage").textContent = "Distraction list saved! 💗";
});
document.querySelectorAll(".item").forEach(button => button.addEventListener("click", async () => {
  const item = button.dataset.item, cost = Number(button.dataset.cost);
  const s = session();
  if (item === "Treat") {
    if ((game.points||0) < cost) { $("shopMessage").textContent = "You need a few more points first."; return; }
    game.points -= cost;
    if (s && (s.running || s.paused)) s.health = Math.min(100, (s.health||100)+20);
    else { $("shopMessage").textContent = "Treat bought! Start a session to use its health boost."; game.accessories = [...(game.accessories||[]), "Treat"]; }
  } else if ((game.points||0) < cost) {
    $("shopMessage").textContent = `You need ${cost-(game.points||0)} more points for ${item}.`; return;
  } else if ((game.accessories||[]).includes(item)) {
    $("shopMessage").textContent = `You already own ${item}!`; return;
  } else {
    game.points -= cost; game.accessories = [...(game.accessories||[]), item];
    if (item === "Fox buddy") game.buddy = "fox";
    $("shopMessage").textContent = `${item} unlocked! ✨`;
  }
  await chrome.storage.local.set({game}); render();
}));
chrome.storage.onChanged.addListener(changes => { if (changes.game || changes.currentTab) load(); });
load();
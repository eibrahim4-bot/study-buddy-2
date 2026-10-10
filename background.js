const DISTRACTING_DEFAULTS = [
  "tiktok.com", "instagram.com", "facebook.com", "x.com", "twitter.com",
  "reddit.com", "netflix.com", "twitch.tv", "kick.com", "disneyplus.com"
];

chrome.runtime.onInstalled.addListener(async () => {
  const data = await chrome.storage.local.get(["settings", "game"]);
  if (!data.settings) {
    await chrome.storage.local.set({
      settings: { distractingSites: DISTRACTING_DEFAULTS, graceSeconds: 10, healthLossPerMinute: 8 },
      game: { points: 0, streak: 0, lastStudyDate: "", buddy: "dog", accessories: [], session: null }
    });
  }
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});
});

chrome.tabs.onActivated.addListener(({tabId}) => checkTab(tabId));
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" || changeInfo.url) checkTab(tabId, tab);
});

async function checkTab(tabId, tabArg) {
  let tab = tabArg;
  if (!tab || !tab.url) {
    try { tab = await chrome.tabs.get(tabId); } catch { return; }
  }
  if (!tab.url || !/^https?:/.test(tab.url)) return;
  const host = new URL(tab.url).hostname.toLowerCase().replace(/^www\./, "");
  const { settings = {}, game = {} } = await chrome.storage.local.get(["settings", "game"]);
  const sites = settings.distractingSites || DISTRACTING_DEFAULTS;
  const distracted = sites.some(site => host === site || host.endsWith("." + site));
  await chrome.storage.local.set({ currentTab: { host, distracted, checkedAt: Date.now() } });
  if (distracted && game.session?.running) {
    chrome.notifications.create("focus-friend-warning", {
      type: "basic",
      iconUrl: "icons/icon128.png",
      title: "Your buddy is getting distracted!",
      message: "Stay on track, or your buddy's health will go down.",
      priority: 1
    }).catch(() => {});
  }
}

chrome.alarms.onAlarm.addListener(async alarm => {
  if (alarm.name !== "focus-friend-tick") return;
  const { game = {}, currentTab = {}, settings = {} } = await chrome.storage.local.get(["game", "currentTab", "settings"]);
  const session = game.session;
  if (!session?.running) return;
  const now = Date.now();
  const elapsed = Math.max(0, Math.floor((now - (session.lastTick || now)) / 1000));
  session.lastTick = now;
  if (currentTab.distracted) {
    session.distractedSeconds = (session.distractedSeconds || 0) + elapsed;
    const grace = (settings.graceSeconds ?? 10);
    const previousOverGrace = Math.max(0, (session.distractedSeconds - elapsed) - grace);
    const currentOverGrace = Math.max(0, session.distractedSeconds - grace);
    const newLoss = Math.floor(currentOverGrace / 60 * (settings.healthLossPerMinute || 8)) -
                    Math.floor(previousOverGrace / 60 * (settings.healthLossPerMinute || 8));
    session.health = Math.max(0, session.health - Math.max(0, newLoss));
  } else {
    session.focusedSeconds = (session.focusedSeconds || 0) + elapsed;
  }
  const remaining = Math.max(0, session.endAt - now);
  if (session.health <= 0) {
    session.running = false;
    session.failed = true;
    session.lastTick = now;
    await chrome.storage.local.set({ game: { ...game, session } });
    chrome.notifications.create("focus-friend-fainted", {
      type: "basic", iconUrl: "icons/icon128.png", title: "Your buddy needs a break",
      message: "This session ended before completion. Your saved points and items are safe."
    }).catch(() => {});
    chrome.alarms.clear("focus-friend-tick");
    return;
  }
  if (remaining <= 0) {
    session.running = false;
    session.completed = true;
    const minutes = Math.floor((session.focusedSeconds || 0) / 60);
    const bonus = Math.round(minutes * session.health / 200);
    const earned = minutes + bonus;
    game.points = (game.points || 0) + earned;
    const today = new Date().toLocaleDateString("en-CA");
    if (minutes >= 15) {
      const yesterday = new Date(Date.now() - 86400000).toLocaleDateString("en-CA");
      game.streak = game.lastStudyDate === yesterday ? (game.streak || 0) + 1 :
        (game.lastStudyDate === today ? (game.streak || 1) : 1);
      game.lastStudyDate = today;
    }
    session.earned = earned;
    await chrome.storage.local.set({ game: { ...game, session } });
    chrome.notifications.create("focus-friend-complete", {
      type: "basic", iconUrl: "icons/icon128.png", title: "Study session complete! 🎉",
      message: `You earned ${earned} points. Your buddy is proud of you!`
    }).catch(() => {});
    chrome.alarms.clear("focus-friend-tick");
    return;
  }
  await chrome.storage.local.set({ game: { ...game, session } });
});
chrome.alarms.create("focus-friend-tick", { periodInMinutes: 0.1 });

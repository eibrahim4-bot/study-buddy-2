(() => {
  if (window.top !== window) return;
  if (document.getElementById("focus-friend-pet")) return;

  const root = document.createElement("div");
  root.id = "focus-friend-pet";
  root.innerHTML = `
    <button class="ff-pet" title="Open Focus Friend" aria-label="Open Focus Friend">
      <span class="ff-spark">✦</span>
      <svg class="ff-dog" viewBox="0 0 120 120" role="img" aria-label="Cute dog buddy">
        <path class="ff-tail" d="M83 76 Q112 68 103 48" fill="none" stroke="#B87835" stroke-width="12" stroke-linecap="round"/>
        <ellipse cx="60" cy="75" rx="29" ry="31" fill="#F2BD69"/>
        <ellipse cx="36" cy="45" rx="13" ry="22" fill="#C77A35" transform="rotate(-24 36 45)"/>
        <ellipse cx="84" cy="45" rx="13" ry="22" fill="#C77A35" transform="rotate(24 84 45)"/>
        <circle cx="60" cy="48" r="31" fill="#F7C879"/>
        <ellipse cx="49" cy="47" rx="3.5" ry="5" fill="#3E2A22"/>
        <ellipse cx="71" cy="47" rx="3.5" ry="5" fill="#3E2A22"/>
        <ellipse cx="60" cy="58" rx="12" ry="9" fill="#FFF0D9"/>
        <ellipse cx="60" cy="55" rx="5" ry="4" fill="#3E2A22"/>
        <path d="M55 62 Q60 69 65 62" fill="none" stroke="#8D4C45" stroke-width="2.5" stroke-linecap="round"/>
        <ellipse cx="44" cy="58" rx="6" ry="3" fill="#F28D8D" opacity=".65"/>
        <ellipse cx="76" cy="58" rx="6" ry="3" fill="#F28D8D" opacity=".65"/>
        <ellipse cx="49" cy="99" rx="9" ry="7" fill="#E5A84F"/>
        <ellipse cx="71" cy="99" rx="9" ry="7" fill="#E5A84F"/>
        <path d="M47 26 Q60 17 73 26" fill="none" stroke="#FFF0D9" stroke-width="5" stroke-linecap="round"/>
      </svg>
      <span class="ff-heart">♥</span>
    </button>
    <div class="ff-bubble" role="status">You got this!</div>`;
  document.documentElement.appendChild(root);

  const pet = root.querySelector(".ff-pet");
  const bubble = root.querySelector(".ff-bubble");
  let dragging = false, moved = false, startX = 0, startY = 0, left = null, top = null;
  chrome.storage.local.get(["petPosition", "game", "currentTab"], data => {
    if (data.petPosition) {
      root.style.left = data.petPosition.left + "px";
      root.style.top = data.petPosition.top + "px";
      root.style.right = "auto"; root.style.bottom = "auto";
    }
    updateMood(data.game?.session?.health ?? 100, data.currentTab?.distracted ?? false);
  });
  function updateMood(health, distracted) {
    pet.classList.toggle("ff-sad", health < 50);
    pet.classList.toggle("ff-worried", distracted);
    bubble.textContent = distracted ? "Oops, a distraction! 🥺" : health < 50 ? "Let's refocus 💗" : "You got this!";
  }
  chrome.storage.onChanged.addListener(changes => {
    if (changes.game || changes.currentTab) {
      chrome.storage.local.get(["game", "currentTab"], d => updateMood(d.game?.session?.health ?? 100, d.currentTab?.distracted ?? false));
    }
  });
  pet.addEventListener("pointerdown", e => {
    dragging = true; moved = false; startX = e.clientX; startY = e.clientY;
    const rect = root.getBoundingClientRect(); left = rect.left; top = rect.top;
    pet.setPointerCapture(e.pointerId);
  });
  pet.addEventListener("pointermove", e => {
    if (!dragging) return;
    const dx = e.clientX - startX, dy = e.clientY - startY;
    if (Math.abs(dx) + Math.abs(dy) > 5) moved = true;
    if (moved) {
      root.style.left = Math.max(0, Math.min(window.innerWidth - 90, left + dx)) + "px";
      root.style.top = Math.max(0, Math.min(window.innerHeight - 110, top + dy)) + "px";
      root.style.right = "auto"; root.style.bottom = "auto";
    }
  });
  pet.addEventListener("pointerup", () => {
    dragging = false;
    if (moved) {
      const rect = root.getBoundingClientRect();
      chrome.storage.local.set({ petPosition: { left: rect.left, top: rect.top } });
    } else {
      bubble.classList.toggle("ff-show");
      chrome.runtime.sendMessage({ type: "OPEN_PANEL" });
    }
  });
})();
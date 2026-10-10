(() => {
  if (window.top !== window || document.getElementById("focus-friend-pet")) return;
  const animals = {
    chicken:"🐥", seahorse:"🪸", bear:"🐻", fox:"🦊", penguin:"🐧",
    cat:"🐈", dog:"🐕", dinosaur:"🦖", turtle:"🐢", dolphin:"🐬",
    lion:"🦁", giraffe:"🦒", elephant:"🐘", bunny:"🐇", panda:"🐼", smith:"🐾"
  };
  const root = document.createElement("div");
  root.id = "focus-friend-pet";
  root.innerHTML = `
    <div class="ff-wrap">
      <button class="ff-pet" title="Focus Friend" aria-label="Focus Friend">
        <span class="ff-spark">✦</span>
        <span class="ff-animal" aria-label="Study buddy">🐕</span>
        <span class="ff-heart">♥</span>
      </button>
      <div class="ff-health" aria-label="Buddy health"><div class="ff-health-fill"></div></div>
      <div class="ff-mood">Happy</div>
      <div class="ff-bubble" role="status"></div>
    </div>`;
  document.documentElement.appendChild(root);
  const pet=root.querySelector(".ff-pet"), animal=root.querySelector(".ff-animal");
  const bubble=root.querySelector(".ff-bubble"), healthFill=root.querySelector(".ff-health-fill");
  const moodLabel=root.querySelector(".ff-mood");
  let dragging=false,moved=false,startX=0,startY=0,left=0,top=0,distracted=false,hideBubbleTimer=null;

  function setMood(game, currentTab) {
    const s=game?.session, health=s?.health ?? 100;
    distracted=!!(currentTab?.distracted && s?.running);
    const moods = health<=0 ? ["Fainted","ff-fainted","Oh no! Let's try again 💗"] :
      distracted ? ["Worried","ff-worried","A distraction! Come back to your study task 💗"] :
      health<=20 ? ["Panicking","ff-panicking","I'm struggling! Help me refocus!"] :
      health<=45 ? ["Sad","ff-sad","Let's take a breath and get back to it"] :
      health<=70 ? ["Okay","ff-okay","Doing okay — keep going!"] :
      ["Happy","ff-happy","You're doing great!"];
    root.classList.remove("ff-happy","ff-okay","ff-sad","ff-panicking","ff-fainted","ff-worried");
    root.classList.add(moods[1]);
    moodLabel.textContent=moods[0];
    healthFill.style.width=Math.max(0,Math.min(100,health))+"%";
    healthFill.style.background=health<=20?"#ee8799":health<=45?"#f3b16e":"#71d7a9";
    if (distracted) {
      bubble.textContent=moods[2];
      bubble.classList.add("ff-show");
      if(hideBubbleTimer) clearTimeout(hideBubbleTimer);
    } else {
      bubble.textContent=moods[2];
      if(!bubble.classList.contains("ff-manual")) bubble.classList.remove("ff-show");
    }
    const selected=game?.buddy || "dog";
    animal.textContent=animals[selected] || "🐕";
    animal.setAttribute("aria-label",selected+" study buddy");
  }
  async function sync() {
    const data=await chrome.storage.local.get(["petPosition","game","currentTab"]);
    if(data.petPosition && !root.dataset.positioned) {
      root.style.left=data.petPosition.left+"px"; root.style.top=data.petPosition.top+"px";
      root.style.right="auto";root.style.bottom="auto";root.dataset.positioned="1";
    }
    setMood(data.game,data.currentTab);
  }
  sync();
  chrome.storage.onChanged.addListener(changes=>{
    if(changes.game || changes.currentTab) sync();
  });
  chrome.runtime.onMessage.addListener(message=>{
    if(message?.type==="BUDDY_CHANGED") sync();
  });
  pet.addEventListener("pointerdown",e=>{
    dragging=true;moved=false;startX=e.clientX;startY=e.clientY;
    const r=root.getBoundingClientRect();left=r.left;top=r.top;pet.setPointerCapture(e.pointerId);
  });
  pet.addEventListener("pointermove",e=>{
    if(!dragging)return;
    const dx=e.clientX-startX,dy=e.clientY-startY;
    if(Math.abs(dx)+Math.abs(dy)>5)moved=true;
    if(moved){
      root.style.left=Math.max(0,Math.min(innerWidth-84,left+dx))+"px";
      root.style.top=Math.max(0,Math.min(innerHeight-120,top+dy))+"px";
      root.style.right="auto";root.style.bottom="auto";
    }
  });
  pet.addEventListener("pointerup",()=>{
    dragging=false;
    if(moved){
      const r=root.getBoundingClientRect();
      chrome.storage.local.set({petPosition:{left:r.left,top:r.top}});
    } else {
      bubble.classList.toggle("ff-show");
      bubble.classList.toggle("ff-manual",bubble.classList.contains("ff-show"));
      if(!bubble.classList.contains("ff-show")) bubble.classList.remove("ff-manual");
      chrome.runtime.sendMessage({type:"OPEN_PANEL"}).catch(()=>{});
    }
  });
})();
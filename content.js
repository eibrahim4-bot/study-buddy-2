(() => {
  if (window.top !== window || document.getElementById("focus-friend-pet")) return;
  const animals = {
    chicken:"🐥", seahorse:"🐠", bear:"🐻", fox:"🦊", penguin:"🐧",
    cat:"🐱", dog:"🐶", dinosaur:"🦖", turtle:"🐢", dolphin:"🐬",
    lion:"🦁", giraffe:"🦒", elephant:"🐘", bunny:"🐰", panda:"🐼", smith:"🐾"
  };
  const root = document.createElement("div");
  root.id = "focus-friend-pet";
  root.innerHTML = `
    <div class="ff-bubble" role="status" aria-live="polite">You got this! 💗</div>
    <button class="ff-pet" title="Focus Friend" aria-label="Focus Friend pet">
      <span class="ff-spark">✦</span>
      <span class="ff-face" aria-hidden="true">🐶</span>
      <span class="ff-heart">♥</span>
      <span class="ff-health"><span class="ff-health-fill"></span></span>
      <span class="ff-mood">HAPPY</span>
    </button>`;
  document.documentElement.appendChild(root);
  const pet=root.querySelector(".ff-pet"), face=root.querySelector(".ff-face"),
    bubble=root.querySelector(".ff-bubble"), fill=root.querySelector(".ff-health-fill"),
    moodLabel=root.querySelector(".ff-mood");
  let gameState={health:100}, distracted=false, lastMood="";
  function getMood(health, isDistracted, session) {
    if (session?.failed || health<=0) return {name:"FAINTED",emoji:"💫",message:"Your buddy fainted! Take a breath and try again. 💗"};
    if (isDistracted) return {name:health<=25?"PANICKING":"SAD",emoji:"🥺",message:"You're distracted! Come back to your study tab to help your buddy. 💗"};
    if (health<=25) return {name:"PANICKING",emoji:"😱",message:"Your buddy is panicking! Refocus to help them."};
    if (health<=50) return {name:"SAD",emoji:"😢",message:"Your buddy feels sad. Let's get back on track."};
    if (health<=75) return {name:"OKAY",emoji:"😐",message:"Your buddy is doing okay. Keep going!"};
    return {name:"HAPPY",emoji:"😊",message:session?.running?"You're doing great! Keep focusing. ✨":"Ready when you are! Let's study. 💗"};
  }
  function render(data) {
    const game=data.game||{}, s=game.session||null;
    const health=s ? Math.max(0,Math.min(100,s.health ?? 100)) : 100;
    distracted=!!(data.currentTab?.distracted && s?.running);
    const animal=game.buddy||"dog";
    face.textContent=animals[animal]||"🐶";
    const mood=getMood(health,distracted,s);
    root.dataset.mood=mood.name.toLowerCase();
    fill.style.width=health+"%";
    fill.style.background=health<=25?"#ef6f86":health<=50?"#f1a36b":health<=75?"#f1cb68":"#71d7a9";
    moodLabel.textContent=mood.name;
    pet.setAttribute("aria-label",`${animal}, ${mood.name.toLowerCase()}, health ${health} percent`);
    pet.classList.toggle("ff-distracted",distracted);
    pet.classList.toggle("ff-sad",health<=50 || distracted);
    pet.classList.toggle("ff-fainted",mood.name==="FAINTED");
    // Distraction bubble appears automatically; no click required.
    bubble.textContent=mood.message;
    bubble.classList.toggle("ff-visible",distracted || mood.name==="PANICKING" || mood.name==="FAINTED");
    if (mood.name!==lastMood && (distracted || mood.name==="PANICKING" || mood.name==="FAINTED")) {
      bubble.classList.remove("ff-pop"); void bubble.offsetWidth; bubble.classList.add("ff-pop");
    }
    lastMood=mood.name;
  }
  chrome.storage.local.get(["petPosition","game","currentTab"], data=>{
    if(data.petPosition){root.style.left=data.petPosition.left+"px";root.style.top=data.petPosition.top+"px";root.style.right="auto";root.style.bottom="auto";}
    render(data);
  });
  chrome.storage.onChanged.addListener(()=>chrome.storage.local.get(["game","currentTab"],render));
  let dragging=false,moved=false,startX=0,startY=0,left=0,top=0;
  pet.addEventListener("pointerdown",e=>{
    dragging=true;moved=false;startX=e.clientX;startY=e.clientY;
    const r=root.getBoundingClientRect();left=r.left;top=r.top;pet.setPointerCapture(e.pointerId);
  });
  pet.addEventListener("pointermove",e=>{
    if(!dragging)return;const dx=e.clientX-startX,dy=e.clientY-startY;
    if(Math.abs(dx)+Math.abs(dy)>5)moved=true;
    if(moved){root.style.left=Math.max(0,Math.min(innerWidth-90,left+dx))+"px";root.style.top=Math.max(0,Math.min(innerHeight-120,top+dy))+"px";root.style.right="auto";root.style.bottom="auto";}
  });
  pet.addEventListener("pointerup",()=>{
    dragging=false;
    if(moved){const r=root.getBoundingClientRect();chrome.storage.local.set({petPosition:{left:r.left,top:r.top}});}
    else {bubble.classList.toggle("ff-manual");chrome.runtime.sendMessage({type:"OPEN_PANEL"});}
  });
})();
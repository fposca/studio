import { test, expect } from "@playwright/test";

async function start(page, progress) {
  await page.addInitScript((progress) => {
    localStorage.setItem("neonboy.halloween.graphics.v1",JSON.stringify({mode:"low",showFps:false}));
    if (progress) localStorage.setItem("neonboy-halloween-save-v2",JSON.stringify({version:2,record:{slot:0,savedAt:Date.now(),progress:{guideSeen:["welcome"],...progress}}}));
  },progress);
  await page.goto("./");
  await page.getByRole("button",{name:progress ? /^CONTINUAR/ : /NUEVA PARTIDA/}).click();
  await expect(page.locator(".halloween-loading-screen")).toHaveCount(0,{timeout:90000});
  if (!progress) {
    await page.getByRole("button",{name:/Omitir presentaci/}).click();
    await expect(page.locator(".halloween-welcome-tour")).toHaveCount(0);
  }
  await expect(page.locator(".halloween-objective")).toBeVisible();
}

test("mobile key reveal, return, persistent destination and guide with free controls",async({page})=>{
  const errors=[];page.on("pageerror",e=>errors.push(e.message));
  await start(page);
  await expect(page.locator(".halloween-objective strong")).toContainText("la llave");
  await page.screenshot({path:"tmp/halloween-guide-start.png"});
  await page.locator(".halloween-prompt").click();
  await expect(page.locator(".halloween-chest-reveal")).toBeVisible();
  await expect(page.locator("canvas.halloween-scene-canvas")).toHaveAttribute("data-guide-camera","chest");
  await expect(page.locator(".halloween-touch-controls")).toHaveCount(0);
  await page.waitForTimeout(2100);
  await page.screenshot({path:"tmp/halloween-chest-reveal.png"});
  await page.getByRole("button",{name:"Volver al personaje"}).click();
  await expect(page.locator("canvas.halloween-scene-canvas")).toHaveAttribute("data-guide-camera","player");
  await expect(page.locator(".halloween-objective strong")).toContainText("cofre");
  await expect(page.locator(".halloween-guide-marker strong")).toHaveText("Cofre");
  await page.locator(".halloween-objective").click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.locator(".halloween-guide-checklist > ul > li")).toHaveCount(6);
  await page.screenshot({path:"tmp/halloween-guide-panel.png"});
  await page.getByRole("button",{name:"Mostrar el cofre"}).click();
  await expect(page.locator(".halloween-chest-reveal")).toBeVisible();
  await expect(page.locator(".halloween-chest-reveal")).toHaveCount(0,{timeout:15000});
  await page.getByRole("button",{name:"PARTIDA",exact:true}).click();
  await page.getByRole("button",{name:"GUARDAR AHORA",exact:true}).click();
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem("neonboy-halloween-save-v2")).record.progress);
  expect(saved.chest.keyOwned).toBe(true);expect(saved.player.x).toBeCloseTo(0);expect(saved.player.z).toBeCloseTo(11.1);
  await page.reload();await page.getByRole("button",{name:/^CONTINUAR/}).click();
  await expect(page.locator(".halloween-loading-screen")).toHaveCount(0,{timeout:90000});
  await expect(page.locator(".halloween-objective strong")).toContainText("cofre");
  await expect(page.locator(".halloween-chest-reveal")).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("ambient speech stays in a compact side card clear of aiming and mobile controls",async({page})=>{
  await start(page,{chest:{keyOwned:true,collected:true},demonHealth:0,player:{x:3.6,z:2,yaw:Math.PI},ambientEnabled:false});
  await page.getByRole("button",{name:"PERSONAJES",exact:true}).click();
  await page.locator(".halloween-people-grid button").filter({hasText:"Roxy"}).click();
  await page.locator(".dialogue-ambient-links button").first().click();
  await expect(page.locator(".halloween-demon-subtitle")).toBeVisible();
  for(const viewport of [{width:915,height:412},{width:740,height:360}]) {
    await page.setViewportSize(viewport);
    await expect.poll(async()=> {
      const subtitle=await page.locator(".halloween-demon-subtitle").boundingBox();
      const controls=await page.locator(".halloween-touch-controls").boundingBox();
      return subtitle && controls && subtitle.y+subtitle.height < controls.y &&
        subtitle.x > viewport.width * .6 && subtitle.width <= 300 && subtitle.y >= 65;
    }).toBe(true);
    // Measure the longest existing NPC line in the live caption at this viewport.
    const longLine = await page.evaluate(() => {
      const card=document.querySelector('.halloween-demon-subtitle');
      const text=card.querySelector('span'),previous=text.textContent;
      text.textContent="Cuatro a\u00f1os de NeonBoy... Parece que fue ayer cuando lleg\u00f3 el primer disco. Mir\u00e1 todo lo que tenemos ahora. \u00a1Y pensar que algunos dec\u00edan que el rock estaba muerto!";
      const box=card.getBoundingClientRect(),hearts=document.querySelector('.halloween-combat-hearts').getBoundingClientRect();
      const result={top:box.top,heartsBottom:hearts.bottom,bottom:box.bottom,textFits:text.scrollHeight<=text.clientHeight+1};
      text.textContent=previous;return result;
    });
    expect(longLine.top).toBeGreaterThanOrEqual(longLine.heartsBottom+4);
    expect(longLine.textFits).toBe(true);
  }
  await page.screenshot({path:"tmp/halloween-mobile-dialogue.png"});
});


test("glasses reveal the vulnerable demon, pause vision and can be replayed without granting charge",async({page})=>{
  const errors=[];page.on("pageerror",e=>errors.push(e.message));
  await start(page,{chest:{keyOwned:true,open:true},player:{x:-7.3,z:-8.2,yaw:Math.PI},ambientEnabled:false});
  await expect(page.locator(".halloween-prompt")).toContainText(/Tomar\s*gafas/);
  await page.locator(".halloween-prompt").click();
  const reveal=page.locator('.halloween-chest-reveal[data-reveal="demon"]');
  await expect(reveal).toBeVisible();
  await expect(reveal).toContainText("Sin la visi");
  await expect(page.locator("canvas.halloween-scene-canvas")).toHaveAttribute("data-guide-camera","demon");
  await expect(page.locator("canvas.halloween-scene-canvas")).toHaveAttribute("data-frequency-vision","active");
  await page.waitForTimeout(1900);
  await page.screenshot({path:"tmp/halloween-guide-demon.png"});
  await expect(page.locator('.halloween-nav button').filter({hasText:/VISI.* C/})).toContainText("10s");
  await expect(page.locator(".halloween-touch-controls")).toHaveCount(0);
  await page.keyboard.press("f");
  await expect(page.locator('.halloween-demon-health')).toHaveAttribute("aria-label","Demonio: 3 de 3 vidas");
  await page.getByRole("button",{name:"Volver al personaje"}).click();
  await expect(reveal).toHaveCount(0);
  await page.keyboard.press("c");
  await page.locator('.halloween-guide-nav').click();
  await page.getByRole('button',{name:/atacar al semidemonio/}).click();
  await expect(reveal).toBeVisible();
  await expect(page.locator('canvas.halloween-scene-canvas')).toHaveAttribute('data-frequency-vision','active');
  await expect(page.locator('.halloween-nav button').filter({hasText:/VISI.* C/})).toContainText("20s");
  await page.getByRole('button',{name:'Volver al personaje'}).click();
  await expect(page.locator('canvas.halloween-scene-canvas')).toHaveAttribute('data-frequency-vision','inactive');
  await page.getByRole('button',{name:'PARTIDA',exact:true}).click();
  await page.getByRole('button',{name:'GUARDAR AHORA',exact:true}).click();
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('neonboy-halloween-save-v2')).record.progress);
  expect(saved.guideSeen).toContain('demon');expect(saved.demonHealth).toBe(3);
  expect(saved.chest.collected).toBe(true);expect(saved.player.x).toBeCloseTo(-7.3);
  expect(errors).toEqual([]);
});

test("people explanation names remaining citizens and previews each actual character",async({page})=>{
  await start(page,{chest:{collected:true},demonHealth:0,vhsCollected:true,discoveredSecrets:['vhs:inserted','npc-dialogue:tito'],ambientEnabled:false});
  await expect(page.locator('.halloween-chest-reveal[data-reveal="people"]')).toBeVisible({timeout:30000});
  await expect(page.locator('.halloween-chest-reveal')).toContainText('Rulo');
  await expect(page.locator('.halloween-chest-reveal')).toContainText('siete personajes distintos');
  await page.waitForTimeout(1700);
  await page.screenshot({path:'tmp/halloween-guide-people.png'});
  await page.getByRole('button',{name:'Volver al personaje'}).click();
  await page.locator('.halloween-guide-nav').click();
  await page.locator('.halloween-guide-people summary').click();
  await expect(page.locator('.halloween-guide-people li')).toHaveCount(7);
  await expect(page.locator('.halloween-guide-people button')).toHaveCount(6);
  await page.getByRole('button',{name:'Mostrar a Belfegor',exact:true}).click();
  await expect(page.locator('.halloween-chest-reveal')).toContainText('Belfegor');
  await page.setViewportSize({width:740,height:360});
  const box=await page.locator('.halloween-chest-reveal').boundingBox();
  expect(box.y+box.height).toBeLessThanOrEqual(360);
  await expect(page.locator('canvas.halloween-scene-canvas')).toHaveAttribute('data-guide-camera','people');
});

test("mirror reveal waits for all story clues and does not summon the Judge from the tutorial camera",async({page})=>{
  const people=['tito','rulo','roxy','freddy','jason','skeleton-holy','skeleton-unholy'];
  await start(page,{chest:{collected:true},demonHealth:0,vhsCollected:true,phoneCalls:4,discoveredSecrets:['vhs:inserted',...people.map(id=>`npc-dialogue:${id}`)],ambientEnabled:false});
  await expect(page.locator('.halloween-chest-reveal[data-reveal="mirror"]')).toBeVisible({timeout:30000});
  await expect(page.locator('canvas.halloween-scene-canvas')).toHaveAttribute('data-guide-camera','mirror');
  await page.waitForTimeout(1700);
  await page.screenshot({path:'tmp/halloween-guide-mirror.png'});
  await page.getByRole('button',{name:'Volver al personaje'}).click();
  await expect(page.locator('.halloween-objective strong')).toContainText('espejo');
  await expect(page.locator('.halloween-judge-quiz')).toHaveCount(0);
  await page.locator('.halloween-guide-nav').click();
  await expect(page.getByRole('button',{name:'Mostrar el espejo'})).toBeVisible();
});

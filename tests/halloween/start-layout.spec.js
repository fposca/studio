import { test, expect } from "@playwright/test";

async function startScreen(page) {
  await page.addInitScript(() => {
    localStorage.setItem("neonboy.halloween.graphics.v1",JSON.stringify({mode:"low",showFps:false}));
    if (!localStorage.getItem("neonboy-halloween-save-v2")) localStorage.setItem("neonboy-halloween-save-v2",JSON.stringify({version:2,record:{slot:0,savedAt:Date.now(),progress:{hearts:2,guideSeen:["welcome"],chest:{keyOwned:true,collected:false},player:{x:1,z:8,yaw:0}}}}));
  });
  await page.goto('./');
  await expect(page.getByRole('button',{name:'NUEVA PARTIDA',exact:true})).toBeVisible();
}

test('start and new-game confirmation fit the viewport, cancel preserves the save',async({page})=>{
  await startScreen(page);
  const original=await page.evaluate(()=>localStorage.getItem('neonboy-halloween-save-v2'));
  for(const viewport of [{width:915,height:412},{width:867,height:388},{width:740,height:360},{width:640,height:320},{width:390,height:844},{width:360,height:640},{width:1280,height:720}]) {
    await page.setViewportSize(viewport);
    await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollHeight-innerHeight)).toBeLessThanOrEqual(1);
    for(const locator of [page.getByRole('button',{name:'NUEVA PARTIDA',exact:true}),page.getByRole('button',{name:/^CONTINUAR/}),page.locator('.halloween-start-save-summary'),page.getByRole('link',{name:/privacidad/i})]) {
      const box=await locator.boundingBox();expect(box.y).toBeGreaterThanOrEqual(0);expect(box.y+box.height).toBeLessThanOrEqual(viewport.height);
    }
    await page.getByRole('button',{name:'NUEVA PARTIDA',exact:true}).click();
    const dialog=page.getByRole('dialog');await expect(dialog).toBeVisible();
    const box=await dialog.boundingBox();expect(box.y).toBeGreaterThanOrEqual(0);expect(box.y+box.height).toBeLessThanOrEqual(viewport.height);
    const action=await dialog.getByRole('button',{name:'Empezar nueva partida'}).boundingBox();expect(action.y+action.height).toBeLessThanOrEqual(viewport.height);
    expect(await page.evaluate(()=>scrollY)).toBe(0);
    if(viewport.width===740)await page.screenshot({path:'tmp/halloween-start-confirm-compact.png'});
    await dialog.getByRole('button',{name:'Cancelar',exact:true}).click();await expect(dialog).not.toBeVisible();
    if(viewport.width===740||viewport.width===390||viewport.width===1280)await page.screenshot({path:`tmp/halloween-start-${viewport.width}.png`});
  }
  expect(await page.evaluate(()=>localStorage.getItem('neonboy-halloween-save-v2'))).toBe(original);
  await page.getByRole('button',{name:'NUEVA PARTIDA',exact:true}).click();await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page.getByRole('button',{name:'NUEVA PARTIDA',exact:true})).toBeFocused();
});

test('confirming a new game begins the tour without scrolling; cancelling delete preserves progress',async({page})=>{
  await page.setViewportSize({width:740,height:360});await startScreen(page);
  const original=await page.evaluate(()=>localStorage.getItem('neonboy-halloween-save-v2'));
  await page.getByRole('button',{name:'Borrar datos locales'}).click();await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button',{name:'Cancelar',exact:true}).click();
  expect(await page.evaluate(()=>localStorage.getItem('neonboy-halloween-save-v2'))).toBe(original);
  await page.getByRole('button',{name:'NUEVA PARTIDA',exact:true}).click();await page.getByRole('button',{name:'Empezar nueva partida',exact:true}).click();
  await expect(page.locator('.halloween-welcome-tour')).toBeVisible({timeout:90000});
  expect(await page.evaluate(()=>scrollY)).toBe(0);
  const progress=await page.evaluate(()=>JSON.parse(localStorage.getItem('neonboy-halloween-save-v2')).record.progress);
  expect(progress.chest.keyOwned).toBe(false);expect(progress.hearts).toBe(3);
});

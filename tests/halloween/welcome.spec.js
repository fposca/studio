import {test,expect} from "@playwright/test";

async function enter(page,progress) {
  await page.addInitScript(progress=>{
    localStorage.setItem("neonboy.halloween.graphics.v1",JSON.stringify({mode:"low",showFps:false}));
    if(progress)localStorage.setItem("neonboy-halloween-save-v2",JSON.stringify({version:2,record:{slot:0,savedAt:Date.now(),progress}}));
  },progress);
  await page.goto('./');
  await page.getByRole('button',{name:progress ? /^CONTINUAR/ : /NUEVA PARTIDA/}).click();
  await expect(page.locator('.halloween-loading-screen')).toHaveCount(0,{timeout:90000});
  await expect(page.locator('.halloween-welcome-tour')).toBeVisible();
}

test('welcome tour presents both music projects and characters before handing control to NeonBoy',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await enter(page);
  const tour=page.locator('.halloween-welcome-tour');
  await expect(tour).toHaveAttribute('data-step','welcome');
  await expect(page.locator('.halloween-touch-controls')).toHaveCount(0);
  await page.keyboard.press('e');await page.keyboard.press('f');await page.keyboard.press('c');
  await expect(page.locator('.halloween-album-layout')).toHaveCount(0);
  await page.waitForTimeout(1900);await page.screenshot({path:'tmp/welcome-neonboy.png'});
  await tour.getByRole('button',{name:'Siguiente'}).click();
  await expect(tour).toHaveAttribute('data-step','instrumental');
  await expect(tour).toContainText('instrumentales de NeonBoy');
  await expect(tour.locator('kbd')).toHaveText('E');
  await page.waitForTimeout(2900);await page.screenshot({path:'tmp/welcome-instrumental.png'});
  await tour.getByRole('button',{name:'Siguiente'}).click();
  await expect(tour).toHaveAttribute('data-step','band');await expect(tour).toContainText('9th Revelation');
  await page.waitForTimeout(2900);await page.screenshot({path:'tmp/welcome-revelation.png'});
  await tour.getByRole('button',{name:'Siguiente'}).click();
  await expect(tour).toHaveAttribute('data-step','story');
  await page.waitForTimeout(2100);await page.screenshot({path:'tmp/welcome-characters.png'});
  await tour.getByRole('button',{name:'Siguiente'}).click();
  await expect(tour).toHaveAttribute('data-step','return');
  await expect(tour).toHaveCount(0,{timeout:10000});
  await expect(page.locator('.halloween-touch-controls')).toBeVisible();
  await expect(page.locator('.halloween-objective strong')).toContainText('la llave');
  const save=await page.evaluate(()=>JSON.parse(localStorage.getItem('neonboy-halloween-save-v2')).record.progress);
  expect(save.guideSeen).toContain('welcome');expect(save.discoveredSecrets).toEqual([]);
  expect(save.player.x).toBe(0);expect(save.player.z).toBe(11.1);expect(save.demonHealth).toBe(3);expect(save.hearts).toBe(3);
  expect(save.chest.keyOwned).toBe(false);expect(save.songs).toEqual([]);expect(save.phoneCalls).toBe(0);
  await page.reload();await page.getByRole('button',{name:/^CONTINUAR/}).click();
  await expect(page.locator('.halloween-objective')).toBeVisible({timeout:90000});await expect(tour).toHaveCount(0);
  await page.locator('.halloween-guide-nav').click();await page.getByRole('button',{name:/Ver presentaci/}).click();
  await expect(tour).toBeVisible();await page.keyboard.press('Escape');await expect(tour).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('small screens and reduced motion keep the tour readable; E opens music after returning',async({page})=>{
  await page.setViewportSize({width:740,height:360});await page.emulateMedia({reducedMotion:'reduce'});
  await enter(page,{player:{x:0,z:-11.2,yaw:0},firstPerson:true,ambientEnabled:false});
  const tour=page.locator('.halloween-welcome-tour');
  await tour.getByRole('button',{name:'Siguiente'}).click();await expect(tour).toHaveAttribute('data-step','instrumental');
  const button=await tour.getByRole('button',{name:'Siguiente'}).boundingBox();expect(button.y+button.height).toBeLessThanOrEqual(360);
  await page.screenshot({path:'tmp/welcome-small.png'});
  await tour.getByRole('button',{name:/Omitir/}).click();await expect(tour).toHaveCount(0);
  await expect(page.locator('canvas.halloween-scene-canvas')).toHaveAttribute('data-guide-camera','player');
  await page.keyboard.press('e');await expect(page.locator('.halloween-album-detail h3')).toHaveText('Gloom');
  await expect(page.locator('.halloween-track-list button')).toHaveCount(4);
  await page.locator('.halloween-album-groups button').filter({hasText:'9th Revelation'}).click();
  await expect(page.locator('.halloween-album-detail h3')).toHaveText('Holy Fire');
  await expect(page.locator('.halloween-track-list button')).toHaveCount(4);
});

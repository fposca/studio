import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir:"./halloween", timeout:120000, workers:1,
  use:{baseURL:"http://127.0.0.1:5175/discografia/",channel:"chrome",viewport:{width:915,height:412},hasTouch:true,
    launchOptions:{args:["--enable-webgl","--ignore-gpu-blocklist"]}},
  webServer:{command:"npm run dev:halloween",url:"http://127.0.0.1:5175/discografia/",reuseExistingServer:true},
});

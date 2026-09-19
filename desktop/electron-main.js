import { app, BrowserWindow, dialog, shell } from "electron";
import path from "node:path";

let studioServer;
let mainWindow;

async function createWindow() {
  process.env.STUDIO_WORK_DIR = path.join(app.getPath("userData"), "work");
  process.env.STUDIO_PORT = "0";

  const { startServer } = await import("../server/index.js");
  const started = await startServer();
  studioServer = started.server;

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: "#0e1012",
    icon: path.join(app.getAppPath(), "build", "icon.png"),
    show: false,
    title: "Studio",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  mainWindow.removeMenu();
  mainWindow.once("ready-to-show", () => mainWindow?.show());
  mainWindow.on("closed", () => { mainWindow = null; });
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
  await mainWindow.loadURL(started.origin);
}

app.whenReady().then(async () => {
  try {
    await createWindow();
  } catch (error) {
    dialog.showErrorBox("No se pudo iniciar Studio", error.message);
    app.quit();
  }
});

app.on("window-all-closed", () => app.quit());

app.on("before-quit", () => {
  studioServer?.close();
});

// main.js  (ESM)  →  certifique-se que NO package.json existe:  "type": "module"

import { app, BrowserWindow } from "electron";
import path from 'path';
import ChildProcessManagerRED from "./services/childProcess/ChildProcessManagerRED.js";
import electronTray from "./services/electron/electronTray.js";
import windowMain from "./services/electron/windowMain.js";



import { fileURLToPath } from 'url';
async function start() {

  await app.whenReady();
  await windowMain();

  // IMPORTA MÓDULOS DINAMICAMENTE (boa prática no Electron ESM)
  const { default: redudancy } = await import("./services/redundancy/redundacy.js");
  const { registerProjectRoutes } = await import("./ipc-handlers/project.js");
   const { registerSettingsRoutes } = await import("./ipc-handlers/settings.js");
  const { default: Logger } = await import("./services/Logger.js");
  const { default: Settings_file } = await import("./services/Settings_file.js");

  Logger.info("starting application");

  //Check file and projects patch
  await Settings_file.initCheckFile();

  //Verified redundancy and start node-red server
  redudancy();

  //Controllers view config
  registerProjectRoutes();
  registerSettingsRoutes();
  
  Logger.info("application started");

}

// inicia o app
start();

// tray precisa ser chamado depois de app.whenReady()
electronTray();

// eventos
app.on("before-quit", () => {
  process.exit();
});

process.on("exit", () => {
  ChildProcessManagerRED.stopAll();
});

// singleInstance.mjs (ou .js se "type": "module" no package.json)
import { app, nativeImage, Tray, Menu, BrowserWindow, shell } from "electron";
import path from "path";

import Settings_file from "../Settings_file.js";
import ElectronWindow from "./ElectronWindow.js";

export default async function () {
  const gotTheLock = app.requestSingleInstanceLock();

  if (!gotTheLock) {
    // Se já existe outra instância, fecha essa aqui
    app.quit();
  } else {
    // Se uma segunda instância for aberta, foca na primeira
    const settings_read = await Settings_file.getFile();

    app.on("second-instance", (event, argv, workingDirectory) => {
      const windows = BrowserWindow.getAllWindows();

      if (windows.length === 1) {
        // Open init screen 
        if (settings_read.app.startupProjectWindow.enabled) {
          ElectronWindow.BrowserWindowURL(
            settings_read.app.startupProjectWindow.url,
            settings_read.app.startupProjectWindow.fullscreen
          );
        }
      } else {
        windows.forEach((win) => {
          if (win.isMinimized()) win.restore();
          win.focus();
        });
      }
    });
  }
}

import { BrowserWindow, ipcMain, screen, dialog, app } from 'electron';
import path from 'path';

class ElectronWindow {
    #isDev = process.env.NODE_ENV === 'dev';
    #window_file
    /**
     * Opens a BrowserWindow and loads the specified URL.
     *
     * @param {string} iURL - The URL to be loaded in the window.
     * @param {boolean} iFullScreen - Whether the window should open in fullscreen mode.
     */

    constructor() {

    }
    BrowserWindowURL(iURL, iFullScreen, iConfig) {
         const winde = new BrowserWindow(iConfig)
        if (this.#isDev) {
            winde.webContents.openDevTools()

        }
       
        // Load a remote URL

        if (iFullScreen == true) {

            winde.setFullScreen(true);
        }

        if (this.#isDev) {
            winde.webContents.openDevTools()
        }


        winde.loadURL(iURL)
        winde.maximize()


        // Captures when the page attempts to prevent unloading
        winde.webContents.on("will-prevent-unload", (event) => {
            const choice = dialog.showMessageBoxSync(winde, {
                type: "question",
                buttons: ["Exit without saving", "Cancel"],
                defaultId: 1,
                message: "You have unsaved changes. Are you sure you want to exit?",
            });
            if (choice === 0) {
                event.preventDefault(); // close
                winde.destroy();
            }
        });


    }

    async BrowserWindow(iConfig, iFile , iFileParameter) {

        this.#window_file = new BrowserWindow(iConfig)

        const winde = this.#window_file

        await winde.loadFile(iFile, iFileParameter)
        
        if (this.#isDev) {
            winde.webContents.openDevTools()
        }
      
        winde.show();

        return winde

    }


    async changeFileWindow(ifilePatch, iID_window) {

        let basePath;

        if (app.isPackaged) {

            basePath = path.join(process.resourcesPath, 'app.asar');
        } else {

            basePath = app.getAppPath();
        }


        var file = ifilePatch
        const fullPath = path.join(basePath, file);

        let win = BrowserWindow.fromId(iID_window);
        if (win) {
            await win.loadFile(fullPath);

        }

    }



}

export default new ElectronWindow()

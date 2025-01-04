const { app, nativeImage, Tray, Menu, BrowserWindow, shell } = require("electron");
module.exports = async () => {

    const { settings_file } = require("./NodeRed_settings_file");
    const path = require('path');
    const server_red = require("./NodeRedServer");

    var top = {}; // prevent gc to keep windows
    Menu.setApplicationMenu(null);

    app.whenReady().then(async () => {
    })


    app.once("ready", ev => {

        settings_file().then(Result_settings_file => {

            //Start Node-red
            server_red().then(Result => {

                if (Result_settings_file.UrlHomeScreen != "") {

                    const winde = new BrowserWindow()
                    // Load a remote URL
                    winde.loadURL(Result_settings_file.UrlHomeScreen)
                    winde.maximize()
                }

            })

            // empty image as transparent icon: it can click
            // see: https://electron.atom.io/docs/api/tray/

            top.tray = new Tray(nativeImage.createEmpty());


            const menu = Menu.buildFromTemplate([
                {
                    label: "Browser", submenu: [
                        {
                            label: "Open admin", click: (item, window, event) => {
                                shell.openExternal(Result_settings_file.UrlAdmin)
                            }
                        },
                        {
                            label: "Open Dashboard", click: (item, window, event) => {
                                shell.openExternal(Result_settings_file.UrlDashboard)
                            }
                        },

                    ]
                },
                { type: "separator" },
                {
                    label: "Desktop", submenu: [
                        {
                            label: "Open admin", click: (item, window, event) => {
                                const winde = new BrowserWindow({ width: 800, height: 600 })
                                // Load a remote URL
                                winde.loadURL(Result_settings_file.UrlAdmin)
                                winde.maximize()
                            }
                        },
                        {
                            label: "Open Dashboard", click: (item, window, event) => {
                                const wind = new BrowserWindow({ width: 800, height: 600 })
                                // Load a remote URL
                                wind.loadURL(Result_settings_file.UrlDashboard)
                                wind.maximize()

                            }
                        },

                    ]
                },
                { type: "separator" },
                {
                    label: "Server Configuration", click: (item, window, event) => {
                        const winde = new BrowserWindow({
                            width: 400, height: 600,
                            webPreferences: {
                                nodeIntegration: true,
                                preload: path.join(__dirname, 'preload.js')
                            }
                        })

                        // Load a remote URL
                        winde.loadFile("./views/config.html")
                    }
                },
                { type: "separator" },
                { role: "Quit" },
            ]);

            top.tray.setToolTip(`${Result_settings_file.editorTheme.page.title} Port:${Result_settings_file.uiPort}`);
            //top.tray.setTitle("Tray Example"); // macOS only
            top.tray.setContextMenu(menu);

            // Option: some animated web site to tray icon image
            // see: https://electron.atom.io/docs/tutorial/offscreen-rendering/
            top.icons = new BrowserWindow({
                show: false, webPreferences: { offscreen: true }
            });
            top.icons.loadFile("./resources/red.png");
            top.icons.webContents.on("paint", (event, dirty, image) => {
                if (top.tray) top.tray.setImage(image.resize({ width: 16, height: 16 }));
            });
        });
    })
}


app.on("before-quit", ev => {
    // BrowserWindow "close" event spawn after quit operation,
    // it requires to clean up listeners for "close" event
    //top.win.removeAllListeners("close");
    // release windows
    //top = null;
    process.exit();
});
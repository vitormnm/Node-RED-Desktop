// tray.mjs (ou tray.js se "type": "module" no package.json)
import { app, nativeImage, Tray, Menu, BrowserWindow, screen } from "electron";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

import Settings_file from "../Settings_file.js";

export default async function () {
    Menu.setApplicationMenu(null);
    const top = {}; // prevent gc to keep windows
    let mainWindow = null;

    // __dirname replacement para ESM
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    app.once("ready", async (ev) => {
        const settings_file = await Settings_file.getFile();

        const tooltip = settings_file.app.name;

        const rootPath = app.getAppPath();

        // Icons
        const iconPath = path.join(rootPath, "electron" ,  "resources", "red.png");
        const icon = nativeImage.createFromPath(iconPath);

        //create
        top.tray = new Tray(icon);

        top.tray.on("click", () => {
            openWindow("projects");
        });

        const menu = Menu.buildFromTemplate([
            {
                label: "Settings",
                click: () => {
                    openWindow("settings");
                },
            },
            { type: "separator" },
            {
                label: "Projects",
                click: () => {
                    openWindow("projects");
                },
            },
            { type: "separator" },
            { role: "Quit" },
        ]);


        top.tray.setToolTip(tooltip);
        top.tray.setContextMenu(menu);

        top.icons = new BrowserWindow({
            show: false,
            webPreferences: { offscreen: true },
        });
    });

    function buildRendererUrl(iPage) {
        const isDev = process.env.NODE_ENV === "dev";
        if (isDev) {
            return `http://localhost:5173/#/${iPage}`;
        }

        const indexPath = path.join(__dirname, "..", "..", "..", "dist", "index.html");
        return `${pathToFileURL(indexPath).href}#/${iPage}`;
    }

    function openWindow(iPage) {
        const targetUrl = buildRendererUrl(iPage);

        if (mainWindow && !mainWindow.isDestroyed()) {
            if (mainWindow.isMinimized()) {
                mainWindow.restore();
            }

            // Reutiliza a janela existente e navega para a rota selecionada.
            if (mainWindow.webContents.getURL() !== targetUrl) {
                mainWindow.loadURL(targetUrl);
            }

            mainWindow.show();
            mainWindow.focus();
            return;
        }

        const { width, height } = screen.getPrimaryDisplay().workAreaSize;
        const winWidth = 700;
        const winHeight = 600;
        const x = width - winWidth;
        const y = height - winHeight;

        mainWindow = new BrowserWindow({
            width: winWidth,
            height: winHeight,
            x,
            y,
            frame: true,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                preload: path.join(__dirname, "windowMain_Preload.js"),
            },
        });

        mainWindow.on("closed", () => {
            mainWindow = null;
        });

        mainWindow.loadURL(targetUrl);
        mainWindow.show();
        mainWindow.focus();
    }
}

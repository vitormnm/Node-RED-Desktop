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

    function getTrayWindowPosition() {
        const cursorPoint = screen.getCursorScreenPoint();
        const display = screen.getDisplayNearestPoint(cursorPoint) || screen.getPrimaryDisplay();
        const workArea = display.workArea;
        const winWidth = 700;
        const winHeight = 600;

        const isLinux = process.platform === "linux";
        const isMac = process.platform === "darwin";

        let x;
        let y;

        if (isLinux || isMac) {
            // Ubuntu / Linux GNOME: Top-right corner right below top bar
            x = workArea.x + workArea.width - winWidth;
            y = workArea.y;
        } else {
            // Windows: Bottom-right corner right above taskbar
            let trayBounds = null;
            try {
                if (top.tray && typeof top.tray.getBounds === "function") {
                    const b = top.tray.getBounds();
                    if (b && b.width > 0 && b.height > 0) {
                        trayBounds = b;
                    }
                }
            } catch (e) {
                trayBounds = null;
            }

            if (trayBounds) {
                x = Math.round(trayBounds.x + trayBounds.width / 2 - winWidth / 2);
                y = Math.round(trayBounds.y - winHeight);
            } else {
                x = workArea.x + workArea.width - winWidth;
                y = workArea.y + workArea.height - winHeight;
            }
        }

        // Clamp to screen workArea boundaries
        x = Math.max(workArea.x, Math.min(x, workArea.x + workArea.width - winWidth));
        y = Math.max(workArea.y, Math.min(y, workArea.y + workArea.height - winHeight));

        return { x: Math.round(x), y: Math.round(y), winWidth, winHeight };
    }

    function applyWindowBounds(win, x, y, width, height) {
        if (!win || win.isDestroyed()) return;

        // Apply bounds immediately
        win.setBounds({ x, y, width, height });

        // On Linux / GNOME Mutter, window manager defers placement hints until window map completes.
        // Re-applying setBounds after map/show via setTimeout guarantees top-right placement on Ubuntu GNOME.
        setTimeout(() => {
            if (win && !win.isDestroyed()) {
                win.setBounds({ x, y, width, height });
            }
        }, 50);

        setTimeout(() => {
            if (win && !win.isDestroyed()) {
                win.setBounds({ x, y, width, height });
            }
        }, 150);
    }

    function openWindow(iPage) {
        const targetUrl = buildRendererUrl(iPage);
        const isLinux = process.platform === "linux";
        const { x, y, winWidth, winHeight } = getTrayWindowPosition();

        const displayWindow = (win) => {
            if (!win || win.isDestroyed()) return;
            if (isLinux) {
                win.maximize();
            } else {
                applyWindowBounds(win, x, y, winWidth, winHeight);
            }
            win.show();
            win.focus();
        };

        if (mainWindow && !mainWindow.isDestroyed()) {
            if (mainWindow.isMinimized()) {
                mainWindow.restore();
            }

            if (mainWindow.webContents.getURL() !== targetUrl) {
                mainWindow.loadURL(targetUrl);
            }

            displayWindow(mainWindow);
            return;
        }

        mainWindow = new BrowserWindow({
            width: winWidth,
            height: winHeight,
            x: isLinux ? undefined : x,
            y: isLinux ? undefined : y,
            frame: true,
            show: false,
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

        mainWindow.once("ready-to-show", () => {
            displayWindow(mainWindow);
        });

        // Fallback for Linux Wayland/X11 if ready-to-show doesn't fire
        mainWindow.webContents.once("did-finish-load", () => {
            if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.isVisible()) {
                displayWindow(mainWindow);
            }
        });

        // Fallback timeout
        setTimeout(() => {
            if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.isVisible()) {
                displayWindow(mainWindow);
            }
        }, 300);
    }
}

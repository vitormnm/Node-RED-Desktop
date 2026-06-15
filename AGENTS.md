# AGENTS.md — Node-RED-Desktop

> This document is the authoritative guide for AI coding agents working on this repository. Read it in full before making any changes.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [Repository Layout](#3-repository-layout)
4. [Architecture](#4-architecture)
   - [Electron Main Process](#41-electron-main-process)
   - [Renderer Process (Vue 3 SPA)](#42-renderer-process-vue-3-spa)
   - [IPC Bridge (Preload)](#43-ipc-bridge-preload)
   - [Node-RED Child Processes](#44-node-red-child-processes)
5. [IPC API Reference](#5-ipc-api-reference)
6. [Configuration File (`settings.json`)](#6-configuration-file-settingsjson)
7. [Key Services & Models](#7-key-services--models)
8. [Redundancy System](#8-redundancy-system)
9. [Windows Service Integration (WinSW)](#9-windows-service-integration-winsw)
10. [Development Workflow](#10-development-workflow)
11. [Build & Packaging](#11-build--packaging)
12. [Coding Conventions](#12-coding-conventions)
13. [Important Constraints & Gotchas](#13-important-constraints--gotchas)

---

## 1. Project Overview

**Node-RED-Desktop** is a cross-platform Electron desktop application that bundles Node-RED and Node.js so users can run one or more Node-RED instances without installing Node.js or Node-RED separately.

Key features:
- **Multiple instances** — each "project" runs as an isolated Node-RED server on its own port via a Node.js child process.
- **Windows service** — wrap the whole app as a Windows service using WinSW so it starts at boot.
- **Primary / secondary redundancy** — two machines communicate via UDP heartbeat; the secondary takes over automatically if the primary goes offline.
- **Per-project logging** — stdout/stderr of every child process is piped to a daily rotating log file.
- **In-app Node-RED editor** — the editor can be opened in an embedded `BrowserWindow` or in the default system browser.
- **Admin authentication** — per-project bcrypt-hashed credentials stored in `settings.json`.
- **HTTPS support** — optional TLS for any project.

Supported platforms: Windows 10/11 x64, Ubuntu LTS x64.

---

## 2. Technology Stack

| Layer | Technology | Version (package.json) |
|---|---|---|
| Desktop shell | Electron | 42.x |
| Frontend framework | Vue 3 (Composition API `<script setup>`) | 3.5.x |
| UI component library | Vuetify | 3.x |
| Routing | Vue Router (hash history) | 4.x |
| Build tool | Vite | 7.x |
| Node-RED runtime | node-red | 5.0.0 |
| Password hashing | bcryptjs | (transitive) |
| Packaging | @electron/packager | 20.x |
| Windows service wrapper | WinSW (binary in `WinSW/`) | bundled |

**Module system:** The entire project uses **ES Modules** (`"type": "module"` in `package.json`). This includes the Electron main process. Do **not** use `require()` unless working in a legacy file (e.g., `HomeScreen_settings.js` or `SaveProjectZip.js` which are not yet migrated).

---

## 3. Repository Layout

```
Node-RED-Desktop/
├── electron/                   # Electron main-process code
│   ├── main.js                 # Entry point — bootstraps everything
│   ├── ipc-handlers/           # ipcMain.handle() route registration
│   │   ├── project.js          # Project CRUD + worker control routes
│   │   └── settings.js         # App settings + WinSW service routes
│   ├── model/                  # Business-logic classes (called by ipc-handlers)
│   │   ├── AppSettings.js      # Saves redundancy & startup window config
│   │   ├── ControlProject.js   # add / update / delete project logic
│   │   ├── HomeScreen_settings.js  # Legacy CJS — not actively used
│   │   ├── Password_settings.js    # bcrypt hashing for adminAuth users
│   │   ├── ProjectLog.js       # Reads tail of per-project log files
│   │   ├── Project_openElectronWindow.js  # Opens editor/dashboard windows
│   │   └── SaveProjectZip.js   # Legacy CJS — backup/restore ZIP (stub)
│   ├── resources/              # App icons (nodered.ico, red.png)
│   └── services/
│       ├── Logger.js           # Console logger with timestamps
│       ├── Settings_file.js    # Read/write Node-RED/settings.json
│       ├── childProcess/
│       │   ├── ChildProcessManagerRED.js   # Manages forked Node-RED workers
│       │   └── NodeRedServerChildProcess.js # Runs inside each forked worker
│       ├── electron/
│       │   ├── ElectronWindow.js      # Opens arbitrary BrowserWindows
│       │   ├── electronTray.js        # System-tray icon & menu
│       │   ├── windowMain.js          # Single-instance lock enforcement
│       │   └── windowMain_Preload.js  # Context-bridge (preload script)
│       ├── redundancy/
│       │   ├── redundacy.js           # Dispatcher — reads config, picks mode
│       │   ├── redundacy_primary.js   # Sends UDP heartbeats
│       │   └── redundacy_secondary.js # Listens for heartbeats, auto-failover
│       └── winSW/
│           └── WinSW.js               # Creates/starts/stops/deletes Windows service
├── src/                        # Renderer (Vue 3 SPA)
│   ├── main.js                 # Vue app bootstrap
│   ├── App.vue                 # Root component
│   ├── style.css               # Global styles
│   ├── router/index.js         # Hash-based routes: /projects, /settings, /tab3
│   ├── plugins/
│   │   ├── index.js            # Registers Vuetify + other plugins
│   │   └── vuetify.js          # Vuetify theme config
│   ├── layouts/
│   │   └── DefaultLayout.vue   # Shell with AppFooter
│   ├── pages/
│   │   ├── Projects.vue        # Hosts <ProjectTable>
│   │   ├── Settings.vue        # App-level settings form
│   │   └── Tab3.vue            # Placeholder page
│   ├── components/
│   │   ├── AppFooter.vue               # Bottom navigation
│   │   ├── GlobalNotification.vue      # Toast/snackbar wrapper
│   │   ├── ProjectDialog.vue           # Main project CRUD dialog (tabs: Settings/Info/Log/Editor/Dashboard)
│   │   ├── ProjectDialogInfo.vue       # Info/metrics panel inside dialog
│   │   ├── ProjectDialogLog.vue        # Log tail panel inside dialog
│   │   ├── ProjectDialogPreviewPanel.vue # Embedded webview for editor/dashboard
│   │   ├── ProjectDialogSettings.vue   # Per-project settings form
│   │   └── ProjectTable.vue            # Projects list with start/stop/search
│   └── utils/
│       └── notify.js           # Helper that emits global notification events
├── installer/
│   └── Node-Red-Installer.iss  # Inno Setup script for Windows installer
├── WinSW/                      # WinSW binary + generated XML config (runtime)
├── build/                      # electron-packager output (gitignored at runtime)
├── dist/                       # Vite production build output
├── public/                     # Static assets served by Vite dev server
├── resources/                  # Project-level assets (GIF demo, button SVG)
├── index.html                  # Vite HTML entry
├── vite.config.js              # Vite config (base './', Vue plugin, Roboto font)
└── package.json                # Scripts, dependencies, Electron entry point
```

---

## 4. Architecture

### 4.1 Electron Main Process

**Entry:** [`electron/main.js`](electron/main.js)

Startup sequence:
1. `app.whenReady()` — Electron is ready.
2. `windowMain()` — Enforces single-instance lock; registers `second-instance` handler.
3. Dynamically imports (ESM `await import(...)`) all services: redundancy dispatcher, IPC handlers, Logger, Settings_file.
4. `Settings_file.initCheckFile()` — Creates `Node-RED/settings.json` with defaults if missing; updates absolute `userDir` / `StaticPatch` paths for all projects.
5. `redundancy()` — Decides whether to start all workers immediately or wait for heartbeat logic.
6. Registers all IPC routes via `registerProjectRoutes()` and `registerSettingsRoutes()`.
7. `electronTray()` — Creates the system-tray icon and context menu (runs after `app.ready`).

On `before-quit` / `process.exit`: calls `ChildProcessManagerRED.stopAll()` to kill all Node-RED workers.

### 4.2 Renderer Process (Vue 3 SPA)

**Entry:** [`src/main.js`](src/main.js) → [`src/App.vue`](src/App.vue)

- Uses **Vue Router with hash history** (`createWebHashHistory`), so URLs look like `file://...index.html#/projects`. This is required for Electron `loadFile` compatibility.
- All routing is declared in [`src/router/index.js`](src/router/index.js). Routes are nested under `DefaultLayout.vue`.
- Communicates with the main process exclusively through `window.api.*` (injected by the preload script). **Never** use Node.js APIs directly in renderer code.
- UI polling: `ProjectTable` re-renders every **1 second** by calling `GET:/checkSettings` and `GET:/ctl_project_getStatus`. `ProjectDialog` polls status every **1 second** and logs every **1.5 seconds** while open.

### 4.3 IPC Bridge (Preload)

**File:** [`electron/services/electron/windowMain_Preload.js`](electron/services/electron/windowMain_Preload.js)

Exposes `window.api` to the renderer with these methods:

```js
window.api.get(route)             // ipcRenderer.invoke(`GET:${route}`)
window.api.post(route, data)      // ipcRenderer.invoke(`POST:${route}`, data)
window.api.put(route, data)       // ipcRenderer.invoke(`PUT:${route}`, data)
window.api.delete(route, data)    // ipcRenderer.invoke(`DELETE:${route}`, data)
window.api.getWindowId()          // ipcRenderer.invoke('get-window-id')
```

`contextIsolation: true` and `nodeIntegration: false` are enforced on all windows created by `electronTray.js`.

### 4.4 Node-RED Child Processes

**Manager:** [`electron/services/childProcess/ChildProcessManagerRED.js`](electron/services/childProcess/ChildProcessManagerRED.js)  
**Worker:** [`electron/services/childProcess/NodeRedServerChildProcess.js`](electron/services/childProcess/NodeRedServerChildProcess.js)

- Each Node-RED project is launched with Node.js `fork()`, passing the full project config as a JSON string in `process.argv[2]`.
- `stdio: ['pipe', 'pipe', 'pipe', 'ipc']` — stdout and stderr are piped to a daily log file inside `<userDir>/logs/YYYYMMDD_log_nodered.txt`.
- The worker sends JSON messages back to the manager via `process.send()`:
  - `{ cmd: 'started', name, url, pid, id }` — sent once on successful start.
  - `{ cmd: 'metrics', name, pid, id, rssBytes, cpuPercent, diskReadBytesPerSec, diskWriteBytesPerSec }` — sent every **1 second**.
- On error, the manager automatically restarts the worker (`#startWorkerNoderRED`).
- If `settings.app.startupProjectWindow.enabled` is true, the manager opens a `BrowserWindow` to the configured URL on first startup.

---

## 5. IPC API Reference

All channels are registered in [`electron/ipc-handlers/project.js`](electron/ipc-handlers/project.js) and [`electron/ipc-handlers/settings.js`](electron/ipc-handlers/settings.js).

### Project Routes

| Channel | Method | Handler | Description |
|---|---|---|---|
| `GET:/checkSettings` | `ipcMain.handle` | `Settings_file.getFile()` | Returns the full `settings.json` object |
| `GET:/ctl_project_getStatus` | `ipcMain.handle` | `ChildProcessManagerRED.getStatus()` | Returns array of `{id, name, pid, rssBytes, cpuPercent, diskReadBytesPerSec, diskWriteBytesPerSec}` for running workers |
| `POST:/ctl_project_addProject` | `ipcMain.handle` | `ControlProject.add(data)` | Creates a new project; starts worker if `autoStart` is true |
| `PUT:/ctl_project_updateProject` | `ipcMain.handle` | `ControlProject.update(data)` | Updates project settings in `settings.json` |
| `DELETE:/ctl_project_deleteProject` | `ipcMain.handle` | `ControlProject.delete(data)` | Stops worker, removes project from config, deletes `userDir` |
| `POST:/ctl_project_startWoker` | `ipcMain.handle` | `ChildProcessManagerRED.starWorker(id, name)` | Starts a single project worker |
| `POST:/ctl_project_stopWoker` | `ipcMain.handle` | `ChildProcessManagerRED.stopWorker(id, name)` | Stops a single project worker |
| `POST:/ctl_project_log_tail` | `ipcMain.handle` | `ProjectLog.getTail({id, lines})` | Returns the last N lines of the most recent log file |
| `POST:/ctl_project_windows_openEditor` | `ipcMain.handle` | `Project_openElectronWindow.setActionOpen(action, id)` | Opens editor/dashboard in Electron window or browser |
| `get-window-id` | `ipcMain.handle` | — | Returns the `BrowserWindow.id` of the sender |

#### `open_editor` actions for `POST:/ctl_project_windows_openEditor`

| `action` value | Behavior |
|---|---|
| `open_editor` | Opens `UrlAdmin` in a new `BrowserWindow` |
| `open_editor_web` | Opens `UrlAdmin` in the system's default browser |
| `open_dashboard` | Opens `UrlDashboard` in a new `BrowserWindow` |
| `open_dashboard_web` | Opens `UrlDashboard` in the system's default browser |
| `open_folder` | Opens `settings.userDir` in the OS file explorer |

### Settings Routes

| Channel | Method | Handler | Description |
|---|---|---|---|
| `POST:/ctl_serverConfig_settings_save` | `ipcMain.handle` | `AppSettings.set_RedudancySettings()` + `AppSettings.set_startupProjectWindow()` | Saves redundancy config and startup window settings |
| `POST:/ctl_serverConfig_service` | `ipcMain.handle` | `WinSW.createService()` | Creates and installs the Windows service |
| `DELETE:/ctl_serverConfig_service` | `ipcMain.handle` | `WinSW.DeleteService()` | Deletes the Windows service via `SC DELETE` |

### Push Events (Main → Renderer)

| Event | Payload | Trigger |
|---|---|---|
| `ctl_serverConfig_uploadProject_msg` | `{ texto: 'regresh' }` | Sent to all `BrowserWindow`s after any project add/update/delete to trigger a UI refresh |

---

## 6. Configuration File (`settings.json`)

**Path at runtime:** `<exe_dir>/Node-RED/settings.json`

This file is created automatically on first launch with sensible defaults by `Settings_file.#Creat_file()`.

### Schema

```jsonc
{
  "app": {
    "name": "Node-RED Desktop2",
    "version": "2.0.0",
    "startupProjectWindow": {
      "enabled": true,        // Auto-open a browser window on startup
      "fullscreen": false,
      "id": "<project-uuid>", // Which project to open
      "url": "http://localhost:1880/red/admin/"
    },
    "description": ""
  },
  "redundancy": {
    "enabled": false,
    "type": "primary",        // "primary" | "secondary"
    "ip": "127.0.0.1",        // primary→secondary IP; secondary→primary IP
    "port": 41235,            // UDP port for heartbeats
    "timeout_ms_primary": 250,    // How often primary sends heartbeats (ms)
    "timeout_ms_secondary": 500   // How long secondary waits before failover (ms)
  },
  "projects": [
    {
      "name": "Main",
      "id": "<uuid>",
      "description": "",
      "uiPort": 1880,
      "autoStart": true,
      "UrlAdmin": "http://localhost:1880/red/admin/",
      "UrlDashboard": "http://localhost:1880/Dashboard/",
      "adminAuth": false,     // true = credentials required
      "settings": {           // Passed directly to Node-RED's init()
        "flowFile": "flows.json",
        "httpAdminRoot": "/red/admin",
        "httpNodeRoot": "/",
        "uiPort": 1880,
        "ui": { "path": "/" },
        "editorTheme": {
          "page": { "title": "Node-RED-Desktop Main" },
          "projects": { "enabled": false },
          "tours": false
        },
        "userDir": "<abs-path-to-project-data-dir>",  // Set at runtime
        "StaticPatch": "<abs-path-to-static-folder>",  // Set at runtime
        "StaticFolder": "static",                       // Relative folder name
        "functionGlobalContext": {},
        "adminAuth": null,    // null or { type, users: [{username, password (bcrypt), permissions}] }
        "https": {
          "enabled": false,
          "key": "",   // Relative path to .key file inside exe_dir
          "cert": ""   // Relative path to .cert file inside exe_dir
        },
        "telemetry": { "enabled": false, "updateNotification": false },
        "contextStorage": {
          "default": "memoryOnly",
          "memoryOnly": { "module": "memory" },
          "file": { "module": "localfilesystem" }
        }
      }
    }
  ]
}
```

**Important:** `userDir` and `StaticPatch` are **always rewritten** from their relative names on every startup by `Settings_file.writePatchProject()`. Do not hard-code absolute paths in the file.

---

## 7. Key Services & Models

### `Settings_file` (`electron/services/Settings_file.js`)
Singleton. Handles all reads and writes to `settings.json`.

| Method | Description |
|---|---|
| `initCheckFile()` | Creates file if missing; rewrites absolute paths |
| `getFile()` | Async — returns parsed JSON |
| `WriteFile(payload)` | Async — serializes and writes JSON |
| `Createfolder(path)` | Async — `mkdir -p` |
| `deleteFolder(path)` | Async — `rm -rf` |
| `checkFile(path)` | Async — returns `true` if path exists |

### `ChildProcessManagerRED` (`electron/services/childProcess/ChildProcessManagerRED.js`)
Singleton. Manages all forked Node-RED workers.

| Method | Description |
|---|---|
| `startAll()` | Starts workers for all projects with `autoStart: true` |
| `stopAll()` | Kills all running workers |
| `starWorker(id, name)` | Starts a single worker (no-op if already running) |
| `stopWorker(id, name)` | Kills a single worker |
| `getStatus()` | Returns runtime metrics for all running workers |

### `ControlProject` (`electron/model/ControlProject.js`)
Singleton. Business logic for project CRUD.

- `add(payload)` — Validates name uniqueness, hashes passwords (if `adminAuth`), writes to `settings.json`, optionally starts worker.
- `update(payload)` — Updates project by `id`, re-hashes passwords if needed.
- `delete(payload)` — Stops worker, removes from config, deletes `userDir` directory.

### `Logger` (`electron/services/Logger.js`)
Singleton. Simple `console.log` / `console.error` with `DD/MM/YYYY HH:MM:SS - [info|error]` prefix.

### `Password_settings` (`electron/model/Password_settings.js`)
Singleton. Uses `bcryptjs` with 10 salt rounds. Preserves already-hashed passwords (detected by `$2a$`/`$2b$`/`$2y$` prefix) so updates don't double-hash.

### `ProjectLog` (`electron/model/ProjectLog.js`)
Singleton. Reads the last N lines (default 120, UI uses 150) from the most recently modified `YYYYMMDD_log_nodered.txt` in `<userDir>/logs/`.

### `WinSW` (`electron/services/winSW/WinSW.js`)
Singleton. Generates `WinSW/WinSW.xml` and invokes `WinSW.exe install` / `net start` / `net stop` / `SC DELETE` to manage the Windows service.

### `ElectronWindow` (`electron/services/electron/ElectronWindow.js`)
Singleton. Opens `BrowserWindow` instances by URL or local file path.

---

## 8. Redundancy System

The redundancy system allows two separate machines (or processes) to provide high-availability Node-RED.

**Files:** `electron/services/redundancy/`

### How It Works

1. `redundacy.js` reads `settings.json` on startup:
   - If `redundancy.enabled === false` → start all workers immediately.
   - If `type === "primary"` → run `redundacy_primary.js`.
   - If `type === "secondary"` → run `redundacy_secondary.js`.

2. **Primary** (`redundacy_primary.js`):
   - Starts all workers immediately.
   - Sends a UDP `"HEARTBEAT"` packet to the secondary's `ip:port` every `timeout_ms_primary` ms (default 250 ms).

3. **Secondary** (`redundacy_secondary.js`):
   - Binds a UDP server on the configured `port`.
   - Checks heartbeat freshness every 100 ms.
   - If the last heartbeat is older than `timeout_ms_secondary` ms (default 500 ms) → calls `ChildProcessManagerRED.startAll()`.
   - When heartbeats resume → calls `ChildProcessManagerRED.stopAll()`.

> **Configuration:** Set `redundancy.ip` to the **other** machine's IP. Primary points at secondary; secondary points at primary.

---

## 9. Windows Service Integration (WinSW)

The `WinSW/` directory ships with `WinSW.exe`. The `WinSW.js` service:
1. Writes a `WinSW.xml` config pointing to the app's `.exe` with `startmode: Automatic` and `onfailure: restart`.
2. Runs `WinSW.exe install` → registers the service.
3. The service runs the full Electron app on system boot (headless, tray-only).

**Requires admin privileges** to install/delete the service.

---

## 10. Development Workflow

### Prerequisites

- Node.js (version bundled with Electron 42 — do **not** use a global Node-RED)
- `npm install` to install all dependencies

### Running in Dev Mode

```bash
npm run dev
```

This runs `cross-env NODE_ENV=dev concurrently "vite" "wait-on http://localhost:5173 && electron ."`.

- Vite starts a dev server on `http://localhost:5173`.
- Electron loads the renderer from that URL instead of the `dist/` folder.
- Dev tools open automatically for `ElectronWindow.BrowserWindowURL` calls when `NODE_ENV=dev`.
- The system tray navigates using `http://localhost:5173/#/projects` and `http://localhost:5173/#/settings` in dev mode.

### Running in Production Mode (without packaging)

```bash
npm run prod
```

Same as dev but without `NODE_ENV=dev`, so dev tools are not opened.

### Vite Build Only

```bash
npm run build
```

Outputs to `dist/`. The Electron main process serves `dist/index.html` in production.

---

## 11. Build & Packaging

### Windows 64-bit

```bash
npm run build64
```

This:
1. Runs `vite build`.
2. Runs `electron-packager` → outputs to `build/NodeRedDesktop-win32-x64/`.
3. Copies `WinSW/` into the package directory.

The packaged app excludes `src/`, and the `vue`, `vite`, `vue-router` packages from `node_modules` (they are bundled by Vite into `dist/`).

### Linux x64

```bash
npm run build64linux
```

Same as above but targets `linux`.

### Windows Installer

An Inno Setup script is provided at [`installer/Node-Red-Installer.iss`](installer/Node-Red-Installer.iss). Run it with Inno Setup Compiler after building the Windows package.

---

## 12. Coding Conventions

### Module System

- **All new files must use ES Modules** (`import`/`export`). Do not introduce `require()`.
- `HomeScreen_settings.js` and `SaveProjectZip.js` are legacy CJS files and are currently not wired into the active flow. Leave them as-is unless actively migrating them.

### Singletons

Services and models export a **singleton** (`export default new ClassName()`). Do not instantiate them elsewhere.

### Error Handling

- Main-process async functions should `try/catch` and return `{ status: false, message: "..." }` objects to the renderer on failure.
- Use `Logger.error()` for all caught errors in the main process.
- The renderer uses `notify.error()` / `notify.success()` (from `src/utils/notify.js`) to display toast notifications.

### IPC Route Naming

Routes follow a REST-like convention:
- `GET:/<resource>` for reads
- `POST:/<resource>` for creates/actions
- `PUT:/<resource>` for updates
- `DELETE:/<resource>` for deletes

Always prefix with the HTTP verb followed by `:`.

### Vue Components

- Use `<script setup>` Composition API.
- Use `reactive()` for form state, `ref()` for simple values.
- Avoid direct DOM manipulation; use Vuetify components.
- Polling intervals must be cleared in `onUnmounted()`.

### Paths

- **Never hard-code absolute paths.** Always use `path.join(app.getPath('exe'), ...)` or `path.dirname(app.getPath('exe'))` to compute paths relative to the executable directory.
- Static paths are resolved at runtime and written back to `settings.json` by `Settings_file.writePatchProject()`.

---

## 13. Important Constraints & Gotchas

1. **Single-instance lock** — `windowMain.js` calls `app.requestSingleInstanceLock()`. If the app is already running, the second instance quits immediately. Do not bypass this.

2. **ESM dynamic imports in main process** — Services are loaded with `await import()` inside the `start()` function in `main.js` to avoid issues with Electron ESM top-level await. Follow this pattern for new services.

3. **`__dirname` unavailable in ESM** — Use the `fileURLToPath(import.meta.url)` pattern:
   ```js
   import { fileURLToPath } from 'url';
   import path from 'path';
   const __filename = fileURLToPath(import.meta.url);
   const __dirname = path.dirname(__filename);
   ```

4. **Vite base path** — `vite.config.js` sets `base: './'` so all asset paths are relative, which is required for `file://` loading in production Electron.

5. **Hash router** — The renderer **must** use `createWebHashHistory`. Do not switch to `createWebHistory` (it will break `loadFile`).

6. **Password hashing** — Passwords are bcrypt-hashed in the main process (`Password_settings.js`), not in the renderer. Passwords are stored hashed in `settings.json` and are preserved as-is on update (detected by the `$2a$`/`$2b$`/`$2y$` bcrypt prefix).

7. **Port conflicts** — The child process exits with `process.exit()` if the configured port is already in use (`EADDRINUSE`). Handle this in the UI by showing an appropriate message.

8. **Log file rotation** — Log files are named `YYYYMMDD_log_nodered.txt` and appended to (not overwritten). A new file is created each day when the worker starts. The log tail reads the **most recently modified** file.

9. **`settings.json` mutations** — Always call `Settings_file.getFile()` to get a fresh copy before mutating and writing back, to avoid race conditions when multiple operations occur quickly.

10. **WinSW requires admin** — Service install/delete will fail without elevated privileges. The app does not self-elevate; the user must run it as administrator or use a UAC-prompted shortcut when managing the service.

11. **Node-RED bundled in `node_modules`** — The packaged `node_modules/node-red` is what ships inside the `.asar`. The child process requires the Node.js binary bundled with Electron. `app.getPath('exe')` points to the Electron-wrapped Node.js binary.

// ChildProcessManagerRED.js
import Settings_file from "../Settings_file.js";
import fs from 'fs';
import path from 'path';
import { fork } from 'child_process';
import { app } from "electron";

import ElectronWindow from "../electron/ElectronWindow.js";
import Logger from "../Logger.js";
import { fileURLToPath } from 'url';


// __dirname em ESM:
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ChildProcessManagerRED {

  #workers = [];
  #child_process = [];
  #initStartupProjectWindow = true;

  constructor() { }

  // inicia todos os workers
  async startAll() {
    const settings_read = await Settings_file.getFile();
    settings_read.projects.forEach(element => {
      if (element.autoStart === true) {
        this.#startWorkerNoderRED(element, element.id, element.name);
      }
    });
  }

  // para todos os workers
  async stopAll() {
    this.#child_process.forEach(element => {
      this.#stopWorkerNodeRed(element.id);
    });
  }

  async starWorker(iID, iName) {
    const settings_file = await Settings_file.getFile();
    const settings_read = settings_file.projects;

    const checkForkExiste = this.#child_process.find(item => item.id == iID);
    const ProjectExist = settings_read.find(item => item.id == iID);

    if (ProjectExist !== undefined && checkForkExiste === undefined) {
      this.#startWorkerNoderRED(ProjectExist, ProjectExist.id, ProjectExist.name);
    }
  }

  async stopWorker(iID, iName) {
    const checkForkExiste = this.#child_process.find(item => item.id == iID);
    if (checkForkExiste !== undefined) {
      this.#stopWorkerNodeRed(iID, iName);
    }
  }

  // Iniciar worker Node-RED passando settings file
  async #startWorkerNoderRED(iProject, iID, iName) {
    try {
      Logger.info(`start fork Node-RED: ${iName} - ${iID}`);

      const parametros = {
        name: iName,
        execPath: app.getPath('exe'),
        settings: iProject,
        id: iID
      };



      const childPath = path.resolve(__dirname, './NodeRedServerChildProcess.js');

      const child = fork(childPath, [JSON.stringify(parametros)], {
        stdio: ['pipe', 'pipe', 'pipe', 'ipc']
      });

      const now = new Date();
      const pad = (n) => n.toString().padStart(2, '0');
      const day = pad(now.getDate());
      const month = pad(now.getMonth() + 1);
      const year = now.getFullYear();

      const NodeRedPathCreate = path.join(iProject.settings.userDir, `logs`);
      const NodeRedPath = path.join(iProject.settings.userDir, 'logs', `${year}${month}${day}_log_nodered.txt`);

      await Settings_file.Createfolder(NodeRedPathCreate);

      const logFile = fs.createWriteStream(NodeRedPath, { flags: 'a' });
      child.stdout.pipe(logFile);
      child.stderr.pipe(logFile);

      child.on('message', (msg) => {
        this.#setMessageFork(msg);
      });

      child.on('exit', (code, signal) => {
        Logger.info(`Exit fork Node-RED: ${iName} - ${iID}`);
        this.#deleteForkLsit(iName);
      });

      child.on('error', (err) => {
        Logger.error(`Error fork Node-RED: ${iName} - ${iID}`);
        // tenta reiniciar
        this.#startWorkerNoderRED(iProject, iID, iName);
      });

      this.#child_process.push({
        child_process: child,
        id: iID,
        name: iName,
        pid: null,
        rssBytes: null,
        cpuPercent: null,
        diskReadBytesPerSec: null,
        diskWriteBytesPerSec: null
      });

    } catch (err) {
      Logger.error(`error fork Node-RED: ${iName} - ${iID}. ${err}`);
    }
  }

  // pega mensagem de volta do fork para setar pid
  async #setMessageFork(iMsg) {
    let payload;
    try {
      payload = JSON.parse(iMsg);
    } catch (err) {
      Logger.error(`Invalid fork message (not JSON): ${iMsg}`);
      return;
    }

    // atualiza pid no array
    this.#child_process.forEach((element) => {
      if (element.name == payload.name) {
        if (payload.pid !== undefined) {
          element.pid = payload.pid;
        }
        if (payload.rssBytes !== undefined) {
          element.rssBytes = payload.rssBytes;
        }
        if (payload.cpuPercent !== undefined) {
          element.cpuPercent = payload.cpuPercent;
        }
        if (payload.diskReadBytesPerSec !== undefined) {
          element.diskReadBytesPerSec = payload.diskReadBytesPerSec;
        }
        if (payload.diskWriteBytesPerSec !== undefined) {
          element.diskWriteBytesPerSec = payload.diskWriteBytesPerSec;
        }
      }
    });

    if (payload.cmd === 'metrics') {
      return;
    }

    const settings_read = await Settings_file.getFile();

    // Open init screen 
    if (settings_read.app.startupProjectWindow.enabled &&
      settings_read.app.startupProjectWindow.id === payload.id &&
      this.#initStartupProjectWindow) {

      ElectronWindow.BrowserWindowURL(settings_read.app.startupProjectWindow.url, settings_read.app.startupProjectWindow.fullscreen);
      this.#initStartupProjectWindow = false;
    }
  }

  async #stopWorkerNodeRed(iID, iName) {
    Logger.info(`Stop fork Node-RED: ${iName} - ${iID}`);

    let index = 0;
    let index_delete = -1;

    this.#child_process.forEach(async (element) => {
      if (element.id == iID) {
        index_delete = index;
        await element.child_process.kill();
        this.#child_process.splice(index_delete, 1);
      }
      index++;
    });
  }

  async #deleteForkLsit(iName) {
    let index = 0;
    let index_delete = -1;
    this.#child_process.forEach(async (element) => {
      if (element.name == iName) {
        index_delete = index;
        this.#child_process.splice(index_delete, 1);
      }
      index++;
    });
  }

  async getStatus() {
    const payload = [];
    this.#child_process.forEach(element => {
      payload.push({
        id: element.id,
        name: element.name,
        pid: element.pid,
        rssBytes: element.rssBytes,
        cpuPercent: element.cpuPercent,
        diskReadBytesPerSec: element.diskReadBytesPerSec,
        diskWriteBytesPerSec: element.diskWriteBytesPerSec
      });
    });
    return payload;
  }
}

export default new ChildProcessManagerRED();

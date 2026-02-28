// Settings_file.js
import fs from 'node:fs/promises';
import path from 'path';
import { app } from 'electron';
import Logger from './Logger.js';
import { randomUUID } from 'node:crypto';

const diretorioExecucao = path.dirname(app.getPath('exe'));

// Caminho para o arquivo JSON na raiz do projeto
const filePath = path.join(diretorioExecucao, 'Node-RED', 'settings.json');

// Patch node-red exe
const NodeRedPath = path.join(diretorioExecucao, 'Node-RED', 'main');

// static http
const StaticPatch = path.join(diretorioExecucao, 'Node-RED', 'static');

class Settings_file {

  async initCheckFile() {
    // check file exist
    const checkFile = await this.checkFile(filePath);

    if (checkFile === false) {
      await this.#Creat_file();
    }

    // Check Patch projects
    await this.writePatchProject();
  }

  async writePatchProject() {
    const settings_file = await this.getFile();

    settings_file.projects.forEach(element => {
      const project_name = element.name;
      const staticFolder = element.settings.StaticFolder;

      const projectPath = path.join(diretorioExecucao, 'Node-RED', project_name);
      const staticPath = path.join(diretorioExecucao, staticFolder);

      element.settings.userDir = projectPath;
      element.settings.StaticPatch = staticPath;
    });

    await this.WriteFile(settings_file);
  }

  async WriteFile(iPayload) {
    try {
      const ContentJson = JSON.stringify(iPayload, null, 2);
      await fs.writeFile(filePath, ContentJson);
      return true;
    } catch (error) {
      Logger.error("error write ", error);
      return false;
    }
  }

  async getFile() {
    try {
      const data = await fs.readFile(filePath, { encoding: 'utf8' });
      const result = JSON.parse(data);
     
      return  result
    } catch (err) {
      Logger.info("create default settings.json: " + err);
      const exists = await this.checkFile(filePath);

      if (exists === true) {
        return true;
      } else {
        await this.#Creat_file();
        const data = await fs.readFile(filePath, { encoding: 'utf8' });

        let file = JSON.parse(data);

        return file
      }
    }
  }



  async Createfolder(ipatch) {
    try {
      await fs.mkdir(ipatch, { recursive: true });
      return { status: true };
    } catch {
      return { status: false };
    }
  }

  async deleteFolder(ipatch) {
    try {
      await fs.rm(ipatch, { recursive: true, force: true });
      return { status: true };
    } catch (err) {
      Logger.error(err);
      return { status: false };
    }
  }

  async checkFile(iSettingsFile) {
    try {
      await fs.access(iSettingsFile); // se não lançar erro, o arquivo existe
      return true;
    } catch {
      return false;
    }
  }

  async #Creat_file() {
    try {
      const UUID = randomUUID();
      const content = {
        app: {
          name: "Node-RED Desktop2",
          version: "2.0.0",
          startupProjectWindow: {
            enabled: true,
            fullscreen: false,
            id: UUID,
            url: "http://localhost:1880/red/admin/"
          },
          description: ""
        },
        redundancy: {
          enabled: false,
          type: "primary",
          ip: "127.0.0.1",
          port: 41235,
          timeout_ms_primary: 250,
          timeout_ms_secondary: 500
        },
        projects: [
          {
            name: "Main",
            id: UUID,
            description: "",
            uiPort: 1880,
            autoStart: true,
            UrlAdmin: "http://localhost:1880/red/admin/",
            UrlDashboard: "http://localhost:1880/Dashboard/",
            adminAuth: false,
            settings: {
              flowFile: "flows.json",
              httpAdminRoot: "/red/admin",
              httpNodeRoot: "/",
              uiPort: 1880,
              ui: {
                path: "/"
              },
              editorTheme: {
                page: {
                  title: "Node-RED-Desktop Main"
                },
                projects: {
                  enabled: false
                },
                tours: true
              },
              userDir: NodeRedPath,
              StaticPatch: StaticPatch,
              functionGlobalContext: {},
              adminAuth: null,
              StaticFolder: "static",
              https: {
                enabled: false,
                key: "",
                cert: ""
              },
              telemetry: {
                enabled: false,
                updateNotification: false
              }
            }
          }
        ]
      };

      // Cria o diretório (e subpastas) caso não exista
      await fs.mkdir(NodeRedPath, { recursive: true });

      // Write file
      const ContentJson = JSON.stringify(content, null, 2);
      await fs.writeFile(filePath, ContentJson);
      return true;
    } catch (err) {
      Logger.error(err);
      return false;
    }
  }
}

export default new Settings_file();

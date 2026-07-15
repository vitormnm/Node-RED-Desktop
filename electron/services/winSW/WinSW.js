import { app } from 'electron';
import fs from 'node:fs/promises';
import { exec } from 'child_process';
import util from 'util';
import path from 'path';
import Logger from "../Logger.js";
import Settings_file from '../Settings_file.js';

// Transforming exec into a Promise-based function
const execAsync = util.promisify(exec);

class WinSW {

  async createService() {
    try {
      await this.#writeConfigXML();

      const diretorioExecucao = path.dirname(app.getPath('exe'));
      const WinSWFile = path.join(diretorioExecucao, 'WinSW', 'WinSW.exe');

      const { stdout, stderr } = await execAsync(`"${WinSWFile}" "install"`);

      if (stderr) {
        Logger.error("windows service error create: " + stderr);
        return { status: false };
      }

      Logger.info("windows service created successfully");
      return { status: true };

    } catch (err) {
      Logger.error("windows service error create: " + err);
      return { status: false };
    }
  }

  async StartService() {
    try {
      const settings = await Settings_file.getFile();
      const serviceName = settings.service?.name || "Node-RED-Desktop";
      const { stdout, stderr } = await execAsync(`net start "${serviceName}"`);

      if (stderr) Logger.error("Erro:", stderr);

    } catch (err) {
      Logger.error("Failed to start the service:", err);
    }
  }

  async stopService() {
    try {
      const settings = await Settings_file.getFile();
      const serviceName = settings.service?.name || "Node-RED-Desktop";
      const { stdout, stderr } = await execAsync(`net stop "${serviceName}"`);

      if (stderr) {
        Logger.error("Error while running:", stderr);
        return;
      }

      Logger.info("stop service");

    } catch (err) {
      Logger.error("Error while running:", err);
    }
  }

  async DeleteService() {
    try {
      const settings = await Settings_file.getFile();
      const serviceName = settings.service?.name || "Node-RED-Desktop";
      const { stdout, stderr } = await execAsync(`SC DELETE "${serviceName}"`);

      if (stderr) {
        Logger.error("windows service error execute: " + stderr);
        return { status: false };
      }

      Logger.info("windows service delete successfully");
      return { status: true };

    } catch (err) {
      Logger.error("windows service delete error: " + err);
      return { status: false };
    }
  }

  async #writeConfigXML() {
    const settings = await Settings_file.getFile();
    const serviceConfig = settings.service || {
      name: "Node-RED-Desktop",
      description: "Node-RED-Desktop",
      onFailureAction: "restart",
      onFailureDelay: "5 sec",
      startMode: "Automatic"
    };

    const serviceName = serviceConfig.name || "Node-RED-Desktop";
    const serviceDesc = serviceConfig.description || "Node-RED-Desktop";
    const onFailureAction = serviceConfig.onFailureAction || "restart";
    const onFailureDelay = serviceConfig.onFailureDelay || "5 sec";
    const startMode = serviceConfig.startMode || "Automatic";

    const diretorioExecucao = path.dirname(app.getPath('exe'));
    const appDiretorio = app.getPath('exe');
    const WinSWFile = path.join(diretorioExecucao, 'WinSW', 'WinSW.xml');

    const config_xml = `
        <service>
            <id>${serviceName}</id>
            <name>${serviceName}</name>
            <description>${serviceDesc}</description>
            
            <executable>${appDiretorio}</executable>
            <arguments></arguments>
            <workingdirectory>${diretorioExecucao}</workingdirectory>

            <logpath>${diretorioExecucao}\\logs</logpath>
            <log mode="roll"></log>

            <onfailure action="${onFailureAction}" delay="${onFailureDelay}"/>

            <startmode>${startMode}</startmode>
        </service>
    `;

    await fs.writeFile(WinSWFile, config_xml);
  }

}

export default new WinSW();

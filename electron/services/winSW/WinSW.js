import { app } from 'electron';
import fs from 'node:fs/promises';
import { exec } from 'child_process';
import util from 'util';
import path from 'path';
import Logger from "../Logger.js";

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
      const { stdout, stderr } = await execAsync(`net start Node-Red-Desktop`);

      if (stderr) Logger.error("Erro:", stderr);

    } catch (err) {
      Logger.error("Failed to start the service:", err);
    }
  }

  async stopService() {
    try {
      const { stdout, stderr } = await execAsync(`net stop Node-RED-Desktop`);

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
      const { stdout, stderr } = await execAsync(`SC DELETE Node-Red-Desktop`);

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
    const diretorioExecucao = path.dirname(app.getPath('exe'));
    const appDiretorio = app.getPath('exe');
    const WinSWFile = path.join(diretorioExecucao, 'WinSW', 'WinSW.xml');

    const config_xml = `
        <service>
            <id>Node-RED-Desktop</id>
            <name>Node-RED-Desktop</name>
            <description>Node-RED-Desktop</description>
            
            <executable>${appDiretorio}</executable>
            <arguments></arguments>
            <workingdirectory>${diretorioExecucao}</workingdirectory>

            <logpath>${diretorioExecucao}\\logs</logpath>
            <log mode="roll"></log>

            <onfailure action="restart" delay="5 sec"/>

            <startmode>Automatic</startmode>
        </service>
    `;

    await fs.writeFile(WinSWFile, config_xml);
  }

}

export default new WinSW();

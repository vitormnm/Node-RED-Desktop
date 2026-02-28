const fs = require('fs');
const archiver = null
const unzipper = null
const path = require('path');
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const Logger = require('../services/Logger')


class SaveProjectZip {

    async getBackup() {
        const { canceled, filePath } = await dialog.showSaveDialog({
            title: 'save project ZIP',
            defaultPath: 'Node-RED-Desktop-project.zip',
            filters: [{ name: 'ZIP', extensions: ['zip'] }]
        });

        if (canceled || !filePath) return { success: false };

        try {
            await this._zipFolder(filePath);
            return { success: true, path: filePath };
        } catch (err) {
            Logger.error(err)
  
            return { success: false, error: err.message };
        }

    }

    async setBackup() {

        const { canceled, filePaths } = await dialog.showOpenDialog({
            title: 'Escolher arquivo para upload',
            filters: [{ name: 'ZIP', extensions: ['zip'] }],
            properties: ['openFile']
        });
  
        if (canceled || filePaths.length === 0) return { success: false };


        try {
            const fileSelect = filePaths[0];
            await this._unzipfolder(fileSelect);
            return { success: true, path: filePaths };
        } catch (err) {
            Logger.error(err)
            return { success: false, error: err.message };
        }

    }


    // --- Função para zipar uma pasta ---
    _zipFolder(arquivoZipDestino) {
        return new Promise((resolve, reject) => {
            const diretorioExecucao = path.dirname(app.getPath('exe'));
            var pastaOrigem = path.join(diretorioExecucao, 'Node-RED');
            const output = fs.createWriteStream(arquivoZipDestino);
            const archive = archiver('zip', { zlib: { level: 9 } });

            output.on('close', () => {
                Logger.info(`Zip criado: ${archive.pointer()} bytes`)
         
                resolve();
            });

            archive.on('error', (err) => reject(err));

            archive.pipe(output);
            archive.directory(pastaOrigem, false);
            archive.finalize();
        });
    }



    // --- Função para deszipar ---
    async _unzipfolder(arquivoZip) {
        const diretorioExecucao = path.dirname(app.getPath('exe'));
        const pastaDestino = path.join(diretorioExecucao, 'Node-RED');



        // Usamos Parse() para controlar cada entry e sobrescrever
        const directory = await unzipper.Open.file(arquivoZip);

        for (const entry of directory.files) {
            const filePath = path.join(pastaDestino, entry.path);

            if (entry.type === "Directory") {
                await fs.promises.mkdir(filePath, { recursive: true });
            } else {
                // 🔹 sempre sobrescreve o arquivo
                await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
                await new Promise((resolve, reject) => {
                    entry.stream()
                        .pipe(fs.createWriteStream(filePath))
                        .on("finish", resolve)
                        .on("error", reject);
                });
            }
        }
         Logger.info(`extraction completed (Overwrite)`)

    }


}

module.exports = new SaveProjectZip();





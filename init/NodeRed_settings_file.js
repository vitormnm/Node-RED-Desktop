const fs = require('node:fs/promises');
const path = require('path');
const { dirname } = require('path');
const { app } = require('electron');

const diretorioExecucao = path.dirname(app.getPath('exe'));

// Caminho para o arquivo JSON na raiz do projeto
const filePath = path.join(diretorioExecucao, 'settings.json');



//Patch node-red exe
const NodeRedPath = path.join(diretorioExecucao, 'node-red');
//static http
var StaticPatch = path.join(diretorioExecucao, 'static');


async function settings_file() {
    try {
        const data = await fs.readFile(filePath, { encoding: 'utf8' });
        var result = JSON.parse(data);

        StaticPatch = path.join(diretorioExecucao, 'static');
        //Checks if the configured userDir is the same as the one the app is running if different, writes the current directory to the app directory and static route http
        if (result.userDir != path.join(diretorioExecucao, 'node-red')) {

            result.userDir = path.join(diretorioExecucao, 'node-red')
            result.StaticPatch = path.join(diretorioExecucao, result.StaticFolder)
            //Escreve novo arquivo
            // Convertendo os dados para formato JSON
        }

        result.StaticPatch = path.join(diretorioExecucao, result.StaticFolder);
        const NewConfigFile = JSON.stringify(result, null, 2);
        await fs.writeFile(filePath, NewConfigFile);

        return result;

        //Create settings file if it doesn't exist
    } catch (err) {
        await Creat_file()
        const data = await fs.readFile(filePath, { encoding: 'utf8' });
        var result = JSON.parse(data);

        return JSON.parse(data);
    }
}

async function Creat_file() {
    try {
        const content = {
            flowFile: "flows.json",
            httpAdminRoot: "/red/admin",
            httpNodeRoot: "/",
            uiPort: 1880,
            ui: { path: "/" },
            editorTheme: {
                page: {
                    title: "Node-RED-Desktop"
                },
                projects: {
                    enabled: false
                },
            },
            userDir: NodeRedPath,
            StaticPatch: StaticPatch,
            functionGlobalContext: {},
            adminAuth: null,
            StaticFolder: "static",
            UrlHomeScreen: "http://localhost:1880/red/admin/",
            UrlAdmin: "http://localhost:1880/red/admin/",
            UrlDashboard: "http://localhost:1880/Dashboard/"
        }




        // Convertendo os dados para formato JSON
        const ContentJson = JSON.stringify(content, null, 2);

        await fs.writeFile(filePath, ContentJson);
        return true
    } catch (err) {
        console.log(err);
    }
}



module.exports =
{
    settings_file: settings_file,

}

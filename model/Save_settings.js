const fs = require('node:fs/promises');
const path = require('path');
const { dirname } = require('path');
const { app } = require('electron');


async function Save_settings(payload) {


    const diretorioExecucao = path.dirname(app.getPath('exe'));

    let filePath = path.join(diretorioExecucao, 'settings.json');


    //read
    try {
        let data = await fs.readFile(filePath, { encoding: 'utf8' });
        let PayloadSettings = JSON.parse(data);

       
         //Write Settings
        PayloadSettings.uiPort = payload.inp_uiPort
        PayloadSettings.UrlHomeScreen = payload.inp_UrlHomeScreen 
        PayloadSettings.UrlAdmin = payload.inp_UrlAdmin
        PayloadSettings.UrlDashboard= payload.inp_UrlDashboard
        PayloadSettings.editorTheme.page.title = payload.inp_AdminTitle
        PayloadSettings.inp_StaticFolder = payload.StaticFolder
        PayloadSettings.editorTheme.projects.enabled = payload.inp_projects
        PayloadSettings.httpAdminRoot = payload.inp_httpAdminRoot
        PayloadSettings.httpNodeRoot = payload.inp_httpNodeRoot
        PayloadSettings.flowFile = payload.inp_flowFile
        
        const ContentJson = JSON.stringify(PayloadSettings, null, 2);

        await fs.writeFile(filePath, ContentJson);
        return true

    } catch (err) {

    }

 
}


module.exports = Save_settings;


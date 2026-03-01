import Settings_file from "../services/Settings_file.js";
import path from 'path';
import { app, BrowserWindow } from 'electron';
import Password_settings from "../model/Password_settings.js";

import ChildProcessManagerRED from '../services/childProcess/ChildProcessManagerRED.js';
import { randomUUID } from 'crypto';
const diretorioExecucao = path.dirname(app.getPath('exe'));
import Logger from "../services/Logger.js";

function hasDuplicateUsernames(users) {
    const normalized = new Set();

    for (const user of users) {
        const username = String(user?.username ?? "").trim().toLowerCase();
        if (!username) {
            continue;
        }

        if (normalized.has(username)) {
            return true;
        }

        normalized.add(username);
    }

    return false;
}

class ControlProject {

    async add(iPayload) {

        try {

            var settings_file = await Settings_file.getFile();

            //Check Project exist
            const ProjectNameCheck = settings_file.projects.some(u => u.name === iPayload.name);

            var result = {}

            if (ProjectNameCheck == false) {

                //Patch node-red exe
                const NodeRedPath = path.join(diretorioExecucao, "Node-RED", iPayload.name);

                //static http
                var StaticPatch = path.join(diretorioExecucao, iPayload.settings.StaticPatch);

                var adminAuth = null;
                //CheckPassword
                if (iPayload.adminAuth == true) {
                    const users = Array.isArray(iPayload?.settings?.adminAuth?.users) ? iPayload.settings.adminAuth.users : [];
                    if (hasDuplicateUsernames(users)) {
                        return { "status": false, "message": "Duplicate usernames are not allowed." };
                    }

                    adminAuth = await Password_settings.enable_password_writing(iPayload.settings.adminAuth.users);
                }

                var id = randomUUID()

                var newProject = {
                    "name": iPayload.name,
                    "id": id,
                    "description": iPayload.description ?? "",
                    "uiPort":  parseInt(iPayload.uiPort) ,
                    "autoStart": iPayload.autoStart,
                    "UrlAdmin": iPayload.UrlAdmin,
                    "UrlDashboard": iPayload.UrlDashboard,
                    "adminAuth" : iPayload.adminAuth,
                    "settings": {
                        "flowFile": iPayload.settings.flowFile,
                        "httpAdminRoot": iPayload.settings.httpAdminRoot,
                        "httpNodeRoot": iPayload.settings.httpNodeRoot,
                        "uiPort": parseInt(iPayload.uiPort),
                        "ui": {
                            "path": "/"
                        },
                        "editorTheme": {
                            "page": {
                                "title": iPayload.settings.editorTheme.page.title
                            },
                            "projects": {
                                "enabled": iPayload.settings.editorTheme.projects.enabled
                            },
                            "tours": false
                        },
                        "userDir": NodeRedPath,
                        "StaticPatch": StaticPatch,
                        "functionGlobalContext": iPayload.settings.functionGlobalContext,
                        "adminAuth": adminAuth,
                        "StaticFolder": iPayload.settings.StaticFolder,
                        "https": {
                            "enabled": iPayload.settings.https.enabled,
                            "key": iPayload.settings.https.key,
                            "cert": iPayload.settings.https.cert
                        },
                        "telemetry": {
                            "enabled": iPayload.settings.telemetry.enabled,
                            "updateNotification": iPayload.settings.telemetry.updateNotification
                        }
                    }
                }


                settings_file.projects.push(newProject)

                await Settings_file.WriteFile(settings_file);

                if (iPayload.autoStart == true) {
                    await ChildProcessManagerRED.starWorker(id, iPayload.name)
                }

                Logger.info(`${iPayload.name} created`)
                result = { "status": true }
            } else {
                result = { "status": false, "message": "Project name already exists." }
            }

            BrowserWindow.getAllWindows().forEach(win => {
                win.webContents.send("ctl_serverConfig_uploadProject_msg", { texto: 'regresh' });
            });

            return result

        } catch {
            return { "status": false }
        }

    }

    async update(iPayload) {
        try {
            //Patch node-red exe
            const NodeRedPath = path.join(diretorioExecucao, "Node-RED", iPayload.name);

            //static http
            var StaticPatch = path.join(diretorioExecucao, iPayload.settings.StaticPatch);

            var settings_file = await Settings_file.getFile();

            var adminAuth = null;
            //CheckPassword
            if (iPayload.adminAuth == true) {
                const users = Array.isArray(iPayload?.settings?.adminAuth?.users) ? iPayload.settings.adminAuth.users : [];
                if (hasDuplicateUsernames(users)) {
                    return { "status": false, "message": "Duplicate usernames are not allowed." };
                }

                adminAuth = await Password_settings.enable_password_writing(iPayload.settings.adminAuth.users);
            }

            var newProject = {
                "name": iPayload.name,
                "id": iPayload.id,
                "description": iPayload.description ?? "",
                "uiPort": parseInt(iPayload.uiPort),
                "autoStart": iPayload.autoStart,
                "UrlAdmin": iPayload.UrlAdmin,
                "UrlDashboard": iPayload.UrlDashboard,
                "adminAuth" : iPayload.adminAuth,
                "settings": {
                    "flowFile": iPayload.settings.flowFile,
                    "httpAdminRoot": iPayload.settings.httpAdminRoot,
                    "httpNodeRoot": iPayload.settings.httpNodeRoot,
                    "uiPort": parseInt(iPayload.uiPort),
                    "ui": {
                        "path": "/"
                    },
                    "editorTheme": {
                        "page": {
                            "title": iPayload.settings.editorTheme.page.title
                        },
                        "projects": {
                            "enabled": iPayload.settings.editorTheme.projects.enabled
                        },
                        "tours": false
                    },
                    "userDir": NodeRedPath,
                    "StaticPatch": StaticPatch,
                    "functionGlobalContext": iPayload.settings.functionGlobalContext,
                    "adminAuth": adminAuth,
                    "StaticFolder": iPayload.settings.StaticFolder,
                    "https": {
                        "enabled": iPayload.settings.https.enabled,
                        "key": iPayload.settings.https.key,
                        "cert": iPayload.settings.https.cert
                    },
                    "telemetry": {
                        "enabled": false,
                        "updateNotification": false
                    }
                }
            }


            //checkid
            //check id delete
            var index = 0
            var index_update = null
            settings_file.projects.forEach(element => {

                if (element.id == iPayload.id) {

                    index_update = index
                }

                index++
            });

            settings_file.projects[index_update] = newProject

            Settings_file.WriteFile(settings_file);
            Logger.info(`${iPayload.name} update`)

            BrowserWindow.getAllWindows().forEach(win => {
                win.webContents.send("ctl_serverConfig_uploadProject_msg", { texto: 'regresh' });
            });
            return { "status": true }

        } catch {
            Logger.info(`${iPayload.name} erro update`)
            return { "status": false, "message": "Failed to update project." }
        }

    }

    async delete(iPayload) {

        try {

            await ChildProcessManagerRED.stopWorker(iPayload.id, iPayload.name)

            var settings_file = await Settings_file.getFile();

            //check id delete
            var index = 0
            var index_delete = null
            settings_file.projects.forEach(element => {

                if (element.id == iPayload.id) {

                    index_delete = index
                }

                index++
            });

            let userDir = settings_file.projects[index_delete].settings.userDir

            settings_file.projects.splice(index_delete, 1); // 1 é a quantidade de elementos a remover

            await Settings_file.WriteFile(settings_file);
            await Settings_file.deleteFolder(userDir);

            Logger.info(`${iPayload.name} delete`)

            BrowserWindow.getAllWindows().forEach(win => {
                win.webContents.send("ctl_serverConfig_uploadProject_msg", { texto: 'regresh' });
            });
            return { "status": true }

        } catch (error) {
            Logger.error("delete error", error)

            return { "status": false }
        }

    }

}
export default new ControlProject();

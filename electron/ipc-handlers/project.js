import { ipcMain, BrowserWindow } from 'electron';

import ChildProcessManagerRED from "../services/childProcess/ChildProcessManagerRED.js";
import ControlProject from "../model/ControlProject.js";
import Settings_file from "../services/Settings_file.js"

import Project_openElectronWindow from "../model/Project_openElectronWindow.js"
import ProjectLog from "../model/ProjectLog.js";

export function registerProjectRoutes() {

  ipcMain.handle('GET:/projects', async () => {
    return [{ id: 1, name: "Teste" }];
  });


  ipcMain.handle('DELETE:/projects/:id', async (_, { id }) => {
    console.log("delete project", id);
    return { deleted: true };
  });

 

  //Read full config.json file
  ipcMain.handle('GET:/checkSettings', async (event, data) => {
    return await Settings_file.getFile();
  })



  //Read full config.json file
  ipcMain.handle('POST:/ctl_project_startWoker', async (event, data) => {
    ChildProcessManagerRED.starWorker(data.id, data.name);
  })

  ipcMain.handle('POST:/ctl_project_windows_openEditor', async (event, data) => {
    Project_openElectronWindow.setActionOpen(data.action, data.id)
  })


  //Read full config.json file
  ipcMain.handle('POST:/ctl_project_stopWoker', async (event, data) => {
    ChildProcessManagerRED.stopWorker(data.id, data.name);
  })

  //Read full config.json file
  ipcMain.handle('POST:/ctl_project_addProject', async (event, data) => {
    return await ControlProject.add(data);
  })

  ipcMain.handle('POST:/ctl_project_log_tail', async (event, data) => {
    return await ProjectLog.getTail(data);
  })

  //Read full config.json file
  ipcMain.handle('PUT:/ctl_project_updateProject', async (event, data) => {
    console.log("PUT:/ctl_project_updateProject")
    return await ControlProject.update(data);
  })

  //Read full config.json file
  ipcMain.handle('DELETE:/ctl_project_deleteProject', async (event, data) => {
    return await ControlProject.delete(data);
  })

  //Read full config.json file
  ipcMain.handle('GET:/ctl_project_getStatus', async (event, data) => {
    return await ChildProcessManagerRED.getStatus()
  })

  ipcMain.handle('get-window-id', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    return win ? win.id : null;
  });




}

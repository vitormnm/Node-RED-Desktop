import { ipcMain, BrowserWindow, app, dialog } from 'electron';

import ChildProcessManagerRED from "../services/childProcess/ChildProcessManagerRED.js";
import ControlProject from "../model/ControlProject.js";
import Settings_file from "../services/Settings_file.js"

import Project_openElectronWindow from "../model/Project_openElectronWindow.js"
import ProjectLog from "../model/ProjectLog.js";
import ReorderProject from "../model/ReorderProject.js";

export function registerProjectRoutes() {

  ipcMain.handle('GET:/projects', async () => {
    return [{ id: 1, name: "Teste" }];
  });


  ipcMain.handle('DELETE:/projects/:id', async (_, { id }) => {
    
    return { deleted: true };
  });

 

  //Read full config.json file
  ipcMain.handle('GET:/checkSettings', async (event, data) => {
    const settings = await Settings_file.getFile();
    return {
      ...settings,
      appVersion: app.getVersion()
    };
  })



  //Read full config.json file
  ipcMain.handle('POST:/ctl_project_startWoker', async (event, data) => {
    ChildProcessManagerRED.starWorker(data.id, data.name);
  })

  ipcMain.handle('POST:/ctl_project_windows_openEditor', async (event, data) => {
    Project_openElectronWindow.setActionOpen(data.action, data.id, data.fullscreen ?? false)
  })


  //Read full config.json file
  ipcMain.handle('POST:/ctl_project_stopWoker', async (event, data) => {
    ChildProcessManagerRED.stopWorker(data.id, data.name);
  })

  //Read full config.json file
  ipcMain.handle('POST:/ctl_project_restartWoker', async (event, data) => {
    ChildProcessManagerRED.restartWorker(data.id, data.name);
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

  ipcMain.handle('POST:/ctl_project_select_file', async (event, data = {}) => {
    try {
      const win = BrowserWindow.fromWebContents(event.sender);
      const options = {
        title: data.title || 'Select File',
        properties: ['openFile'],
        filters: data.filters || [{ name: 'All Files', extensions: ['*'] }]
      };
      const result = win ? await dialog.showOpenDialog(win, options) : await dialog.showOpenDialog(options);
      if (!result.canceled && result.filePaths && result.filePaths.length > 0) {
        return { status: true, canceled: false, filePath: result.filePaths[0] };
      }
      return { status: true, canceled: true, filePath: null };
    } catch (error) {
      return { status: false, message: error.message };
    }
  });

  ipcMain.handle('POST:/ctl_project_select_folder', async (event, data = {}) => {
    try {
      const win = BrowserWindow.fromWebContents(event.sender);
      const options = {
        title: data.title || 'Select Folder',
        properties: ['openDirectory']
      };
      const result = win ? await dialog.showOpenDialog(win, options) : await dialog.showOpenDialog(options);
      if (!result.canceled && result.filePaths && result.filePaths.length > 0) {
        return { status: true, canceled: false, folderPath: result.filePaths[0] };
      }
      return { status: true, canceled: true, folderPath: null };
    } catch (error) {
      return { status: false, message: error.message };
    }
  });

  ipcMain.handle('PUT:/ctl_project_reorderProjects', async (event, data = {}) => {
    return await ReorderProject.reorder(data.orderedIds);
  });

  ipcMain.handle('POST:/ctl_project_reorderProjects', async (event, data = {}) => {
    return await ReorderProject.reorder(data.orderedIds);
  });

}

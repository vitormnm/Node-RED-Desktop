import { ipcMain } from 'electron';


import AppSettings from "../model/AppSettings.js";
import WinSW from "../services/winSW/WinSW.js";


export function registerSettingsRoutes() {



  //Read full config.json file
  ipcMain.handle('POST:/ctl_serverConfig_settings_save', async (event, data) => {
    console.log(data)
    try {
      await AppSettings.set_RedudancySettings(data);
      await AppSettings.set_startupProjectWindow(data);

      return {"status" : true}
    }catch{
        return {"status" : false}
    }
 
  })

  ipcMain.handle('POST:/ctl_serverConfig_service', async (event, data) => {
    return await WinSW.createService()
  })


  ipcMain.handle('DELETE:/ctl_serverConfig_service', async (event, data) => {
    return await WinSW.DeleteService()
  })



}
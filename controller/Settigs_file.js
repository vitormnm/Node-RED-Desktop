const { ipcMain } = require("electron");

const {settings_file} = require("../init/NodeRed_settings_file")
const Save_settings = require("../model/Save_settings")
module.exports = () => {

    //Read full config.json file
    ipcMain.handle('check_settings', async (event, data) => {
        event.sender.send('check_settings',   await settings_file())
    })


    ipcMain.handle('save_settings', async (event, data) => {
        await Save_settings(data)
      
    })


    
    





}
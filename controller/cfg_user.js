const { ipcMain } = require("electron");
const Password_settings = require("../model/Password_settings")
const {NodeRed_settings_file} = require("../init/NodeRed_settings_file")
module.exports = () => {


    ipcMain.handle('check_password', async (event, data) => {
        const password_settings = new Password_settings()
        event.sender.send('check_password', await  password_settings.check_enabled_password())
    })

    ipcMain.handle('enable_password_writing', async (event, data) => {
       
        const password_settings = new Password_settings()
        await password_settings.enable_password_writing(data.UserName , data.PassWord)
        event.sender.send('enable_password_writing', await  password_settings.check_enabled_password())
    })



    ipcMain.handle('disabled_password_writing', async (event, data) => {
        const password_settings = new Password_settings()
        var payload =  await  password_settings.disabled_password_writing()
        event.sender.send('disabled_password_writing',payload)
    })

    
    





}
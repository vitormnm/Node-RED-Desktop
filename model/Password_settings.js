const fs = require('node:fs/promises');
const path = require('path');
const { dirname } = require('path');
const { app } = require('electron');
const bcrypt = require('bcryptjs');

class Password_settings {

    constructor(filePath) {
        const diretorioExecucao = path.dirname(app.getPath('exe'));

        this.filePath = path.join(diretorioExecucao, 'settings.json');

    }

    async check_enabled_password() {

        try {
            var data = await fs.readFile(this.filePath, { encoding: 'utf8' });
            data = JSON.parse(data);

            let result = {}
            if (data.adminAuth == null) {
                result = {
                    "checked": false
                }
            } else if (Array.isArray(data.adminAuth.users)) {

                //Payload user
                result = {
                    "checked": true,
                    "UserName": data.adminAuth.users[0].username
                }
            }
          
            return result

        } catch (err) {
            console.log("erro read settings.js")
        }
    }


    async enable_password_writing(UserName, PassWord) {

        var PayloadSettings = {}
        var hashedPassword = ""
        //Hash Password
        try {
            // Generate a salt
            const saltRounds = 10;

            // Hash the password with the generated salt
            hashedPassword = await bcrypt.hash(PassWord, saltRounds);
       
        } catch (error) {
            console.log("erro hash settings.js")
            return false
        }


        try {
            var data = await fs.readFile(this.filePath, { encoding: 'utf8' });
            PayloadSettings = JSON.parse(data);



            PayloadSettings.adminAuth = {
                "type": "credentials",
                "users": [
                    {
                        "username": UserName,
                        "password": hashedPassword,
                        "permissions": "*"
                    }
                ]
            }


        } catch (err) {
            console.log("erro read settings.js")
            return false
        }

        //Write Settings
        try {
            const ContentJson = JSON.stringify(PayloadSettings, null, 2);

            await fs.writeFile(this.filePath, ContentJson);
            return true
        } catch (error) {
            console.log("erro write settings.js")
            return false
        }


    }

    async disabled_password_writing() {

     
        var PayloadSettings = {}
        try {
            var data = await fs.readFile(this.filePath, { encoding: 'utf8' });
            PayloadSettings = JSON.parse(data);

            PayloadSettings.adminAuth = null

        } catch (err) {
            console.log("erro read settings.js")
            return false
        }

        //Write Settings
        try {
            const ContentJson = JSON.stringify(PayloadSettings, null, 2);

            await fs.writeFile(this.filePath, ContentJson);
            return true
        } catch (error) {
            console.log("erro write settings.js")
            return false
        }
    }
}


module.exports = Password_settings;
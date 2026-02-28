// ES MODULES
import fs from 'node:fs/promises';
import path, { dirname } from 'path';
import { app } from 'electron';
import bcrypt from 'bcryptjs';

class Password_settings {

    constructor() {}

    async enable_password_writing(UserName, PassWord) {

        let hashedPassword = "";

        try {
            const saltRounds = 10;

            // Hash da senha
            hashedPassword = await bcrypt.hash(PassWord, saltRounds);

            return {
                type: "credentials",
                users: [
                    {
                        username: UserName,
                        password: hashedPassword,
                        permissions: "*"
                    }
                ]
            };

        } catch (error) {
            return null;
        }
    }
}

// EXPORTAÇÃO ES MODULE
export default new Password_settings();

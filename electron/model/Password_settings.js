// ES MODULES
import fs from 'node:fs/promises';
import path, { dirname } from 'path';
import { app } from 'electron';
import bcrypt from 'bcryptjs';

class Password_settings {

    constructor() {}

    async enable_password_writing(users = []) {

        try {
            const saltRounds = 10;

            const normalizedUsers = Array.isArray(users) ? users : [];
            const hashedUsers = [];

            for (const user of normalizedUsers) {
                const username = String(user?.username ?? "").trim();
                const passwordInput = String(user?.password ?? "");
                const permissions = user?.permissions === "read" ? "read" : "*";

                // Preserve already hashed passwords on update.
                const isAlreadyHashed = /^\$2[aby]\$\d+\$/.test(passwordInput);
                const password = isAlreadyHashed
                    ? passwordInput
                    : await bcrypt.hash(passwordInput, saltRounds);

                hashedUsers.push({
                    username,
                    password,
                    permissions
                });
            }

            return {
                type: "credentials",
                users: hashedUsers
            };

        } catch (error) {
            return null;
        }
    }
}

// EXPORTAÇÃO ES MODULE
export default new Password_settings();

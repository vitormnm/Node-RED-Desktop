import ElectronWindow from "../services/electron/ElectronWindow.js";
import Settings_file from "../services/Settings_file.js";
import { shell } from "electron";

class Project_openElectronWindow {
    async setActionOpen(iAction, iID) {
        try {
            const settings_file = await Settings_file.getFile();
            const project = settings_file.projects.find(item => item.id === iID);

            switch (iAction) {
                case "open_editor":
                    ElectronWindow.BrowserWindowURL(project.UrlAdmin);
                    break;

                case "open_editor_web":
                    // abre no navegador padrão
                    shell.openExternal(project.UrlAdmin);
                    break;

                case "open_dashboard":
                    ElectronWindow.BrowserWindowURL(project.UrlDashboard);
                    break;

                case "open_dashboard_web":
                    shell.openExternal(project.UrlDashboard);
                    break;

                case "open_folder":
                    shell.openPath(project.settings.userDir);
                    break;

                default:
                    break;
            }
        } catch {
            // trate erro se necessário
        }
    }
}

export default new Project_openElectronWindow();

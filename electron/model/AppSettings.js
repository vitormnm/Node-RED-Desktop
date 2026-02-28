import Settings_file from "../services/Settings_file.js";

class RedudancySettings {
  
  async set_RedudancySettings(iPayload) {
    const settings_file = await Settings_file.getFile();

    settings_file.redundancy = {
      enabled: iPayload.redundancy.enabled,
      type: iPayload.redundancy.type,
      ip: iPayload.redundancy.ip,
      port: parseInt(iPayload.redundancy.port) ,
      timeout_ms_primary: 250,
      timeout_ms_secondary: 500,
    };

    await Settings_file.WriteFile(settings_file);
  }

  async set_startupProjectWindow(iPayload) {
    const settings_file = await Settings_file.getFile();

    settings_file.app.startupProjectWindow = {
      enabled: iPayload.app.startupProjectWindow.enabled,
      fullscreen: iPayload.app.startupProjectWindow.fullscreen,
      id: iPayload.app.startupProjectWindow.id,
      url: iPayload.app.startupProjectWindow.url,
    };

    await Settings_file.WriteFile(settings_file);
  }
}

export default new RedudancySettings();

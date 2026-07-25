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

    settings_file.app.theme = iPayload.app.theme || "dark";

    settings_file.app.startupProjectWindow = {
      enabled: iPayload.app.startupProjectWindow.enabled,
      fullscreen: iPayload.app.startupProjectWindow.fullscreen,
      id: iPayload.app.startupProjectWindow.id,
      url: iPayload.app.startupProjectWindow.url,
    };

    await Settings_file.WriteFile(settings_file);
  }

  async set_ServiceSettings(iPayload) {
    const settings_file = await Settings_file.getFile();

    if (!settings_file.app) {
      settings_file.app = {};
    }

    const serviceData = iPayload.app?.service || iPayload.service || {};

    settings_file.app.service = {
      name: serviceData.name || "Node-RED-Desktop",
      description: serviceData.description || "Node-RED-Desktop",
      onFailureAction: serviceData.onFailureAction || "restart",
      onFailureDelay: serviceData.onFailureDelay || "5 sec",
      startMode: serviceData.startMode || "Automatic"
    };

    delete settings_file.service;

    await Settings_file.WriteFile(settings_file);
  }
}

export default new RedudancySettings();

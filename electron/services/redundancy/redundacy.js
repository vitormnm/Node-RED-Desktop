import redundacy_secondary from "./redundacy_secondary.js";
import redundacy_primary from "./redundacy_primary.js";
import Settings_file from "../../services/Settings_file.js";
import ChildProcessManagerRED from "../childProcess/ChildProcessManagerRED.js";

export default async function () {
    // Create settings and read
    const settings_read = await Settings_file.getFile();

    const redundancy = {
        enabled: settings_read.redundancy.enabled,
        type: settings_read.redundancy.type,
        ip: settings_read.redundancy.ip,
        port: settings_read.redundancy.port
    };

    if (redundancy.enabled && redundancy.type === "secondary") {
        redundacy_secondary(redundancy.ip, redundancy.port);
    }

    if (redundancy.enabled && redundancy.type === "primary") {
        redundacy_primary(redundancy.ip, redundancy.port);
    }

    if (redundancy.enabled === false) {
        ChildProcessManagerRED.startAll();
    }
}

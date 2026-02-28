import dgram from "dgram";
import { promisify } from "util";

import ChildProcessManagerRED from "../childProcess/ChildProcessManagerRED.js";
import Logger from "../Logger.js";
import Settings_file from "../Settings_file.js";

export default async function (IP, PORT) {

  Logger.info("Redudancy primary active");

  const MONITOR_IP = IP;
  const MONITOR_PORT = PORT;

  const socket = dgram.createSocket("udp4");

  const settings_file = await Settings_file.getFile();
  const TIMEOUT_MS = settings_file.redundancy.timeout_ms_primary;

  // Conversão do socket.send para async
  const sendAsync = promisify(socket.send.bind(socket));

  async function sendHeartbeat() {
    try {
      const message = Buffer.from("HEARTBEAT");
      await sendAsync(message, 0, message.length, MONITOR_PORT, MONITOR_IP);
    } catch (err) {
      // Ignorado como no código original
    }
  }

  async function start() {
    ChildProcessManagerRED.startAll();

    while (true) {
      await sendHeartbeat();
      await new Promise(resolve => setTimeout(resolve, TIMEOUT_MS));
    }
  }

  start();
}

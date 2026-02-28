import dgram from 'dgram';

import ChildProcessManagerRED from '../childProcess/ChildProcessManagerRED.js';
import Settings_file from '../Settings_file.js';
import Logger from '../Logger.js';

export default async function startSecondary(IP, PORT) {

  const server = dgram.createSocket('udp4');

  let lastHeartbeat = Date.now();

  const settings_file = await Settings_file.getFile();
  const TIMEOUT_MS = settings_file.redundancy.timeout_ms_secondary; // 3 segundos


  server.on('message', async (msg, rinfo) => {

    if (msg.toString() === 'HEARTBEAT') {
      if (rinfo.address === IP) {
        lastHeartbeat = Date.now();
      }
    }

  });


  server.on('listening', () => {
    const address = server.address();
    Logger.info(`starting redundancy secondary server listening on ${address.address}:${address.port}`);
  });



  async function checkHeartbeat() {

    let start_trigger = false;
    let stop_trigger = false;

    while (true) {

      const diff = Date.now() - lastHeartbeat;
      const offline = diff > TIMEOUT_MS;

      if (offline) {

        if (!start_trigger) {
          Logger.info("Start redundancy secondary");
          ChildProcessManagerRED.startAll();
          start_trigger = true;
          stop_trigger = false;
        }

      } else {

        if (!stop_trigger) {
          Logger.info("Stop redundancy secondary");
          ChildProcessManagerRED.stopAll();
          stop_trigger = true;
          start_trigger = false;
        }

      }

      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }


  server.bind(PORT, () => {
    checkHeartbeat(); // inicia quando o servidor ligar
  });
}

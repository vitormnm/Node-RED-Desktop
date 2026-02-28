// node-red-child-esm.js
import http from 'http';
import https from 'https';
import express from 'express';
import RED from 'node-red';
import path from 'path';
import fs from 'fs';

// It runs on Node-RED in a process originating from the childprocess.
(async () => {
  const jsonParam = JSON.parse(process.argv[2]);

  process.title = jsonParam.name;

  const execPath = path.dirname(jsonParam.execPath);
  // Creat settings and read
  const settings_read = jsonParam.settings.settings;

  // Create an Express app and a server
  const app = express();
  let server = http.createServer(app);

  if (jsonParam.settings.settings.https?.enabled === true) {
    const https_settings = {
      key: fs.readFileSync(jsonParam.settings.settings.https.key),
      cert: fs.readFileSync(jsonParam.settings.settings.https.cert),
    };

    server = https.createServer(https_settings, app);
  }

  // Add a simple route for static content served from 'public'
  app.use('/', express.static(settings_read.StaticPatch));

  // Initialise the runtime with a server and settings
  RED.init(server, settings_read);

  // Serve the editor UI from /red (httpAdminRoot)
  app.use(settings_read.httpAdminRoot, RED.httpAdmin);

  // Serve the http nodes UI from /api (httpNodeRoot)
  app.use(settings_read.httpNodeRoot, RED.httpNode);

  server.listen(settings_read.uiPort);

  // Check Port in use
  server.once('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error('Port in use close');
      process.exit();
    }
  });

  // Start the runtime
  RED.start().then(() => {
    const payload = {
      name: jsonParam.name,
      cmd: 'started',
      url: jsonParam.settings.UrlAdmin,
      pid: process.pid,
      id: jsonParam.id,
    };

    if (typeof process.send === 'function') {
      process.send(JSON.stringify(payload));
    } else {
      // fallback log if not running as child process
      console.log('Child payload:', payload);
    }

    // Periodic stats for the parent process to display
    let prevCpu = process.cpuUsage();
    let prevHr = process.hrtime.bigint();
    let prevRu = process.resourceUsage();
    setInterval(() => {
      const memory = process.memoryUsage();
      const nowHr = process.hrtime.bigint();
      const elapsedUs = Number(nowHr - prevHr) / 1000;
      prevHr = nowHr;

      const cpuDelta = process.cpuUsage(prevCpu);
      prevCpu = process.cpuUsage();

      const cpuUsedUs = cpuDelta.user + cpuDelta.system;
      const cpuPercent = elapsedUs > 0 ? (cpuUsedUs / elapsedUs) * 100 : 0;

      const ru = process.resourceUsage();
      const readDelta = ru.fsRead - prevRu.fsRead;
      const writeDelta = ru.fsWrite - prevRu.fsWrite;
      prevRu = ru;

      const metrics = {
        name: jsonParam.name,
        cmd: 'metrics',
        pid: process.pid,
        id: jsonParam.id,
        rssBytes: memory.rss,
        cpuPercent,
        diskReadBytesPerSec: elapsedUs > 0 ? (readDelta / (elapsedUs / 1e6)) : 0,
        diskWriteBytesPerSec: elapsedUs > 0 ? (writeDelta / (elapsedUs / 1e6)) : 0,
      };

      if (typeof process.send === 'function') {
        process.send(JSON.stringify(metrics));
      }
    }, 1000);
  });
})();

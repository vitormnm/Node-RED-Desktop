# Node-RED-Desktop

A cross-platform desktop application that bundles Node-RED and Node.js in a single Electron shell. No separate installation of Node.js or Node-RED is required.

## Features

- **Multiple Instances**: Run multiple isolated Node-RED servers on different ports via Node.js child processes.
- **Automatic Crash Recovery**: Automatically restarts failed or crashed instances with back-off delay (configurable via `autoRestart` option).
- **Embedded & External Browsing**: Open Node-RED editor and dashboard in custom Electron windows or the system's default browser.
- **Windows Service Wrapper**: Install and run the application as a Windows service at system boot using the bundled WinSW.
- **High-Availability Redundancy**: Primary/Secondary redundancy mode using UDP heartbeat synchronization for automatic failover.
- **Per-Instance Logging**: Capture and save daily rotating stdout/stderr logs for every instance.
- **Secure Admin Authentication**: Protect instances using custom bcrypt-hashed credentials stored in configuration.
- **HTTPS Support**: Secure local instances using TLS certificate and key files.
- **Cross-Platform Support**: Compatible with Windows 10/11 x64 and Ubuntu LTS x64.

![node-red-desktop](/resources/node-red-desktop-demonstration.gif) 

## Build

clone app, open the project directory

```bash
  npm install
```
Build 64 bits
```bash
  npm run build64
```
### Support the development of this project and others if you found it useful.
<a href="https://buymeacoffee.com/vitormnm">
    <img src="./resources/bmc-button.svg" alt="Logo" width="200">
</a>

## author

- [@vitormnm](https://vitormiao.com/)

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)



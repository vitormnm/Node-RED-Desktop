


module.exports = async function ServerNodeRed() {
  var http = require('http');
  var express = require("express");
  var RED = require("node-red");
  const path = require("path");
  const fs = require('fs');
  const { settings_file } = require("./NodeRed_settings_file");



  try {
    // Create an Express app
    var app = express();

    //Creat settings and read
    var settings_read = await settings_file()

    // Add a simple route for static content served from 'public'
    app.use("/", express.static(settings_read.StaticPatch));

    // Create a server
    var server = http.createServer(app);

    // Initialise the runtime with a server and settings
    RED.init(server, settings_read);

    // Serve the editor UI from /red
    app.use(settings_read.httpAdminRoot, RED.httpAdmin);

    // Serve the http nodes UI from /api
    app.use(settings_read.httpNodeRoot, RED.httpNode);

    server.listen(settings_read.uiPort);

    //Check Port in use
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.log("Port in use")
        process.exit();
      }
    });

      // Start the runtime
    await RED.start()
    return true
    
  } catch (error) {
    return false
  }

};

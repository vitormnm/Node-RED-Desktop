const Windows = require("./init/Windows");
const controller_cfg_user = require("./controller/cfg_user")
const Settigs_file = require("./controller/Settigs_file")

//Render electron windows and start server
Windows()
//Controllers view config
controller_cfg_user()
Settigs_file()

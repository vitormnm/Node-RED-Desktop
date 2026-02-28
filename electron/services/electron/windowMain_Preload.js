const { ipcRenderer, contextBridge, ipcRenderer: ipc } = require('electron')


contextBridge.exposeInMainWorld('api', {
    
    getWindowId: () => {
        //retrieves the window ID when it is opened on the front end.
        return ipc.invoke('get-window-id');
    },

    get: (route) => ipcRenderer.invoke(`GET:${route}`),
    post: (route, data) => ipcRenderer.invoke(`POST:${route}`, data),
    put: (route, data) => ipcRenderer.invoke(`PUT:${route}`, data),
    delete: (route, data) => ipcRenderer.invoke(`DELETE:${route}`, data),



    send: (callback) => ipcRenderer.on('send:${route}', (event, data) => callback(data)),






})


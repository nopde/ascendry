const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
    minimize: () => {
        ipcRenderer.invoke("minimize");
    },
    maximize: () => {
        return ipcRenderer.invoke("maximize");
    },
    maximized: (callback) => {
        ipcRenderer.on("maximized", callback);
    },
    unmaximized: (callback) => {
        ipcRenderer.on("unmaximized", callback);
    },
    quit: () => {
        ipcRenderer.invoke("quit");
    },
    addShortcut: (name, hotkey, action) => {
        return ipcRenderer.invoke("add-shortcut", name, hotkey, action);
    },
    removeShortcut: (name) => {
        return ipcRenderer.invoke("remove-shortcut", name);
    },
    getShortcuts: () => {
        return ipcRenderer.invoke("get-shortcuts");
    },
    editShortcut: (name, editedShortcut) => {
        return ipcRenderer.invoke("edit-shortcut", name, editedShortcut);
    },
});
const { app, BrowserWindow, ipcMain, globalShortcut, Tray, Menu, nativeImage } = require("electron");
const path = require("path");
const { exec } = require("child_process");
const fs = require("fs");

let mainWindow;
let tray;
const gotTheLock = app.requestSingleInstanceLock();

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        minWidth: 800,
        minHeight: 600,
        frame: false,
        resizable: true,
        maximizable: true,
        fullscreenable: false,
        icon: path.join(app.getAppPath(), "assets", "icon_white.ico"),
        webPreferences: {
            preload: path.join(app.getAppPath(), "preload.js"),
        },
    });

    mainWindow.loadFile("src/index.html");
}

class Shortcut {
    constructor(name, key, action) {
        this.name = name;
        this.key = key;
        this.action = action;
    }

    check() {
        try {
            globalShortcut.register(this.key, () => { });
            globalShortcut.unregister(this.key);
            return true;
        }
        catch (error) {
            console.error(error);
            return false;
        }
    }

    setup() {
        if (!this.check()) return false;

        globalShortcut.register(this.key, () => {
            console.log("Shortcut triggered: " + this.name);
            exec(this.action);
        });

        return true;
    }

    remove() {
        globalShortcut.unregister(this.key);
    }

    toJSON() {
        return {
            name: this.name,
            key: this.key,
            action: this.action,
        };
    }
}

class ShortcutManager {
    constructor() {
        this.shortcuts = [];
    }

    read() {
        if (!fs.existsSync(path.join(app.getAppPath(), "shortcuts.json"))) {
            fs.writeFileSync(path.join(app.getAppPath(), "shortcuts.json"), JSON.stringify([]));
            return;
        }

        try {
            const shortcuts = JSON.parse(fs.readFileSync(path.join(app.getAppPath(), "shortcuts.json")));
            this.shortcuts = shortcuts.map((s) => new Shortcut(s.name, s.key, s.action));
            this.shortcuts.forEach((s) => s.setup());
        }
        catch (error) {
            console.error(error);
        }
    }

    save() {
        const shortcuts = this.shortcuts.map((s) => s.toJSON());
        fs.writeFileSync(path.join(app.getAppPath(), "shortcuts.json"), JSON.stringify(shortcuts, null, 4));
    }

    add(shortcut) {
        if (this.shortcuts.find((s) => s.name === shortcut.name)) {
            console.error("Shortcut with name " + shortcut.name + " already exists.");
            return;
        }

        if (!shortcut.setup()) return false;

        this.shortcuts.push(shortcut);
        this.save();
        return true;
    }

    remove(shortcutName) {
        const shortcut = this.shortcuts.find((s) => s.name === shortcutName);

        try {
            shortcut.remove();
            this.shortcuts = this.shortcuts.filter((s) => s.name !== shortcut.name);
            this.save();
            return true;
        }
        catch (error) {
            console.error(error);
            return false;
        }
    }

    getAll() {
        return this.shortcuts.map((s) => s.toJSON());
    }
}

const image = nativeImage.createFromPath(path.join(app.getAppPath(), "build", "icon.ico"));

if (!gotTheLock) {
    app.quit();
}
else {
    app.on("second-instance", (event, commandLine, workingDirectory) => {
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.show();
            mainWindow.focus();
        }
    });

    app.whenReady().then(() => {
        createWindow();

        tray = new Tray(image);
        const contextMenu = Menu.buildFromTemplate([
            { label: `Ascendry (v${app.getVersion()})`, enabled: false, icon: image.resize({ width: 16, height: 16 }) },
            { type: "separator" },
            { label: "Show", click: function () { mainWindow.show(); } },
            { type: "separator" },
            { label: "Quit", click: function () { mainWindow.destroy(); app.quit(); globalShortcut.unregisterAll(); } }
        ]);
        tray.setContextMenu(contextMenu);
        tray.setToolTip(`Ascendry (v${app.getVersion()})`);

        tray.on("click", () => {
            mainWindow.show();
        });

        app.on("activate", () => {
            if (BrowserWindow.getAllWindows().length === 0) createWindow();
        });

        const shortcutManager = new ShortcutManager();
        shortcutManager.read();

        ipcMain.handle("get-shortcuts", (event) => {
            return shortcutManager.getAll();
        });

        ipcMain.handle("add-shortcut", (event, shortcutName, hotkeyKey, actionCommand) => {
            const shortcut = new Shortcut(
                shortcutName,
                hotkeyKey,
                actionCommand
            );

            return shortcutManager.add(shortcut);
        });

        ipcMain.handle("remove-shortcut", (event, shortcutName) => {
            return shortcutManager.remove(shortcutName);
        });

        ipcMain.handle("minimize", (event) => {
            BrowserWindow.getFocusedWindow().minimize();
        });

        ipcMain.handle("maximize", (event) => {
            if (BrowserWindow.getFocusedWindow().isMaximized()) {
                BrowserWindow.getFocusedWindow().unmaximize();
                return false;
            }

            BrowserWindow.getFocusedWindow().maximize();
            return true;
        });

        ipcMain.handle("quit", (event) => {
            mainWindow.hide();
        });

        mainWindow.on("maximize", () => {
            mainWindow.webContents.send("maximized");
        });

        mainWindow.on("unmaximize", () => {
            mainWindow.webContents.send("unmaximized");
        });
    });
}

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});
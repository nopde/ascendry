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
    constructor(name, key, action, position) {
        this.name = name;
        this.key = key;
        this.action = action;
        this.position = position;
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

    edit(shortcut) {
        this.remove();
        this.name = shortcut.name;
        this.key = shortcut.key;
        this.action = shortcut.action;
        this.position = shortcut.position;
        this.setup();
    }

    toJSON() {
        return {
            name: this.name,
            key: this.key,
            action: this.action,
            position: this.position,
        };
    }
}

class ShortcutManager {
    constructor() {
        this.shortcuts = [];
        this.filePath = path.join(app.getPath("userData"), "shortcuts.json");
    }

    read() {
        if (!fs.existsSync(this.filePath)) {
            fs.writeFileSync(this.filePath, JSON.stringify([]));
            return;
        }

        try {
            const shortcuts = JSON.parse(fs.readFileSync(this.filePath));
            this.shortcuts = shortcuts
                .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
                .map((s) => new Shortcut(s.name, s.key, s.action, s.position));

            this.shortcuts.forEach((s) => s.setup());
        } catch (error) {
            console.error(error);
        }
    }

    save(shortcuts) {
        if (!shortcuts) {
            shortcuts = this.shortcuts.map((s) => s.toJSON());
        }
        fs.writeFileSync(this.filePath, JSON.stringify(shortcuts, null, 4));
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

        if (!shortcut) {
            console.error("Shortcut with name " + shortcutName + " does not exist.");
            return false;
        }

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

    edit(shortcutName, editedShortcut) {
        try {
            const shortcut = this.shortcuts.find((s) => s.name === shortcutName);

            if (!shortcut) {
                console.error("Shortcut with name " + shortcutName + " does not exist.");
                return false;
            }

            shortcut.edit(editedShortcut);
            this.save();
            return true;
        }
        catch (error) {
            console.error(error);
            return false;
        }
    }

    getAll() {
        this.read();
        return this.shortcuts.map((s) => s.toJSON());
    }

    isNameAvailable(name) {
        return !this.shortcuts.find((s) => s.name === name);
    }
}

const image = nativeImage.createFromPath(path.join(app.getAppPath(), "assets", "icon.ico"));

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

        ipcMain.handle("add-shortcut", (event, shortcutName, hotkeyKey, actionCommand, position) => {
            const shortcut = new Shortcut(
                shortcutName,
                hotkeyKey,
                actionCommand,
                position
            );

            return shortcutManager.add(shortcut);
        });

        ipcMain.handle("remove-shortcut", (event, shortcutName) => {
            return shortcutManager.remove(shortcutName);
        });

        ipcMain.handle("edit-shortcut", (event, shortcutName, editedShortcutData) => {
            const editedShortcut = new Shortcut(
                editedShortcutData.name,
                editedShortcutData.key,
                editedShortcutData.action,
                editedShortcutData.position
            );

            return shortcutManager.edit(shortcutName, editedShortcut);
        });

        ipcMain.handle("save-shortcuts", (event, shortcuts) => {
            shortcutManager.save(shortcuts);
        });

        ipcMain.handle("is-shortcut-name-available", (event, name) => {
            return shortcutManager.isNameAvailable(name);
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
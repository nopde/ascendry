import { getShortcuts } from "./modules/shortcuts.js";
import { DragAndDrop } from "./modules/drag_and_drop.js";

const minimize = document.getElementById("minimize");
const maximize = document.getElementById("maximize");
const quit = document.getElementById("quit");

minimize.addEventListener("click", async () => {
    await window.electronAPI.minimize();
});

maximize.addEventListener("click", async () => {
    await window.electronAPI.maximize();
});

window.electronAPI.maximized(() => {
    maximize.innerHTML = "<span class='icons'>&#xE923</span>";
});

window.electronAPI.unmaximized(() => {
    maximize.innerHTML = "<span class='icons'>&#xE922</span>";
});

quit.addEventListener("click", async () => {
    await window.electronAPI.quit();
});

getShortcuts();
new DragAndDrop("shortcuts");
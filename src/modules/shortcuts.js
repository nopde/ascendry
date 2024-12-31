import { openAddShortcutModal, openRemoveShortcutModal, openEditShortcutModal } from "./modals.js";

const shortcutsContainer = document.getElementById("shortcuts");
const addShortcut = document.getElementById("add-shortcut");

addShortcut.addEventListener("click", async () => {
    openAddShortcutModal();
});

function renderShortcuts(shortcuts) {
    shortcutsContainer.innerHTML = "";

    if (shortcuts.length === 0) {
        shortcutsContainer.innerHTML = `
            <div class="shortcut">
                <div class="shortcut-name">No shortcuts</div>
                <div class="shortcut-separator"></div>
                <div class="shortcut-hotkey">Add a shortcut by pressing the "Add shortcut" button in the top bar</div>
            </div>
        `;
        return;
    }

    shortcutsContainer.appendChild(document.createElement("h2")).innerText = "Shortcuts";

    for (const shortcut of shortcuts) {
        const shortcutElement = document.createElement("div");
        shortcutElement.classList.add("shortcut");
        shortcutElement.innerHTML = `
            <div class="shortcut-name">${shortcut.name}</div>
            <div class="shortcut-separator"></div>
            <div class="shortcut-hotkey">${shortcut.key}</div>
            <div class="shortcut-separator"></div>
            <div class="shortcut-action">${shortcut.action}</div>
            <div class="shortcut-controls">
                <div class="shortcut-separator"></div>
                <button id="shortcut-remove">Remove</button>
                <div class="shortcut-separator"></div>
                <button id="shortcut-edit">Edit</button>
            </div>
        `;

        const editButton = shortcutElement.querySelector("#shortcut-edit");
        editButton.addEventListener("click", () => {
            openEditShortcutModal(shortcut);
        });

        const removeButton = shortcutElement.querySelector("#shortcut-remove");
        removeButton.addEventListener("click", () => {
            openRemoveShortcutModal(shortcut);
        });

        shortcutsContainer.appendChild(shortcutElement);
    }
}

async function getShortcuts() {
    const shortcuts = await window.electronAPI.getShortcuts();
    renderShortcuts(shortcuts);
}

export { getShortcuts };
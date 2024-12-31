const app = document.querySelector(".app");
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

const shortcutsContainer = document.getElementById("shortcuts");
const addShortcut = document.getElementById("add-shortcut");

addShortcut.addEventListener("click", async () => {
    addShortcutModal();
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
            editShortcutModal(shortcut);
        });

        const removeButton = shortcutElement.querySelector("#shortcut-remove");
        removeButton.addEventListener("click", () => {
            removeShortcutModal(shortcut);
        });

        shortcutsContainer.appendChild(shortcutElement);
    }
}

async function getShortcuts() {
    const shortcuts = await window.electronAPI.getShortcuts();
    renderShortcuts(shortcuts);
}

getShortcuts();

function createModal(name, content) {
    const modalContainer = document.createElement("div");
    modalContainer.classList.add("modal-container");

    modalContainer.attachShadow({ mode: "open" });
    modalContainer.shadowRoot.innerHTML = `
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
                user-select: none;
                font-family: JetBrainsMono Nerd Font, monospace;
                -webkit-font-smoothing: antialiased;
            }

            @keyframes fadeIn {
                from {
                    opacity: 0;
                }
                to {
                    opacity: 1;
                }
            }

            :host {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, .8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 100;
                backdrop-filter: blur(15px);
                opacity: 0;
                animation: fadeIn .15s cubic-bezier(0.25, 1, 0.5, 1) forwards;
            }

            @keyframes modalGrow {
                to {
                    scale: 1;
                }
            }

            .modal {
                background-color: rgb(255, 255, 255, .15);
                border: 1px solid rgba(255, 255, 255, .1);
                border-radius: 10px;
                padding: 20px;
                padding-top: 0;
                min-width: 300px;
                max-width: 400px;
                display: flex;
                flex-direction: column;
                scale: .9;
                animation: modalGrow .35s cubic-bezier(0.25, 1, 0.5, 1) forwards;
            }

            .modal-title {
                display: flex;
                align-items: center;
                justify-content: right;
                gap: 10px;
                padding-top: 20px;
                padding-inline: 10px;
            }

            .modal-title p {
                width: max-content;
                overflow: hidden;
                text-overflow: ellipsis;
                word-break: keep-all;
                white-space: nowrap;
                font-size: 21px;
                font-weight: 500;
            }

            .modal-title button {
                position: relative;
                width: max-content;
                height: max-content;
                background-color: rgb(255, 255, 255, .1);
                border: none;
                padding: 10px 20px;
                border-radius: 999px;
                cursor: pointer;
                margin-left: auto;
                transition: background-color .1s cubic-bezier(0.25, 1, 0.5, 1);
            }

            .modal-title button:hover {
                background-color: rgb(255, 255, 255, .2);
            }

            .modal-content {
                padding: 10px;
                padding-top: 20px;
                font-size: 16px;
                font-weight: normal;
                max-height: 400px;
                overflow-y: auto;
            }
        </style>

        <div class="modal">
            <div class="modal-title">
                ${name ? `<p>${name}</p>` : ""}
                <button id="close">Close</button>
            </div>
            <div class="modal-content"></div>
        </div>
    `;

    const modalContent = modalContainer.shadowRoot.querySelector(".modal-content");

    modalContent.attachShadow({ mode: "open" });
    modalContent.shadowRoot.innerHTML += `
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
                font-family: "JetBrainsMono Nerd Font", monospace;
                user-select: none;
                -webkit-font-smoothing: antialiased;
            }

            :host {
                display: flex;
                gap: 10px;
            }

            button.modal-button {
                flex: 1 1;
                position: relative;
                background-color: rgb(255, 255, 255, .25);
                border: none;
                padding: 10px 20px;
                border-radius: 999px;
                cursor: pointer;
                transition: background-color .1s cubic-bezier(0.25, 1, 0.5, 1);
            }

            button.modal-button:hover {
                background-color: rgb(255, 255, 255, .35);
            }

            input.modal-input {
                flex: 1 1;
                background-color: transparent;
                box-shadow: 0 0 0 1px white;
                border: none;
                outline: none;
                padding: 10px 20px;
                border-radius: 999px;
                color: white;
                transition: all .15s cubic-bezier(0.25, 1, 0.5, 1);
            }

            input.modal-input:hover {
                background-color: rgba(255, 255, 255, .1);
            }

            input.modal-input:focus {
                background-color: rgba(255, 255, 255, .2);
                box-shadow: 0 0 0 2px white;
            }

            input.modal-input::placeholder {
                color: rgba(255, 255, 255, .75);
            }
        </style>
    `
    modalContent.shadowRoot.innerHTML += content;

    document.body.appendChild(modalContainer);

    const modal = modalContainer.shadowRoot.querySelector(".modal");
    const modalButton = modal.querySelector("#close");

    modalContainer.addEventListener("close-modal", () => {
        const animation = modalContainer.animate([{ opacity: 0 }], { duration: 100, easing: "cubic-bezier(0.25, 1, 0.5, 1)", fill: "forwards" });

        animation.onfinish = () => {
            modalContainer.remove();
            modalContainer.dispatchEvent(new CustomEvent("ready-to-close"));
        }
    });

    modalButton.focus();

    modalButton.addEventListener("click", () => {
        modalContainer.dispatchEvent(new CustomEvent("close-modal"));
    });

    return modalContainer;
}

function addShortcutModal() {
    const modalHTML = `
        <style>
            form {
                flex: 1 1;
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
        </style>

        <form onsubmit="return false">
            <input class="modal-input" id="shortcut-name" type="text" placeholder="Shortcut name" spellcheck="false" autocomplete="off" required>
            <input class="modal-input" id="shortcut-hotkey" type="text" placeholder="Shortcut hotkey" spellcheck="false" autocomplete="off" required>
            <input class="modal-input" id="shortcut-action" type="text" placeholder="Shortcut action" spellcheck="false" autocomplete="off" required>
            <button class="modal-button" type="submit">Confirm</button>
        </form>
    `;

    let modalContainer = createModal("Add shortcut", modalHTML);

    const form = modalContainer.shadowRoot.querySelector("div.modal-content").shadowRoot.querySelector("form");
    const nameInput = modalContainer.shadowRoot.querySelector("div.modal-content").shadowRoot.querySelector("#shortcut-name");
    const hotkeyInput = modalContainer.shadowRoot.querySelector("div.modal-content").shadowRoot.querySelector("#shortcut-hotkey");
    const actionInput = modalContainer.shadowRoot.querySelector("div.modal-content").shadowRoot.querySelector("#shortcut-action");

    nameInput.focus();

    form.addEventListener("submit", event => {
        const name = nameInput.value;
        const hotkey = hotkeyInput.value;
        const action = actionInput.value;
        const result = window.electronAPI.addShortcut(name, hotkey, action);

        modalContainer.dispatchEvent(new CustomEvent("close-modal"));
        modalContainer.addEventListener("ready-to-close", () => {
            getShortcuts();
        });
    });
}

function removeShortcutModal(shortcut) {
    const modalHTML = `
        <button class="modal-button" id="confirm">Confirm</button>
    `;

    let modalContainer = createModal("Remove shortcut", modalHTML);

    const confirmButton = modalContainer.shadowRoot.querySelector("div.modal-content").shadowRoot.querySelector("#confirm");
    confirmButton.focus();

    confirmButton.addEventListener("click", event => {
        const result = window.electronAPI.removeShortcut(shortcut.name);

        modalContainer.dispatchEvent(new CustomEvent("close-modal"));
        modalContainer.addEventListener("ready-to-close", () => {
            getShortcuts();
        });
    });
}

function editShortcutModal(shortcut) {
    const modalHTML = `
        <style>
            form {
                flex: 1 1;
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
        </style>

        <form onsubmit="return false">
            <input class="modal-input" id="shortcut-name" type="text" placeholder="Shortcut name" spellcheck="false" autocomplete="off" required>
            <input class="modal-input" id="shortcut-hotkey" type="text" placeholder="Shortcut hotkey" spellcheck="false" autocomplete="off" required>
            <input class="modal-input" id="shortcut-action" type="text" placeholder="Shortcut action" spellcheck="false" autocomplete="off" required>
            <button class="modal-button" type="submit">Confirm</button>
        </form>
    `;

    let modalContainer = createModal("Edit shortcut", modalHTML);

    const form = modalContainer.shadowRoot.querySelector("div.modal-content").shadowRoot.querySelector("form");
    const nameInput = modalContainer.shadowRoot.querySelector("div.modal-content").shadowRoot.querySelector("#shortcut-name");
    const hotkeyInput = modalContainer.shadowRoot.querySelector("div.modal-content").shadowRoot.querySelector("#shortcut-hotkey");
    const actionInput = modalContainer.shadowRoot.querySelector("div.modal-content").shadowRoot.querySelector("#shortcut-action");

    nameInput.value = shortcut.name;
    hotkeyInput.value = shortcut.key;
    actionInput.value = shortcut.action;

    nameInput.focus();

    form.addEventListener("submit", event => {
        const name = nameInput.value;
        const hotkey = hotkeyInput.value;
        const action = actionInput.value;
        const result = window.electronAPI.editShortcut(shortcut.name, { name, key: hotkey, action });

        modalContainer.dispatchEvent(new CustomEvent("close-modal"));
        modalContainer.addEventListener("ready-to-close", () => {
            getShortcuts();
        });
    });
}
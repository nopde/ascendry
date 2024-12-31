import { getShortcuts } from "./shortcuts.js";

function createModal(name, content) {
    const modalElement = document.createElement("div");
    modalElement.classList.add("modal-container");

    modalElement.attachShadow({ mode: "open" });
    modalElement.shadowRoot.innerHTML = `
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

    const modalContent = modalElement.shadowRoot.querySelector(".modal-content");

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

    document.body.appendChild(modalElement);

    const modal = modalElement.shadowRoot.querySelector(".modal");
    const modalButton = modal.querySelector("#close");

    modalElement.addEventListener("close-modal", () => {
        const animation = modalElement.animate([{ opacity: 0 }], { duration: 100, easing: "cubic-bezier(0.25, 1, 0.5, 1)", fill: "forwards" });

        animation.onfinish = () => {
            modalElement.remove();
            modalElement.dispatchEvent(new CustomEvent("ready-to-close"));
        }
    });

    modalButton.focus();

    modalButton.addEventListener("click", () => {
        modalElement.dispatchEvent(new CustomEvent("close-modal"));
    });

    return modalElement;
}

function openAddShortcutModal() {
    const modalHTML = `
        <style>
            form {
                flex: 1 1;
                display: flex;
                flex-direction: column;
                gap: 10px;
            }

            .hotkey-input {
                display: flex;
                gap: 10px;
            }

            #hotkey-display {
                position: relative;
                width: 100%;
                height: 45px;
                display: flex;
                align-items: end;
                justify-content: center;
                overflow: hidden;
                text-overflow: ellipsis;
                word-break: keep-all;
                white-space: nowrap;
                font-size: 12px;
                color: rgba(255, 255, 255, .75);
                background-color: rgb(255, 255, 255, .15);
                border: 1px solid rgba(255, 255, 255, .1);
                border-radius: 10px;
                padding: 5px 10px;
            }

            #hotkey-display::before {
                content: "Hotkey";
                position: absolute;
                top: 2px;
                left: 2px;
                right: 2px;
                height: max-content;
                font-size: 10px;
                color: rgba(255, 255, 255, .75);
                background-color: rgb(255, 255, 255, .15);
                border: 1px solid rgba(255, 255, 255, .1);
                border-radius: 999px;
                text-align: center;
            }
        </style>

        <form onsubmit="return false">
            <input class="modal-input" id="shortcut-name" type="text" placeholder="Shortcut name" spellcheck="false" autocomplete="off" required>
            <div class="hotkey-input">
                <p class="hotkey-display" id="hotkey-display">No hotkey</p>
                <button class="modal-button" id="hotkey-bind" type="button">Change</button>
            </div>
            <input class="modal-input" id="shortcut-action" type="text" placeholder="Shortcut action" spellcheck="false" autocomplete="off" required>
            <button class="modal-button" type="submit">Confirm</button>
        </form>
    `;

    const modalElement = createModal("Add shortcut", modalHTML);

    const form = modalElement.shadowRoot.querySelector("div.modal-content").shadowRoot.querySelector("form");
    const shortcutNameInput = modalElement.shadowRoot.querySelector("div.modal-content").shadowRoot.querySelector("#shortcut-name");
    const hotkeyDisplay = modalElement.shadowRoot.querySelector("div.modal-content").shadowRoot.querySelector("#hotkey-display");
    const bindHotkeyButton = modalElement.shadowRoot.querySelector("div.modal-content").shadowRoot.querySelector("#hotkey-bind");
    const shortcutActionInput = modalElement.shadowRoot.querySelector("div.modal-content").shadowRoot.querySelector("#shortcut-action");

    shortcutNameInput.focus();

    bindHotkeyButton.addEventListener("click", async () => {
        try {
            const hotkey = await openSetShortcutHotkeyModal();
            hotkeyDisplay.innerText = hotkey;
        }
        catch (error) {
            console.log(error);
        }
    });

    form.addEventListener("submit", event => {
        const name = shortcutNameInput.value;
        const hotkey = hotkeyDisplay.innerText;
        const action = shortcutActionInput.value;
        const result = window.electronAPI.addShortcut(name, hotkey, action);

        modalElement.dispatchEvent(new CustomEvent("close-modal"));
        modalElement.addEventListener("ready-to-close", () => {
            getShortcuts();
        });
    });
}

function openRemoveShortcutModal(shortcut) {
    const modalHTML = `
        <button class="modal-button" id="confirm">Confirm</button>
    `;

    const modalElement = createModal("Remove shortcut", modalHTML);

    const confirmButton = modalElement.shadowRoot.querySelector("div.modal-content").shadowRoot.querySelector("#confirm");
    confirmButton.focus();

    confirmButton.addEventListener("click", event => {
        const result = window.electronAPI.removeShortcut(shortcut.name);

        modalElement.dispatchEvent(new CustomEvent("close-modal"));
        modalElement.addEventListener("ready-to-close", () => {
            getShortcuts();
        });
    });
}

function openEditShortcutModal(shortcut) {
    const modalHTML = `
        <style>
            form {
                flex: 1 1;
                display: flex;
                flex-direction: column;
                gap: 10px;
            }

            .hotkey-input {
                display: flex;
                align-items: center;
                gap: 10px;
            }

            #hotkey-display {
                position: relative;
                width: 100%;
                height: 45px;
                display: flex;
                align-items: end;
                justify-content: center;
                overflow: hidden;
                text-overflow: ellipsis;
                word-break: keep-all;
                white-space: nowrap;
                font-size: 12px;
                color: rgba(255, 255, 255, .75);
                background-color: rgb(255, 255, 255, .15);
                border: 1px solid rgba(255, 255, 255, .1);
                border-radius: 10px;
                padding: 5px 10px;
            }

            #hotkey-display::before {
                content: "Hotkey";
                position: absolute;
                top: 2px;
                left: 2px;
                right: 2px;
                height: max-content;
                font-size: 10px;
                color: rgba(255, 255, 255, .75);
                background-color: rgb(255, 255, 255, .15);
                border: 1px solid rgba(255, 255, 255, .1);
                border-radius: 999px;
                text-align: center;
            }
        </style>

        <form onsubmit="return false">
            <input class="modal-input" id="shortcut-name" type="text" placeholder="Shortcut name" spellcheck="false" autocomplete="off" required>
            <div class="hotkey-input">
                <p class="hotkey-display" id="hotkey-display"></p>
                <button class="modal-button" id="hotkey-bind" type="button">Change</button>
            </div>
            <input class="modal-input" id="shortcut-action" type="text" placeholder="Shortcut action" spellcheck="false" autocomplete="off" required>
            <button class="modal-button" type="submit">Confirm</button>
        </form>
    `;

    const modalElement = createModal("Edit shortcut", modalHTML);

    const form = modalElement.shadowRoot.querySelector("div.modal-content").shadowRoot.querySelector("form");
    const shortcutNameInput = modalElement.shadowRoot.querySelector("div.modal-content").shadowRoot.querySelector("#shortcut-name");
    const hotkeyDisplay = modalElement.shadowRoot.querySelector("div.modal-content").shadowRoot.querySelector("#hotkey-display");
    const bindHotkeyButton = modalElement.shadowRoot.querySelector("div.modal-content").shadowRoot.querySelector("#hotkey-bind");
    const shortcutActionInput = modalElement.shadowRoot.querySelector("div.modal-content").shadowRoot.querySelector("#shortcut-action");

    shortcutNameInput.value = shortcut.name;

    hotkeyDisplay.innerText = shortcut.key;
    bindHotkeyButton.addEventListener("click", async () => {
        try {
            const hotkey = await openSetShortcutHotkeyModal();
            hotkeyDisplay.innerText = hotkey;
        }
        catch (error) {
            console.log(error);
        }
    });

    shortcutActionInput.value = shortcut.action;

    shortcutNameInput.focus();

    form.addEventListener("submit", event => {
        const name = shortcutNameInput.value;
        const hotkey = hotkeyDisplay.innerText;
        const action = shortcutActionInput.value;
        const result = window.electronAPI.editShortcut(shortcut.name, { name, key: hotkey, action });

        modalElement.dispatchEvent(new CustomEvent("close-modal"));
        modalElement.addEventListener("ready-to-close", () => {
            getShortcuts();
        });
    });
}

class ShortcutKeyBinder {
    constructor(input) {
        this.input = input;
        this.pressedKeys = new Set();
        this.currentShortcut = null;
        this.boundKeyHandler = this.handleKeyRecording.bind(this);
    }

    validateHotkey(shortcut) {
        const modifiers = ["ctrl", "control", "alt", "shift", "cmd", "command"];
        const allowedKeys = [
            "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m",
            "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z",
            "0", "1", "2", "3", "4", "5", "6", "7", "8", "9",
            "f1", "f2", "f3", "f4", "f5", "f6", "f7", "f8", "f9", "f10", "f11", "f12",
            "tab", "space", "backspace", "delete", "enter", "esc", "escape", "up", "down", "left", "right"
        ];

        const keys = shortcut.toLowerCase().split('+');
        const hasModifier = keys.some(key => modifiers.includes(key));
        if (!hasModifier) return false;

        const isValid = keys.every(key => modifiers.includes(key) || allowedKeys.includes(key));
        return isValid;
    }

    handleKeyRecording(event) {
        const key = event.key.toLowerCase();
        if (!this.pressedKeys.has(key)) {
            this.pressedKeys.add(key);
            this.input.value = Array.from(this.pressedKeys).join("+");
        }
    }

    startHotkeyRecording() {
        this.pressedKeys.clear();
        this.input.value = "";
        this.input.classList.remove("invalid");
        window.addEventListener("keydown", this.boundKeyHandler);
    }

    stopHotkeyRecording() {
        window.removeEventListener("keydown", this.boundKeyHandler);
        this.currentShortcut = Array.from(this.pressedKeys).join("+");

        this.input.value = this.currentShortcut;

        this.pressedKeys.clear();
    }
}

function openSetShortcutHotkeyModal() {
    const modalHTML = `
        <style>
            :host {
                flex-direction: column;
            }

            .hotkey-input-container {
                display: flex;
                gap: 10px;
            }

            .hotkey-input-container .modal-button {
                position: relative;
                width: 45px;
                height: 45px;
                padding: 0;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .hotkey-input-container .modal-button::before {
                content: "";
                position: absolute;
                width: 15px;
                height: 15px;
                border-radius: 50%;
                background-color: rgba(255, 0, 0, .75);;
                transition: all .25s cubic-bezier(0.25, 1, 0.5, 1);
            }

            .hotkey-input-container .modal-button:hover::before {
                scale: 1.1;
            }

            .hotkey-input-container .modal-button.recording::before {
                border-radius: 2px;
                background-color: rgba(255, 255, 255, .75);
            }

            .invalid-hotkey {
                color: red;
                font-size: 12px;
                padding: 5px 10px;
                background-color: rgb(255, 0, 0, .15);
                border: 1px solid rgba(255, 0, 0, .1);
                border-radius: 10px;
                min-height: 0;
                height: 0;
                opacity: 0;
                margin-bottom: -20px;
                overflow: hidden;
                pointer-events: none;
                transition: all .15s cubic-bezier(0.25, 1, 0.5, 1);
            }

            .invalid-hotkey.visible {
                height: auto;
                opacity: 1;
                margin-bottom: 0;
            }
        </style>

        <div class="invalid-hotkey">Invalid hotkey, please try again.</div>
        <div class="hotkey-input-container">
            <input class="modal-input" id="shortcut-hotkey" type="text" placeholder="Shortcut hotkey" spellcheck="false" autocomplete="off" required>
            <button class="modal-button" id="record-button"></button>
        </div>
        <button class="modal-button" type="submit" id="confirm">Confirm</button>
    `;

    return new Promise((resolve, reject) => {
        const modalElement = createModal("Set hotkey", modalHTML);

        const hotkeyInput = modalElement.shadowRoot.querySelector("div.modal-content").shadowRoot.querySelector("#shortcut-hotkey");
        const recordButton = modalElement.shadowRoot.querySelector("div.modal-content").shadowRoot.querySelector("#record-button");
        const confirmButton = modalElement.shadowRoot.querySelector("div.modal-content").shadowRoot.querySelector("#confirm");
        const invalidHotkey = modalElement.shadowRoot.querySelector("div.modal-content").shadowRoot.querySelector(".invalid-hotkey");

        confirmButton.focus();

        const shortcutKeyBinder = new ShortcutKeyBinder(hotkeyInput);

        let recording = false;
        recordButton.addEventListener("click", () => {
            recording = !recording;
            if (recording) {
                recordButton.classList.add("recording");
                shortcutKeyBinder.startHotkeyRecording();
            } else {
                recordButton.classList.remove("recording");
                shortcutKeyBinder.stopHotkeyRecording();
            }
        });

        confirmButton.addEventListener("click", () => {
            if (recording) {
                recordButton.classList.remove("recording");
                shortcutKeyBinder.stopHotkeyRecording();
            }

            if (shortcutKeyBinder.currentShortcut && shortcutKeyBinder.validateHotkey(shortcutKeyBinder.currentShortcut)) {
                modalElement.dispatchEvent(new CustomEvent("close-modal"));
                resolve(shortcutKeyBinder.currentShortcut);
            } else {
                invalidHotkey.classList.add("visible");
                hotkeyInput.value = "";
                shortcutKeyBinder.currentShortcut = null;
            }
        });
    });
}

export { createModal, openAddShortcutModal, openRemoveShortcutModal, openEditShortcutModal };
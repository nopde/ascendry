class DragAndDrop {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            throw new Error("Container element not found");
        }

        this.placeholder = document.createElement("div");
        this.placeholder.className = "placeholder";
        this.placeholder.style.height = "0px";

        this.initDragAndDrop();
    }

    initDragAndDrop() {
        this.container.addEventListener("dragstart", this.onDragStart.bind(this));
        this.container.addEventListener("dragover", this.onDragOver.bind(this));
        this.container.addEventListener("drop", this.onDrop.bind(this));
        this.container.addEventListener("dragend", this.onDragEnd.bind(this));

        this.loadPositions();
    }

    onDragStart(event) {
        const target = event.target;
        if (target.getAttribute("draggable") === "true") {
            target.classList.add("dragging");
            event.dataTransfer.setData("text/plain", target.dataset.id);

            this.placeholder.style.height = `${target.offsetHeight}px`;
        }
    }

    onDragOver(event) {
        event.preventDefault();

        const dragging = this.container.querySelector(".dragging");
        if (dragging) {
            const afterElement = this.getDragAfterElement(event.clientY);

            if (afterElement == null) {
                if (!this.container.contains(this.placeholder)) {
                    this.container.appendChild(this.placeholder);
                } else if (this.container.lastElementChild !== this.placeholder) {
                    this.container.appendChild(this.placeholder);
                }
            } else {
                if (afterElement !== this.placeholder) {
                    this.container.insertBefore(this.placeholder, afterElement);
                }
            }
        }
    }

    onDrop(event) {
        event.preventDefault();
        const dragging = this.container.querySelector(".dragging");
        if (dragging) {
            this.container.insertBefore(dragging, this.placeholder);
            this.placeholder.remove();

            this.savePositions();
        }
    }

    onDragEnd(event) {
        const target = event.target;
        if (target.classList.contains("dragging")) {
            target.classList.remove("dragging");
        }
        this.placeholder.remove();

        this.savePositions();
    }

    getDragAfterElement(y) {
        const elements = [...this.container.querySelectorAll("[draggable='true']:not(.dragging)")];

        let closest = { offset: Number.NEGATIVE_INFINITY, element: null };
        for (const child of elements) {
            const box = child.getBoundingClientRect();
            const offset = y - (box.top + box.height / 2);

            if (offset < 0 && offset > closest.offset) {
                closest = { offset, element: child };
            }
        }

        const lastElement = elements[elements.length - 1];
        if (lastElement) {
            const lastBox = lastElement.getBoundingClientRect();
            if (y > lastBox.bottom) {
                return null;
            }
        }

        return closest.element;
    }

    async savePositions() {
        const shortcuts = await window.electronAPI.getShortcuts();
        const shortcutsElements = Array.from(this.container.querySelectorAll(".shortcut"));

        const updatedShortcuts = shortcutsElements.map((element, index) => {
            const shortcutName = element.getAttribute("data-name");
            const shortcut = shortcuts.find((s) => s.name === shortcutName);

            if (shortcut) {
                return {
                    ...shortcut,
                    position: index,
                };
            }
        }).filter(Boolean);


        window.electronAPI.saveShortcuts(updatedShortcuts);
    }

    loadPositions() {
        const savedPositions = localStorage.getItem("dragAndDropPositions");
        if (savedPositions) {
            const ids = JSON.parse(savedPositions);
            const elements = ids.map(id => this.container.querySelector(`[data-id='${id}']`));
            elements.forEach(el => {
                if (el) {
                    this.container.appendChild(el);
                }
            });
        }
    }
}

export { DragAndDrop };
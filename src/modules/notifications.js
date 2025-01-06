const container = document.getElementById("notification-container");

function showNotification(body, duration = 3000) {
    const notification = document.createElement("div");
    notification.className = "notification";
    notification.innerHTML = `<p>${body}</p>`;

    notification.animate(
        [
            { transform: "translateX(100px)", opacity: 0 },
            { transform: "translateX(0)", opacity: 1 }
        ],
        { duration: 250, easing: "cubic-bezier(0, .8, .2, 1)" }
    );

    container.appendChild(notification);

    setTimeout(() => {
        notification.classList.add("hide");

        notification.addEventListener("transitionend", () => {
            notification.remove();
        });
    }, duration);
}

export { showNotification };
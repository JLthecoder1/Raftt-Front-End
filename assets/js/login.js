const loginNav = document.querySelector(".primary-nav");
const loginHighlight = document.querySelector(".nav-highlight");
const loginMenu = document.querySelector(".menu-toggle");
const loginHeader = document.querySelector(".site-header");

function setLoginMenu(open) {
    loginNav.classList.toggle("is-open", open);
    loginMenu.setAttribute("aria-expanded", String(open));
    loginMenu.setAttribute("aria-label", open ? "Close menu" : "Open menu");
}

loginMenu?.addEventListener("click", () => setLoginMenu(loginMenu.getAttribute("aria-expanded") !== "true"));
document.addEventListener("pointerdown", (event) => {
    if (loginHeader && !loginHeader.contains(event.target)) setLoginMenu(false);
});
document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setLoginMenu(false);
});

document.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("pointerenter", (event) => {
        if (event.pointerType !== "mouse") return;
        loginHighlight.style.left = `${link.offsetLeft}px`;
        loginHighlight.style.width = `${link.offsetWidth}px`;
        loginNav.classList.add("has-highlight");
    });
});
loginNav?.addEventListener("pointerleave", () => loginNav.classList.remove("has-highlight"));

const canTilt = window.matchMedia("(hover: hover) and (pointer: fine)").matches
    && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (canTilt) {
    document.querySelectorAll("[data-tilt-card]").forEach((card) => {
        const media = card.querySelector(".login-story-media");
        if (!media) return;

        const resetTilt = () => {
            media.classList.remove("is-tilting");
            media.style.removeProperty("--tilt-x");
            media.style.removeProperty("--tilt-y");
            media.style.removeProperty("--tilt-scale");
        };

        card.addEventListener("pointermove", (event) => {
            const bounds = card.getBoundingClientRect();
            const x = (event.clientX - bounds.left) / bounds.width - 0.5;
            const y = (event.clientY - bounds.top) / bounds.height - 0.5;

            media.classList.add("is-tilting");
            media.style.setProperty("--tilt-x", `${(-y * 7).toFixed(2)}deg`);
            media.style.setProperty("--tilt-y", `${(x * 7).toFixed(2)}deg`);
            media.style.setProperty("--tilt-scale", "1.12");
        });

        card.addEventListener("pointerleave", resetTilt);
        card.addEventListener("pointercancel", resetTilt);
    });
}

const loginForm = document.getElementById("login-form");
loginForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    window.location.assign("welcome.html");
});

const signupForm = document.getElementById("signup-form");
signupForm?.addEventListener("submit", (event) => {
    event.preventDefault();

    const password = document.getElementById("signup-password");
    const confirmation = document.getElementById("signup-password-confirmation");
    const status = document.getElementById("signup-status");

    if (password.value !== confirmation.value) {
        status.textContent = "Passwords must match.";
        confirmation.focus();
        return;
    }

    status.textContent = "Account ready - connect this form to your authentication service to finish creating it.";
});

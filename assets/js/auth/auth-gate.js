(() => {
    document.addEventListener("click", (event) => {
        const signOut = event.target.closest("[data-demo-sign-out]");
        if (!signOut) return;

        event.preventDefault();
        sessionStorage.removeItem("raftt-demo-session");
        window.location.assign("login.html");
    });
})();

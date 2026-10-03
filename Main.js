gsap.registerPlugin(ScrollTrigger);

const video = document.getElementById("vid");
const startImage = document.getElementById("start-image");
const progress = document.getElementById("progress");
const loader = document.getElementById("loader");
const hint = document.getElementById("hint");
const primaryNav = document.querySelector(".primary-nav");
const navHighlight = document.querySelector(".nav-highlight");

const hideLoader = () => loader.classList.add("is-hidden");
startImage.addEventListener("load", hideLoader);
if (startImage.complete) hideLoader();

// Navegação (efeito pill highlight)
document.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("pointerenter", (e) => {
        if (e.pointerType === "mouse") {
            navHighlight.style.left = `${link.offsetLeft}px`;
            navHighlight.style.width = `${link.offsetWidth}px`;
            primaryNav.classList.add("has-highlight");
        }
    });
});
primaryNav.addEventListener("pointerleave", () => primaryNav.classList.remove("has-highlight"));

// Rolagem suave para links âncora
document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (e) => {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: "smooth" });
    });
});

// Controle de decodificação por seek-gate sem sobrecarga de hardware
let isSeeking = false;
let pendingTime = null;

function renderVideoFrame(targetTime) {
    if (isSeeking || video.seeking) {
        pendingTime = targetTime;
        return;
    }

    if (Math.abs(video.currentTime - targetTime) < 0.015) {
        return;
    }

    isSeeking = true;
    video.currentTime = targetTime;

    if (!video.seeking) {
        isSeeking = false;
    }
}

video.addEventListener("seeked", () => {
    isSeeking = false;
    if (pendingTime !== null) {
        const nextTime = pendingTime;
        pendingTime = null;
        renderVideoFrame(nextTime);
    }
});

// Configuração do ScrollTrigger
function initScrollAnimation() {
    hideLoader();
    if (!Number.isFinite(video.duration) || video.duration <= 0) return;

    video.pause();

    const videoState = { currentTime: 0 };

    const tl = gsap.timeline({
        scrollTrigger: {
            trigger: "#track",
            start: "top top",
            end: () => `+=${video.duration * 500}`,
            pin: ".stage",
            scrub: 0.4, // Inércia ágil e super fluida (sem sensação de peso ou atraso)
            anticipatePin: 1,
            fastScrollEnd: true
        }
    });

    // 1. Transição inicial: foto de abertura para o vídeo (primeiros 6% do scroll)
    tl.to(startImage, { opacity: 0, duration: 0.06, ease: "power1.out" }, 0)
      .set(startImage, { visibility: "hidden" }, 0.06)
      .to(video, { opacity: 1, duration: 0.06, ease: "power1.out" }, 0);

    // 2. Barra de progresso (acelerada por GPU com scaleX)
    tl.to(progress, { scaleX: 1, ease: "none", duration: 1 }, 0);

    // 3. Sincronização ultra responsiva do vídeo com o scroll
    tl.to(videoState, {
        currentTime: video.duration,
        ease: "none",
        duration: 1,
        onUpdate: () => renderVideoFrame(videoState.currentTime)
    }, 0);
}

if (video.readyState >= 1) {
    initScrollAnimation();
} else {
    video.addEventListener("loadedmetadata", initScrollAnimation);
}

video.addEventListener("error", () => {
    hideLoader();
    if (window.location.protocol === "file:") {
        hint.textContent = "Abra esta página em um servidor local (ex.: http://localhost:8000) para sincronizar o vídeo.";
    }
});
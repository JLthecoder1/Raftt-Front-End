gsap.registerPlugin(ScrollTrigger);

const video = document.getElementById("vid");
const startImage = document.getElementById("start-image");
const progress = document.getElementById("progress");
const loader = document.getElementById("loader");
const hint = document.getElementById("hint");
const videoCopy = document.querySelector(".video-copy");
const videoCopyCards = [...document.querySelectorAll(".video-copy-card")];
const scrollCue = document.querySelector(".scroll-cue");
const reduceMotionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
const primaryNav = document.querySelector(".primary-nav");
const navHighlight = document.querySelector(".nav-highlight");
const menuToggle = document.querySelector(".menu-toggle");
const siteHeader = document.querySelector(".site-header");
const footerLogo = document.querySelector(".footer-logo-effect");
const footerLogoReveal = document.getElementById("footer-logo-reveal");

document.querySelectorAll("[data-generate-words]").forEach((element) => {
    const text = element.textContent.trim();
    const fragment = document.createDocumentFragment();
    const words = text.split(/\s+/);

    element.setAttribute("aria-label", text);
    words.forEach((word, index) => {
        const span = document.createElement("span");
        span.className = "generated-word";
        span.setAttribute("aria-hidden", "true");
        span.textContent = word;
        fragment.append(span);
        if (index < words.length - 1) fragment.append(" ");
    });

    element.replaceChildren(fragment);
});

function setMobileMenuOpen(isOpen) {
    primaryNav.classList.toggle("is-open", isOpen);
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
}

menuToggle.addEventListener("click", () => {
    setMobileMenuOpen(menuToggle.getAttribute("aria-expanded") !== "true");
});

primaryNav.addEventListener("click", (event) => {
    if (event.target.closest("a")) setMobileMenuOpen(false);
});

document.addEventListener("pointerdown", (event) => {
    if (!siteHeader.contains(event.target)) setMobileMenuOpen(false);
});

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setMobileMenuOpen(false);
});

footerLogo.addEventListener("pointerenter", () => {
    footerLogo.classList.add("is-hovered");
});

footerLogo.addEventListener("pointermove", (event) => {
    const bounds = footerLogo.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width) * 100;
    const y = ((event.clientY - bounds.top) / bounds.height) * 100;

    footerLogoReveal.setAttribute("cx", `${x}%`);
    footerLogoReveal.setAttribute("cy", `${y}%`);
});

footerLogo.addEventListener("pointerleave", () => {
    footerLogo.classList.remove("is-hovered");
});

footerLogo.addEventListener("focus", () => {
    footerLogo.classList.add("is-hovered");
});

footerLogo.addEventListener("blur", () => {
    footerLogo.classList.remove("is-hovered");
});

document.querySelectorAll("[data-card-tilt]").forEach((card) => {
    card.addEventListener("pointermove", (event) => {
        if (event.pointerType === "touch") return;

        const bounds = card.getBoundingClientRect();
        const x = (event.clientX - bounds.left) / bounds.width;
        const y = (event.clientY - bounds.top) / bounds.height;

        card.style.setProperty("--rotate-x", `${(0.5 - y) * 8}deg`);
        card.style.setProperty("--rotate-y", `${(x - 0.5) * 8}deg`);
    });

    card.addEventListener("pointerleave", () => {
        card.style.setProperty("--rotate-x", "0deg");
        card.style.setProperty("--rotate-y", "0deg");
    });
});

const globeRoot = document.querySelector("[data-globe]");
const globeCanvas = globeRoot.querySelector(".intro-globe-canvas");
const globeContext = globeCanvas.getContext("2d", { alpha: true });
const globeStatus = globeRoot.querySelector(".globe-status");
// Paleta e movimento equivalentes à configuração do demo 3D do Aceternity.
// Centralizar estes valores impede que halo, atmosfera e contorno usem tons diferentes.
const globeConfig = {
    atmosphereColor: { red: 77, green: 166, blue: 255 }, // #4da6ff
    atmosphereIntensity: 20,
    bumpScale: 5,
    autoRotateSpeed: 0.3,
};
const globeAtmosphere = `rgb(${globeConfig.atmosphereColor.red} ${globeConfig.atmosphereColor.green} ${globeConfig.atmosphereColor.blue}`;
const globeAtmosphereBlend = globeConfig.atmosphereIntensity / 90;
const globeMarkers = [
    { lat: 40.7128, lng: -74.006, src: "https://assets.aceternity.com/avatars/1.webp", label: "New York" },
    { lat: 51.5074, lng: -0.1278, src: "https://assets.aceternity.com/avatars/2.webp", label: "London" },
    { lat: 35.6762, lng: 139.6503, src: "https://assets.aceternity.com/avatars/3.webp", label: "Tokyo" },
    { lat: -33.8688, lng: 151.2093, src: "https://assets.aceternity.com/avatars/4.webp", label: "Sydney" },
    { lat: 48.8566, lng: 2.3522, src: "https://assets.aceternity.com/avatars/5.webp", label: "Paris" },
    { lat: 28.6139, lng: 77.209, src: "https://assets.aceternity.com/avatars/6.webp", label: "New Delhi" },
    { lat: 55.7558, lng: 37.6173, src: "https://assets.aceternity.com/avatars/7.webp", label: "Moscow" },
    { lat: -22.9068, lng: -43.1729, src: "https://assets.aceternity.com/avatars/8.webp", label: "Rio de Janeiro" },
    { lat: 31.2304, lng: 121.4737, src: "https://assets.aceternity.com/avatars/9.webp", label: "Shanghai" },
    { lat: 25.2048, lng: 55.2708, src: "https://assets.aceternity.com/avatars/10.webp", label: "Dubai" },
    { lat: -34.6037, lng: -58.3816, src: "https://assets.aceternity.com/avatars/11.webp", label: "Buenos Aires" },
    { lat: 1.3521, lng: 103.8198, src: "https://assets.aceternity.com/avatars/12.webp", label: "Singapore" },
    { lat: 37.5665, lng: 126.978, src: "https://assets.aceternity.com/avatars/13.webp", label: "Seoul" },
].map((marker) => {
    const image = new Image();
    image.src = marker.src;
    image.onload = renderGlobe;
    return { ...marker, image };
});
const earthTexture = new Image();
const earthTextureCanvas = document.createElement("canvas");
const earthTextureContext = earthTextureCanvas.getContext("2d", { willReadFrequently: true });
let earthTexturePixels = null;
let globeImageData = null;
let globeWidth = 0;
let globeHeight = 0;
let globeRadius = 0;
let globeCenter = { x: 0, y: 0 };
let globeAngle = 1.2;
let globeTilt = -0.08;
let globeHoveredMarker = null;
let globeDragPointer = null;
let globeLastPointer = { x: 0, y: 0 };
let globeLastFrame = 0;
let globeVisible = false;
let globeAnimationFrame = 0;

earthTexture.onload = () => {
    earthTextureCanvas.width = earthTexture.naturalWidth;
    earthTextureCanvas.height = earthTexture.naturalHeight;
    earthTextureContext.drawImage(earthTexture, 0, 0);
    try {
        earthTexturePixels = earthTextureContext.getImageData(
            0,
            0,
            earthTextureCanvas.width,
            earthTextureCanvas.height,
        ).data;
    } catch (error) {
        if (!(error instanceof DOMException && error.name === "SecurityError")) throw error;
        globeStatus.textContent = "Open this page with VS Code Live Server to load the globe texture.";
    }
    renderGlobe();
};
earthTexture.onerror = () => {
    globeStatus.textContent = "The globe texture could not be loaded.";
};
earthTexture.src = "assets/images/earth-atmosphere.jpg";

function projectGlobeMarker(marker) {
    const latitude = (marker.lat * Math.PI) / 180;
    const longitude = (marker.lng * Math.PI) / 180;
    const x = Math.cos(latitude) * Math.sin(longitude);
    const y = Math.sin(latitude);
    const z = Math.cos(latitude) * Math.cos(longitude);
    const horizontalX = x * Math.cos(globeAngle) + z * Math.sin(globeAngle);
    const horizontalZ = -x * Math.sin(globeAngle) + z * Math.cos(globeAngle);
    const rotatedY = y * Math.cos(globeTilt) - horizontalZ * Math.sin(globeTilt);
    const rotatedZ = y * Math.sin(globeTilt) + horizontalZ * Math.cos(globeTilt);

    return {
        x: globeCenter.x + horizontalX * globeRadius,
        y: globeCenter.y - rotatedY * globeRadius,
        z: rotatedZ,
    };
}

function renderGlobe() {
    const bounds = globeCanvas.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;

    const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.25, 440 / Math.min(bounds.width, bounds.height));
    globeWidth = Math.round(bounds.width * pixelRatio);
    globeHeight = Math.round(bounds.height * pixelRatio);
    if (globeCanvas.width !== globeWidth || globeCanvas.height !== globeHeight) {
        globeCanvas.width = globeWidth;
        globeCanvas.height = globeHeight;
        globeImageData = globeContext.createImageData(globeWidth, globeHeight);
    }

    globeCenter = { x: globeWidth / 2, y: globeHeight / 2 };
    globeRadius = Math.min(globeWidth, globeHeight) * 0.42;
    globeImageData.data.fill(0);

    if (earthTexturePixels) {
        const textureWidth = earthTextureCanvas.width;
        const textureHeight = earthTextureCanvas.height;
        const textureScale = textureWidth / (Math.PI * 2);
        const cosAngle = Math.cos(globeAngle);
        const sinAngle = Math.sin(globeAngle);
        const cosTilt = Math.cos(globeTilt);
        const sinTilt = Math.sin(globeTilt);

        for (let py = 0; py < globeHeight; py += 1) {
            const screenY = (globeCenter.y - py) / globeRadius;
            for (let px = 0; px < globeWidth; px += 1) {
                const screenX = (px - globeCenter.x) / globeRadius;
                const distance = screenX * screenX + screenY * screenY;
                if (distance > 1) continue;

                const screenZ = Math.sqrt(1 - distance);
                const worldY = screenY * cosTilt + screenZ * sinTilt;
                const tiltedZ = -screenY * sinTilt + screenZ * cosTilt;
                const worldX = screenX * cosAngle - tiltedZ * sinAngle;
                const worldZ = screenX * sinAngle + tiltedZ * cosAngle;
                const latitude = Math.asin(Math.max(-1, Math.min(1, worldY)));
                const longitude = Math.atan2(worldX, worldZ);
                const textureX = Math.floor((longitude + Math.PI) * textureScale) % textureWidth;
                const textureY = Math.max(0, Math.min(
                    textureHeight - 1,
                    Math.floor((Math.PI / 2 - latitude) * textureScale),
                ));
                const textureIndex = (textureY * textureWidth + textureX) * 4;
                const outputIndex = (py * globeWidth + px) * 4;
                const illumination = Math.max(
                    0.3,
                    0.58 + 0.42 * (screenX * -0.38 + screenY * 0.5 + screenZ * 0.78),
                );
                const atmosphere = ((1 - screenZ) ** 3) * globeAtmosphereBlend;

                globeImageData.data[outputIndex] =
                    earthTexturePixels[textureIndex] * illumination * (1 - atmosphere) + globeConfig.atmosphereColor.red * atmosphere;
                globeImageData.data[outputIndex + 1] =
                    earthTexturePixels[textureIndex + 1] * illumination * (1 - atmosphere) + globeConfig.atmosphereColor.green * atmosphere;
                globeImageData.data[outputIndex + 2] =
                    earthTexturePixels[textureIndex + 2] * illumination * (1 - atmosphere) + globeConfig.atmosphereColor.blue * atmosphere;
                globeImageData.data[outputIndex + 3] = 255;
            }
        }
        globeContext.putImageData(globeImageData, 0, 0);
    } else {
        const ocean = globeContext.createRadialGradient(
            globeCenter.x - globeRadius * 0.25,
            globeCenter.y - globeRadius * 0.3,
            globeRadius * 0.04,
            globeCenter.x,
            globeCenter.y,
            globeRadius,
        );
        ocean.addColorStop(0, "#3b9bd8");
        ocean.addColorStop(0.6, "#1264a3");
        ocean.addColorStop(1, "#052447");
        globeContext.beginPath();
        globeContext.arc(globeCenter.x, globeCenter.y, globeRadius, 0, Math.PI * 2);
        globeContext.fillStyle = ocean;
        globeContext.fill();
    }

    globeContext.save();
    globeContext.beginPath();
    globeContext.arc(globeCenter.x, globeCenter.y, globeRadius, 0, Math.PI * 2);
    globeContext.strokeStyle = `${globeAtmosphere} / 68%)`;
    globeContext.lineWidth = Math.max(1, globeWidth / 400);
    globeContext.shadowColor = `${globeAtmosphere} / 60%)`;
    globeContext.shadowBlur = globeWidth * 0.025;
    globeContext.stroke();
    globeContext.restore();

    const visibleMarkers = globeMarkers
        .map((marker) => ({ ...marker, point: projectGlobeMarker(marker) }))
        .filter((marker) => marker.point.z > 0.08)
        .sort((first, second) => first.point.z - second.point.z);

    visibleMarkers.forEach((marker) => {
        const radius = (globeWidth / 72 + marker.point.z * globeWidth / 150) * (marker.label === globeHoveredMarker ? 1.18 : 1);
        globeContext.beginPath();
        globeContext.arc(marker.point.x, marker.point.y, radius + globeWidth / 260, 0, Math.PI * 2);
        globeContext.fillStyle = `${globeAtmosphere} / 40%)`;
        globeContext.fill();
        globeContext.save();
        globeContext.beginPath();
        globeContext.arc(marker.point.x, marker.point.y, radius, 0, Math.PI * 2);
        globeContext.clip();
        if (marker.image.complete && marker.image.naturalWidth > 0) {
            globeContext.drawImage(
                marker.image,
                marker.point.x - radius,
                marker.point.y - radius,
                radius * 2,
                radius * 2,
            );
        } else {
            globeContext.fillStyle = "#f4fbff";
            globeContext.fill();
        }
        globeContext.restore();
        globeContext.beginPath();
        globeContext.arc(marker.point.x, marker.point.y, radius, 0, Math.PI * 2);
        globeContext.lineWidth = Math.max(1, globeWidth / 220);
        globeContext.strokeStyle = "#f4fbff";
        globeContext.stroke();

        if (marker.label === globeHoveredMarker) {
            const fontSize = Math.max(10, globeWidth / 34);
            globeContext.font = `600 ${fontSize}px Arial, sans-serif`;
            const labelWidth = globeContext.measureText(marker.label).width;
            const labelX = Math.min(
                Math.max(marker.point.x + radius + fontSize * 0.6, fontSize),
                globeWidth - labelWidth - fontSize,
            );
            const labelY = Math.max(marker.point.y - radius, fontSize * 2);
            globeContext.fillStyle = "rgb(36 51 75 / 88%)";
            globeContext.beginPath();
            globeContext.roundRect(
                labelX - fontSize * 0.5,
                labelY - fontSize * 1.2,
                labelWidth + fontSize,
                fontSize * 1.8,
                fontSize,
            );
            globeContext.fill();
            globeContext.fillStyle = "#fff";
            globeContext.fillText(marker.label, labelX, labelY);
        }
    });

    globeCanvas.dataset.visibleMarkers = JSON.stringify(visibleMarkers.map(({ label, point }) => ({ label, ...point })));
}

function findGlobeMarker(event) {
    const bounds = globeCanvas.getBoundingClientRect();
    const scaleX = globeCanvas.width / bounds.width;
    const scaleY = globeCanvas.height / bounds.height;
    const x = (event.clientX - bounds.left) * scaleX;
    const y = (event.clientY - bounds.top) * scaleY;
    return globeMarkers
        .map((marker) => ({ marker, point: projectGlobeMarker(marker) }))
        .filter(({ point }) => point.z > 0.08)
        .find(({ point }) => Math.hypot(point.x - x, point.y - y) < globeWidth / 25)?.marker ?? null;
}

globeCanvas.addEventListener("pointerdown", (event) => {
    globeDragPointer = event.pointerId;
    globeLastPointer = { x: event.clientX, y: event.clientY };
    globeCanvas.setPointerCapture(event.pointerId);
});
globeCanvas.addEventListener("pointermove", (event) => {
    if (globeDragPointer === event.pointerId) {
        const scale = Math.max(globeCanvas.getBoundingClientRect().width, 1);
        globeAngle += (event.clientX - globeLastPointer.x) / scale;
        globeTilt = Math.max(-Math.PI, Math.min(
            Math.PI,
            globeTilt + (event.clientY - globeLastPointer.y) / scale,
        ));
        globeLastPointer = { x: event.clientX, y: event.clientY };
        globeHoveredMarker = null;
        renderGlobe();
        return;
    }

    const marker = findGlobeMarker(event);
    if (marker?.label !== globeHoveredMarker) {
        globeHoveredMarker = marker?.label ?? null;
        globeStatus.textContent = marker ? `Location: ${marker.label}` : "Roll the globe to explore";
        globeCanvas.style.cursor = marker ? "pointer" : "grab";
        renderGlobe();
    }
});
globeCanvas.addEventListener("pointerup", (event) => {
    if (globeDragPointer !== event.pointerId) return;
    globeDragPointer = null;
    const marker = findGlobeMarker(event);
    if (marker) {
        globeStatus.textContent = `Selected location: ${marker.label}`;
    }
});
globeCanvas.addEventListener("pointercancel", () => {
    globeDragPointer = null;
});
globeCanvas.addEventListener("pointerleave", () => {
    if (globeDragPointer === null && globeHoveredMarker) {
        globeHoveredMarker = null;
        globeStatus.textContent = "Drag the globe to explore";
        globeCanvas.style.cursor = "grab";
        renderGlobe();
    }
});
globeCanvas.addEventListener("keydown", (event) => {
    const rotation = 0.12;
    if (event.key === "ArrowLeft") globeAngle -= rotation;
    else if (event.key === "ArrowRight") globeAngle += rotation;
    else if (event.key === "ArrowUp") globeTilt = Math.max(-Math.PI, globeTilt - rotation);
    else if (event.key === "ArrowDown") globeTilt = Math.min(Math.PI, globeTilt + rotation);
    else return;
    event.preventDefault();
    renderGlobe();
});

const globeReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
function animateGlobe(timestamp) {
    globeAnimationFrame = 0;
    if (!globeVisible || document.hidden || globeReducedMotion.matches) return;

    if (timestamp - globeLastFrame >= 33) {
        globeLastFrame = timestamp;
        if (globeDragPointer === null) {
            globeAngle = (globeAngle + globeConfig.autoRotateSpeed * 0.004) % (Math.PI * 2);
            renderGlobe();
        }
    }
    globeAnimationFrame = requestAnimationFrame(animateGlobe);
}

function updateGlobeAnimation() {
    if (globeAnimationFrame) {
        cancelAnimationFrame(globeAnimationFrame);
        globeAnimationFrame = 0;
    }
    if (globeVisible && !document.hidden && !globeReducedMotion.matches) {
        globeAnimationFrame = requestAnimationFrame(animateGlobe);
    }
}

new IntersectionObserver(([entry]) => {
    globeVisible = entry.isIntersecting;
    updateGlobeAnimation();
}).observe(globeRoot);
document.addEventListener("visibilitychange", updateGlobeAnimation);
globeReducedMotion.addEventListener("change", updateGlobeAnimation);
new ResizeObserver(renderGlobe).observe(globeRoot);
renderGlobe();

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
        const target = document.getElementById(link.hash.slice(1));
        if (!target) return;

        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
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
}

video.addEventListener("seeked", () => {
    isSeeking = false;
    if (!video.requestVideoFrameCallback) syncVideoCopy(video.currentTime);
    if (pendingTime !== null) {
        const nextTime = pendingTime;
        pendingTime = null;
        renderVideoFrame(nextTime);
    }
});

// Normalized media windows, tuned to the 17.5-second voyage.
// Each card has its own safe position as the navigator crosses the frame.
const copyChapters = [
    { start: 0.075, end: 0.235, side: "right", position: "center" },
    { start: 0.25, end: 0.425, side: "right", position: "center" },
    { start: 0.44, end: 0.615, side: "left", position: "center" },
    { start: 0.63, end: 0.805, side: "right", position: "center" },
    { start: 0.82, end: 1, side: "right", position: "center" },
];
const clampCopy = (value) => Math.max(0, Math.min(1, value));
videoCopyCards.forEach((card, index) => {
    card.dataset.side = copyChapters[index]?.side || "right";
    card.dataset.position = copyChapters[index]?.position || "center";
    card.inert = true;
});
function syncVideoCopy(mediaTime) {
    if (!Number.isFinite(video.duration) || !video.duration) return;
    const position = mediaTime / video.duration;
    let anyVisible = false;
    videoCopyCards.forEach((card, index) => {
        const chapter = copyChapters[index];
        if (!chapter) return;
        const enter = clampCopy((position - chapter.start) / 0.018);
        const exit = chapter.end === 1 ? 1 : clampCopy((chapter.end - position) / 0.018);
        const alpha = Math.min(enter, exit);
        const visible = alpha > 0.01;
        anyVisible ||= visible;
        gsap.set(card, { autoAlpha: alpha, y: reduceMotionPreference.matches ? 0 : (1 - alpha) * 12 });
        // Internal content uses the same displayed media time as the card.
        // The reveal completes early in each chapter and reverses deterministically.
        const groups = [card.querySelector(".video-copy-eyebrow"), card.querySelector("h2"), card.querySelector(".video-copy-description"), card.querySelector(".video-copy-cta")].filter(Boolean);
        groups.forEach((element, order) => {
            const reveal = reduceMotionPreference.matches ? 1 : clampCopy((position - chapter.start - order * 0.006) / 0.022);
            const eased = 1 - Math.pow(1 - reveal, 3);
            gsap.set(element, { opacity: eased, y: reduceMotionPreference.matches ? 0 : (1 - eased) * 14 });
        });
        gsap.set(card.querySelectorAll(".generated-word"), { autoAlpha: 1, y: 0 });
        card.setAttribute("aria-hidden", String(!visible));
        card.inert = !visible;
    });
    videoCopy.setAttribute("aria-hidden", String(!anyVisible));
}
reduceMotionPreference.addEventListener("change", () => syncVideoCopy(video.currentTime));

// Configuração do ScrollTrigger
let videoAnimationInitialized = false;
function initScrollAnimation() {
    hideLoader();
    if (videoAnimationInitialized) return;
    if (!Number.isFinite(video.duration) || video.duration <= 0) {
        hint.textContent = "The video duration could not be read.";
        return;
    }

    videoAnimationInitialized = true;
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
      .to(video, { opacity: 1, duration: 0.06, ease: "power1.out" }, 0)
      .to(scrollCue, { autoAlpha: 0, duration: 0.03 }, 0.04);

    // 2. Barra de progresso (acelerada por GPU com scaleX)
    tl.to(progress, { scaleX: 1, ease: "none", duration: 1 }, 0);

    // 3. Sincronização ultra responsiva do vídeo com o scroll
    tl.to(videoState, {
        currentTime: Math.max(0, video.duration - 1 / 30),
        ease: "none",
        duration: 1,
        onUpdate: () => renderVideoFrame(videoState.currentTime)
    }, 0);

    // Cards follow the displayed media frame, not the requested scroll position.
    syncVideoCopy(video.currentTime);
    if (video.requestVideoFrameCallback) {
        const onFrame = (_now, metadata) => {
            syncVideoCopy(metadata.mediaTime);
            video.requestVideoFrameCallback(onFrame);
        };
        video.requestVideoFrameCallback(onFrame);
    }

    ScrollTrigger.refresh();
}

if (video.readyState >= 1) {
    initScrollAnimation();
} else {
    video.addEventListener("loadedmetadata", initScrollAnimation);
}

video.addEventListener("error", () => {
    hideLoader();
    hint.textContent = window.location.protocol === "file:"
        ? "Open this page with VS Code Live Server to enable the video and globe texture."
        : "The video could not be loaded. Check that assets/media/Navegante.mp4 is available.";
});

// Section contents reveal independently from the video and keep card tilt intact.
const contentMotion = gsap.matchMedia();
contentMotion.add("(prefers-reduced-motion: no-preference)", () => {
    const reveal = (elements, trigger, options = {}) => {
        const items = [...elements];
        if (!items.length) return;
        gsap.from(items, {
            autoAlpha: 0, y: 20, scale: 0.94, duration: 0.7,
            stagger: 0.08, ease: "back.out(1.2)",
            scrollTrigger: { trigger, start: "top 88%", toggleActions: "play none none reverse" },
            ...options,
        });
    };
    document.querySelectorAll(".intro-content, .milestone-intro, .visibility-content, .markets-content, .faq-content, .how-it-works > div").forEach(container => {
        reveal(container.querySelectorAll(":scope > .intro-eyebrow, :scope > h1, :scope > h2, :scope > p"), container);
    });
    document.querySelectorAll(".process-card").forEach(card => {
        reveal(card.querySelectorAll(".process-card-image"), card, { y: 16, duration: 0.85 });
        reveal(card.querySelectorAll(".process-card-content > *"), card, { delay: 0.12, stagger: 0.08 });
    });
    document.querySelectorAll(".milestone-row").forEach(row => {
        reveal(row.querySelectorAll(":scope > .milestone-number, .milestone-details > *, .milestone-share"), row, { y: 18, stagger: 0.07 });
    });
    document.querySelectorAll(".visibility-item, .market-card-content, .faq-item, .footer-column, .footer-about").forEach(container => {
        reveal(container.children, container, { y: 16, duration: 0.55, stagger: 0.07 });
    });
    const globe = document.querySelector(".intro-globe");
    if (globe) reveal([globe], globe, { scale: 0.94, y: 16, duration: 0.9 });
});
window.addEventListener("load", () => ScrollTrigger.refresh(), { once: true });

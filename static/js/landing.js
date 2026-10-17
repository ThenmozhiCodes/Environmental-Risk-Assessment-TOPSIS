// ================================
// EcoRisk Landing Page JavaScript
// ================================

// Navbar background on scroll

const nav = document.querySelector("nav");

window.addEventListener("scroll", () => {

    if (window.scrollY > 50) {

        nav.style.background = "rgba(5,25,20,.95)";
        nav.style.boxShadow = "0 10px 30px rgba(0,0,0,.3)";

    } else {

        nav.style.background = "rgba(5,25,20,.75)";
        nav.style.boxShadow = "none";

    }

});


// ================================
// Hero Fade Animation
// ================================

window.addEventListener("load", () => {

    const content = document.querySelector(".content");
    const video = document.querySelector(".videoCard");

    content.style.opacity = "0";
    video.style.opacity = "0";

    setTimeout(() => {

        content.style.transition = "1s";
        content.style.opacity = "1";

        video.style.transition = "1.5s";
        video.style.opacity = "1";

    }, 200);

});


// ================================
// Card Hover Animation
// ================================

const cards = document.querySelectorAll(".card");

cards.forEach(card => {

    card.addEventListener("mouseenter", () => {

        card.style.transform = "translateY(-12px) scale(1.03)";

    });

    card.addEventListener("mouseleave", () => {

        card.style.transform = "translateY(0px) scale(1)";

    });

});


// ================================
// Button Glow Effect
// ================================

const buttons = document.querySelectorAll(".btnGreen, .btnWhite, .loginBtn");

buttons.forEach(btn => {

    btn.addEventListener("mouseenter", () => {

        btn.style.boxShadow = "0 0 25px rgba(24,214,137,.5)";

    });

    btn.addEventListener("mouseleave", () => {

        btn.style.boxShadow = "none";

    });

});


// ================================
// Video Controls
// ================================

const ecoVideo = document.getElementById("ecoVideo");

// Start muted so autoplay is allowed
ecoVideo.muted = true;

ecoVideo.play().catch(() => {
    console.log("Autoplay blocked until user interacts.");
});

// Unmute after first click
document.addEventListener("click", () => {

    ecoVideo.muted = false;

}, { once: true });


// ================================
// Scroll Reveal
// ================================

const observer = new IntersectionObserver((entries) => {

    entries.forEach(entry => {

        if (entry.isIntersecting) {

            entry.target.style.opacity = "1";
            entry.target.style.transform = "translateY(0px)";

        }

    });

}, {

    threshold: 0.2

});

document.querySelectorAll(".card").forEach(card => {

    card.style.opacity = "0";
    card.style.transform = "translateY(40px)";
    card.style.transition = "0.8s";

    observer.observe(card);

});


// ================================
// Typing Cursor Effect
// ================================

const title = document.querySelector(".content h1");

title.style.borderRight = "4px solid #18d689";

setInterval(() => {

    if (title.style.borderRight === "none") {

        title.style.borderRight = "4px solid #18d689";

    } else {

        title.style.borderRight = "none";

    }

}, 600);


// ================================
// Console
// ================================

console.log("EcoRisk Landing Page Loaded Successfully 🌍");
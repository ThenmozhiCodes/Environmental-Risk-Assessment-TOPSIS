// ======================================
// FLASH MESSAGE AUTO HIDE
// ======================================

const flash = document.querySelector(".flash-container");

if (flash) {

    setTimeout(() => {

        flash.style.transition = "0.6s";
        flash.style.opacity = "0";
        flash.style.transform = "translateX(350px)";

        setTimeout(() => {

            flash.remove();

        }, 600);

    }, 3000);

}


// ======================================
// HERO FADE ANIMATION
// ======================================

window.addEventListener("load", () => {

    document.querySelector(".hero-left").classList.add("show");

    setTimeout(() => {

        document.querySelector(".hero-right").classList.add("show");

    }, 300);

});


// ======================================
// SCROLL REVEAL
// ======================================

const revealElements = document.querySelectorAll(
    ".module,.feature-box"
);

function reveal() {

    const trigger = window.innerHeight - 120;

    revealElements.forEach((el) => {

        const top = el.getBoundingClientRect().top;

        if (top < trigger) {

            el.classList.add("active");

        }

    });

}

window.addEventListener("scroll", reveal);

reveal();


// ======================================
// MODULE HOVER EFFECT
// ======================================

const modules = document.querySelectorAll(".module");

modules.forEach((card) => {

    card.addEventListener("mouseenter", () => {

        card.style.transform = "scale(1.02)";

    });

    card.addEventListener("mouseleave", () => {

        card.style.transform = "scale(1)";

    });

});


// ======================================
// COUNTER ANIMATION
// ======================================

const counters = document.querySelectorAll(".counter");

counters.forEach(counter => {

    const update = () => {

        const target = +counter.getAttribute("data-target");

        const count = +counter.innerText;

        const increment = target / 80;

        if (count < target) {

            counter.innerText = Math.ceil(count + increment);

            setTimeout(update, 25);

        } else {

            counter.innerText = target;

        }

    };

    update();

});


// ======================================
// SMOOTH SCROLL
// ======================================

document.querySelectorAll('a[href^="#"]').forEach(anchor => {

    anchor.addEventListener("click", function (e) {

        e.preventDefault();

        document.querySelector(this.getAttribute("href"))
            .scrollIntoView({

                behavior: "smooth"

            });

    });

});
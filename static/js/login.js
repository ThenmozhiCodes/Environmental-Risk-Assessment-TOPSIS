// ========================================
// EcoRisk Login Page JavaScript
// ========================================

// Password Show / Hide

const password = document.getElementById("password");
const togglePassword = document.getElementById("togglePassword");

togglePassword.addEventListener("click", function () {

    if (password.type === "password") {

        password.type = "text";

        togglePassword.classList.remove("fa-eye");
        togglePassword.classList.add("fa-eye-slash");

    }

    else {

        password.type = "password";

        togglePassword.classList.remove("fa-eye-slash");
        togglePassword.classList.add("fa-eye");

    }

});


// ========================================
// Input Focus Animation
// ========================================

const inputs = document.querySelectorAll(".inputBox input");

inputs.forEach(input => {

    input.addEventListener("focus", function () {

        this.parentElement.style.transform = "scale(1.02)";
        this.parentElement.style.transition = "0.3s";

    });

    input.addEventListener("blur", function () {

        this.parentElement.style.transform = "scale(1)";

    });

});


// ========================================
// Login Button Hover
// ========================================

const loginBtn = document.querySelector("button");

loginBtn.addEventListener("mouseenter", function () {

    loginBtn.style.boxShadow = "0 0 20px rgba(24,165,90,0.4)";

});

loginBtn.addEventListener("mouseleave", function () {

    loginBtn.style.boxShadow = "none";

});


// ========================================
// Auto Hide Flash Message
// ========================================

const flashMessage = document.querySelector(".flash");

if (flashMessage) {

    setTimeout(() => {

        flashMessage.style.opacity = "0";

        setTimeout(() => {

            flashMessage.style.display = "none";

        }, 500);

    }, 2500);

}


// ========================================
// Prevent Empty Spaces
// ========================================

document.getElementById("loginForm").addEventListener("submit", function (e) {

    const email = document.getElementById("email").value.trim();
    const passwordValue = document.getElementById("password").value.trim();

    if (email === "" || passwordValue === "") {

        e.preventDefault();

        alert("Please fill in all fields.");

    }

});


// ========================================
// Console
// ========================================

console.log("EcoRisk Login Page Loaded Successfully 🌍");
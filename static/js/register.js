// ==========================
// Password Show/Hide Toggle
// ==========================

const togglePassword = document.getElementById("togglePassword");
const password = document.getElementById("password");

if (togglePassword && password) {
    togglePassword.addEventListener("click", function () {
        const type = password.getAttribute("type") === "password" ? "text" : "password";
        password.setAttribute("type", type);

        this.classList.toggle("fa-eye");
        this.classList.toggle("fa-eye-slash");
    });
}


// ==========================
// Confirm Password Validation
// ==========================

const form = document.getElementById("registerForm");

if (form) {
    form.addEventListener("submit", function (e) {

        const password = document.getElementById("password").value;
        const confirmPassword = document.getElementById("confirmPassword").value;

        if (password !== confirmPassword) {
            e.preventDefault();
            alert("Passwords do not match!");
        }

    });
}
const toggle = document.querySelector(".menu-toggle");
const nav = document.querySelector(".nav");
if (toggle) {
  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));
  });
}
document.querySelectorAll(".nav a").forEach(link => {
  link.addEventListener("click", () => {
    nav.classList.remove("open");
    toggle?.setAttribute("aria-expanded", "false");
  });
});
function signup(event) {
  event.preventDefault();
  const email = document.querySelector("#signup-email").value.trim();
  document.querySelector("#signup-message").textContent =
    email ? "Thank you. Connect this form to your email platform before launch." : "";
  return false;
}
function inquiry(event) {
  event.preventDefault();
  document.querySelector("#inquiry-message").textContent =
    "Your inquiry form is styled and ready. Connect it to your preferred form service before launch.";
  return false;
}
document.querySelector("#year").textContent = new Date().getFullYear();

import { normalizeWalletSession } from "./currency_wallet.js";

const SESSION_KEY = "supgeul_phase2_alpha_session";

let toastTimer = null;

const $ = (selector) => document.querySelector(selector);

function readSession() {
  try {
    return normalizeWalletSession(JSON.parse(localStorage.getItem(SESSION_KEY)) || { user: null });
  } catch {
    return normalizeWalletSession({ user: null });
  }
}

function writeSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(normalizeWalletSession(session)));
}

function nextPage() {
  const params = new URLSearchParams(location.search);
  const next = params.get("next") || "phase2_alpha_front_home.html";
  if (/^[a-z0-9_./-]+\.html$/i.test(next)) return next;
  return "phase2_alpha_front_home.html";
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 1200);
}

function login(provider) {
  const session = readSession();
  writeSession({
    ...session,
    user: {
      name: "테스트계정",
      provider,
      joinedAt: new Date().toISOString(),
    },
  });
  showToast("테스트계정으로 로그인했습니다.");
  setTimeout(() => {
    location.href = `./${nextPage()}`;
  }, 500);
}

document.querySelectorAll("[data-auth-provider]").forEach((button) => {
  button.addEventListener("click", () => login(button.dataset.authProvider));
});

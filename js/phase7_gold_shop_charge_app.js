const SESSION_KEY = "supgeul_phase2_alpha_session";

const products = [
  { id: "gold_5000", gold: 5000, price: 5000, description: "가볍게 구매 흐름을 확인하는 기본 충전" },
  { id: "gold_15000", gold: 15000, price: 15000, description: "여러 작품 구매 테스트에 맞춘 충전" },
  { id: "gold_30000", gold: 30000, price: 30000, description: "연속 구매와 후원 흐름 확인용 충전" },
  { id: "gold_50000", gold: 50000, price: 50000, description: "대량 테스트용 골드 충전" },
];

let selectedProductId = products[1].id;
let toastTimer = null;

const $ = (selector) => document.querySelector(selector);

function readSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY)) || { user: null, gold: 0 };
  } catch {
    return { user: null, gold: 0 };
  }
}

function writeSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString("ko-KR");
}

function selectedProduct() {
  return products.find((product) => product.id === selectedProductId) || products[0];
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 1600);
}

function ensureLogin() {
  const session = readSession();
  if (session.user) return session;
  location.href = "./phase2_auth_entry.html?next=phase7_gold_shop_charge.html";
  return null;
}

function renderBalance() {
  const session = readSession();
  $("#shopGoldBalance").textContent = `${formatNumber(session.gold)}골드`;
}

function renderProducts() {
  $("#productGrid").innerHTML = products
    .map(
      (product) => `<button class="gold-product-card ${product.id === selectedProductId ? "selected" : ""}" type="button" data-product-id="${product.id}">
        <span class="gold-icon">G</span>
        <strong>${formatNumber(product.gold)}골드</strong>
        <p>${product.description}</p>
        <b>${formatNumber(product.price)}원</b>
      </button>`,
    )
    .join("");
}

function renderCheckout() {
  const product = selectedProduct();
  $("#selectedProductName").textContent = `${formatNumber(product.gold)}골드`;
  $("#selectedProductPrice").textContent = `${formatNumber(product.price)}원`;
}

function render() {
  renderBalance();
  renderProducts();
  renderCheckout();
}

function chargeSelectedProduct() {
  const session = ensureLogin();
  if (!session) return;
  const product = selectedProduct();
  session.gold = Number(session.gold || 0) + product.gold;
  writeSession(session);
  renderBalance();
  showToast(`${formatNumber(product.gold)}골드가 충전되었습니다.`);
  setTimeout(() => {
    location.href = "./phase2_alpha_front_home.html";
  }, 700);
}

function bindEvents() {
  $("#productGrid").addEventListener("click", (event) => {
    const card = event.target.closest("[data-product-id]");
    if (!card) return;
    selectedProductId = card.dataset.productId;
    render();
  });

  $("#chargeSelectedProduct").addEventListener("click", chargeSelectedProduct);
}

function boot() {
  ensureLogin();
  render();
  bindEvents();
}

boot();

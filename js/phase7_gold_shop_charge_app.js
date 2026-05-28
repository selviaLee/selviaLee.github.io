const SESSION_KEY = "supgeul_phase2_alpha_session";

const products = {
  gold: [
    { id: "gold_5000", gold: 5000, price: 5000, description: "가볍게 구매 흐름을 확인하는 기본 충전" },
    { id: "gold_15000", gold: 15000, price: 15000, description: "여러 작품 구매 테스트에 맞춘 충전" },
    { id: "gold_30000", gold: 30000, price: 30000, description: "연속 구매와 후원 흐름 확인용 충전" },
    { id: "gold_50000", gold: 50000, price: 50000, description: "대량 테스트용 골드 충전" },
  ],
  author: [
    { id: "queue_ticket", name: "대기열 추가권", price: 1200, description: "작품 대기열을 1칸 늘리는 작가용 티켓" },
    { id: "nickname_ticket", name: "닉네임 변경권", price: 500, description: "작가 닉네임 추가 변경 mock 티켓" },
  ],
  user: [
    { id: "save_slot_ticket", name: "저장 슬롯 추가권", price: 700, description: "갈래글 진행 저장 슬롯을 늘리는 유저용 티켓" },
    { id: "scene_keep_ticket", name: "장면 소장권", price: 100, description: "갈래글 장면 소장 흐름 테스트 티켓" },
  ],
  world: [
    { id: "world_import_ticket", name: "세계관 가져오기권", price: 0, description: "무료 세계관 가져오기 흐름을 확인하는 mock 상품" },
    { id: "world_slot_ticket", name: "세계관 보관 확장권", price: 900, description: "세계관 보관 확장 후보 상품" },
  ],
};

let activeTab = "gold";
let selectedProductId = products.gold[1].id;
let toastTimer = null;

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

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
  return products.gold.find((product) => product.id === selectedProductId) || products.gold[0];
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

function renderGoldProducts() {
  return products.gold
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

function renderPlaceholderProducts(tab) {
  return products[tab]
    .map(
      (product) => `<button class="gold-product-card placeholder" type="button" data-empty-action="${product.name}">
        <span class="gold-icon">T</span>
        <strong>${product.name}</strong>
        <p>${product.description}</p>
        <b>${formatNumber(product.price)}원</b>
      </button>`,
    )
    .join("");
}

function renderProducts() {
  $("#productGrid").innerHTML = activeTab === "gold" ? renderGoldProducts() : renderPlaceholderProducts(activeTab);
}

function renderCheckout() {
  const isGold = activeTab === "gold";
  $("#checkoutBox").classList.toggle("hidden", !isGold);
  if (!isGold) return;
  const product = selectedProduct();
  $("#selectedProductName").textContent = `${formatNumber(product.gold)}골드`;
  $("#selectedProductPrice").textContent = `${formatNumber(product.price)}원`;
}

function renderTabs() {
  $$("[data-shop-tab]").forEach((button) => button.classList.toggle("active", button.dataset.shopTab === activeTab));
}

function render() {
  renderBalance();
  renderTabs();
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

  $$("[data-shop-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      activeTab = button.dataset.shopTab;
      render();
    });
  });

  $("#chargeSelectedProduct").addEventListener("click", chargeSelectedProduct);

  document.body.addEventListener("click", (event) => {
    const button = event.target.closest("[data-empty-action]");
    if (!button) return;
    showToast(`${button.dataset.emptyAction} 기능은 알파테스트 준비 중입니다.`);
  });
}

function boot() {
  ensureLogin();
  render();
  bindEvents();
}

boot();

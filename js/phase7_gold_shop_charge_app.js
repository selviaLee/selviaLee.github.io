const SESSION_KEY = "supgeul_phase2_alpha_session";

const products = {
  gold: [
    { id: "forest_seed_100", name: "씨앗 꾸러미", icon: "씨", gold: 100, price: 100, description: "가볍게 구매 흐름을 확인하는 작은 숲결 묶음" },
    { id: "forest_sprout_1000", name: "새싹 꾸러미", icon: "싹", gold: 1000, price: 1000, description: "몇 편의 작품 구매 테스트에 맞춘 숲결 묶음" },
    { id: "forest_tree_10000", name: "나무 꾸러미", icon: "나", gold: 10000, price: 10000, description: "연속 구매와 후원 흐름 확인용 숲결 묶음" },
    { id: "forest_grove_50000", name: "숲 꾸러미", icon: "숲", gold: 50000, price: 50000, description: "대량 테스트용 숲결 묶음" },
  ],
  author: [
    { id: "queue_ticket", name: "대기열 추가권", icon: "열", price: 1200, description: "작품 대기열을 1칸 늘리는 작가용 티켓" },
    { id: "nickname_ticket", name: "닉네임 변경권", icon: "닉", price: 500, description: "작가 닉네임 추가 변경 mock 티켓" },
    { id: "notice_pin_ticket", name: "공지 강조권", icon: "공", price: 300, description: "작가 공지를 일정 기간 더 잘 보이게 하는 후보 상품" },
    { id: "draft_slot_ticket", name: "원고 보관 확장권", icon: "원", price: 900, description: "작가 작업실 원고 보관 슬롯을 늘리는 후보 상품" },
  ],
  user: [
    { id: "save_slot_ticket", name: "저장 슬롯 추가권", icon: "저", price: 700, description: "갈래글 진행 저장 슬롯을 늘리는 유저용 티켓" },
    { id: "scene_keep_ticket", name: "장면 소장권", icon: "장", price: 100, description: "갈래글 장면 소장 흐름 테스트 티켓" },
    { id: "ending_archive_ticket", name: "엔딩 기록 확장권", icon: "끝", price: 600, description: "엔딩 모음 보관 수를 늘리는 후보 상품" },
    { id: "reading_folder_ticket", name: "읽기 카테고리 확장권", icon: "분", price: 400, description: "읽는 작품 개인 카테고리 후보 확장 상품" },
  ],
  world: [
    { id: "world_import_ticket", name: "세계관 가져오기권", icon: "계", price: 0, description: "무료 세계관 가져오기 흐름을 확인하는 mock 상품" },
    { id: "world_slot_ticket", name: "세계관 보관 확장권", icon: "관", price: 900, description: "세계관 보관 확장 후보 상품" },
    { id: "world_publish_slot", name: "세계관 배포 슬롯", icon: "배", price: 1500, description: "무료 세계관 배포 슬롯을 늘리는 후보 상품" },
    { id: "source_lineage_badge", name: "출처 계보 강조권", icon: "출", price: 300, description: "상속 세계관 출처 계보 표시를 강조하는 후보 상품" },
  ],
};

let activeTab = "gold";
let selectedProductId = products.gold[1].id;
let toastTimer = null;

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

function esc(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char]));
}

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
  $("#shopGoldBalance").textContent = `${formatNumber(session.gold)}숲결`;
}

function renderGoldProducts() {
  return products.gold
    .map(
      (product) => `<button class="gold-product-card ${product.id === selectedProductId ? "selected" : ""}" type="button" data-product-id="${product.id}">
        <span class="gold-icon">${esc(product.icon || product.name.slice(0, 1))}</span>
        <strong>${esc(product.name)}</strong>
        <em>${formatNumber(product.gold)}숲결</em>
        <p>${esc(product.description)}</p>
        <b>${formatNumber(product.price)}원</b>
      </button>`,
    )
    .join("");
}

function renderPlaceholderProducts(tab) {
  return products[tab]
    .map(
      (product) => `<button class="gold-product-card placeholder" type="button" data-empty-action="${esc(product.name)}">
        <span class="gold-icon">${esc(product.icon || product.name.slice(0, 1))}</span>
        <strong>${esc(product.name)}</strong>
        <p>${esc(product.description)}</p>
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
  $("#selectedProductName").textContent = `${product.name} · ${formatNumber(product.gold)}숲결`;
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
  showToast(`${formatNumber(product.gold)}숲결이 충전되었습니다.`);
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
  render();
  bindEvents();
}

boot();

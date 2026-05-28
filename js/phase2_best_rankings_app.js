const PHASE1_KEY = "supgeul_phase1_author_studio_v2";

const fallbackWorks = [
  {
    id: "sample_work",
    title: "비밀 숲의 선택자",
    author: "숲고지기",
    genre1: "판타지",
    genre2: "갈래글",
    latest: "2화",
    views: 12400,
    favorites: 84,
    paid: false,
    interactive: true,
    updated: true,
  },
  {
    id: "sample_other",
    title: "햇살 아래의 문장들",
    author: "숲고지기",
    genre1: "판타지",
    genre2: "일반글",
    latest: "12화",
    views: 58000,
    favorites: 160,
    paid: false,
    interactive: false,
    updated: false,
  },
  {
    id: "sample_paid_one",
    title: "오늘 밤 내 글자의 무게",
    author: "달녘",
    genre1: "현대",
    genre2: "일반글",
    latest: "38화",
    views: 49200,
    favorites: 1880,
    paid: true,
    interactive: false,
    updated: true,
  },
  {
    id: "sample_paid_two",
    title: "주사위는 선택지를 미워하지 않는다",
    author: "서바",
    genre1: "성장",
    genre2: "갈래글",
    latest: "64화",
    views: 93400,
    favorites: 6400,
    paid: true,
    interactive: true,
    updated: true,
  },
];

let activeTab = new URLSearchParams(location.search).get("tab") === "free" ? "free" : "paid";
let toastTimer = null;

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

function esc(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char]));
}

function readJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
}

function formatNumber(value) {
  const number = Number(value || 0);
  if (number >= 10000) return `${(number / 10000).toFixed(number >= 100000 ? 0 : 1)}만`;
  return number.toLocaleString("ko-KR");
}

function currentWorks() {
  const saved = readJson(PHASE1_KEY, null);
  const phase1Works = Array.isArray(saved?.works)
    ? saved.works.map((work) => ({
        id: work.id,
        title: work.title || "제목 없는 작품",
        author: work.temporaryAuthorNickname || saved?.users?.[0]?.officialNickname || "작가",
        genre1: work.genre1 || "기타",
        genre2: work.genre2 || (work.type === "interactive" ? "갈래글" : "일반글"),
        latest: `${Math.max(0, (work.episodeOrder || []).length - 1)}화`,
        views: work.views || 0,
        favorites: work.favorites || 0,
        paid: Boolean(work.isPaidWork),
        interactive: work.type === "interactive",
        updated: true,
      }))
    : [];
  return [...phase1Works, ...fallbackWorks];
}

function workHref(work) {
  return work.id ? `./phase3_work_home.html?workId=${encodeURIComponent(work.id)}` : "./phase3_work_home.html";
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 1600);
}

function rankedWorks() {
  return currentWorks()
    .filter((work) => (activeTab === "paid" ? work.paid : !work.paid))
    .sort((a, b) => b.views + b.favorites * 10 - (a.views + a.favorites * 10));
}

function renderTabs() {
  $$("[data-best-tab]").forEach((button) => button.classList.toggle("active", button.dataset.bestTab === activeTab));
  $("#paidBestShortcut")?.classList.toggle("active", activeTab === "paid");
  $("#freeBestShortcut")?.classList.toggle("active", activeTab === "free");
  $("#bestTitle").textContent = activeTab === "paid" ? "유료 베스트" : "무료 베스트";
  document.title = `${activeTab === "paid" ? "유료 베스트" : "무료 베스트"} - 숲글:숲갈래글 (알파테스트:0.0.6)`;
}

function renderList() {
  const works = rankedWorks();
  $("#rankingList").innerHTML = works
    .map(
      (work, index) => `<article class="ranking-row">
        <strong class="rank-no">${index + 1}</strong>
        <div>
          <a class="work-title" href="${workHref(work)}">${esc(work.title)}</a>
          <div class="work-meta">
            <span>${esc(work.author)}</span>
            <span>${esc(work.genre1)}</span>
            <span>${esc(work.genre2)}</span>
            <span>${esc(work.latest)}</span>
          </div>
          <div class="work-stats">
            <span>조회 ${formatNumber(work.views)}</span>
            <span>선호 ${formatNumber(work.favorites)}</span>
            ${work.paid ? `<span class="badge paid">유료</span>` : `<span class="badge">무료</span>`}
            ${work.interactive ? `<span class="badge">갈래글</span>` : ""}
          </div>
        </div>
        <span class="score">BEST</span>
      </article>`,
    )
    .join("");
}

function applyTab(tab) {
  activeTab = tab === "free" ? "free" : "paid";
  history.replaceState(null, "", `./phase2_best_rankings.html?tab=${activeTab}`);
  render();
}

function bindEvents() {
  $$("[data-best-tab]").forEach((button) => {
    button.addEventListener("click", () => applyTab(button.dataset.bestTab));
  });

  document.body.addEventListener("click", (event) => {
    const button = event.target.closest("[data-empty-action]");
    if (!button) return;
    showToast(`${button.dataset.emptyAction} 기능은 알파테스트 준비 중입니다.`);
  });
}

function render() {
  renderTabs();
  renderList();
}

function boot() {
  render();
  bindEvents();
}

boot();

const PHASE1_KEY = "supgeul_phase1_author_studio_v2";
const SESSION_KEY = "supgeul_phase2_alpha_session";
const FAVORITE_KEY = "supgeul_phase3_favorites";
const LAST_READ_KEY = "supgeul_phase3_last_read";

function daysAgo(days) {
  return new Date(Date.now() - days * 86400000).toISOString();
}

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
    cover: { mode: "color", color: "#47645e", showTitle: true },
    periodViews: { monthly: 12400, weekly: 4600, daily: 720, new: 4100 },
    firstEpisodePublishedAt: daysAgo(3),
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
    cover: { mode: "color", color: "#6f8f5d", showTitle: true },
    periodViews: { monthly: 58000, weekly: 8200, daily: 930, new: 0 },
    firstEpisodePublishedAt: daysAgo(18),
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
    cover: { mode: "color", color: "#2f513f", showTitle: true },
    periodViews: { monthly: 49200, weekly: 11200, daily: 2600, new: 9300 },
    firstEpisodePublishedAt: daysAgo(5),
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
    cover: { mode: "color", color: "#1f4d38", showTitle: true },
    periodViews: { monthly: 93400, weekly: 18200, daily: 4100, new: 17600 },
    firstEpisodePublishedAt: daysAgo(2),
  },
];

const PERIODS = ["monthly", "weekly", "daily", "new"];
const periodLabels = {
  monthly: "월간",
  weekly: "주간",
  daily: "일일",
  new: "신작",
};

let activePayType = new URLSearchParams(location.search).get("tab") === "free" ? "free" : "paid";
let activePeriod = PERIODS.includes(new URLSearchParams(location.search).get("period")) ? new URLSearchParams(location.search).get("period") : "monthly";
let visibleCount = 10;
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

function readSession() {
  return readJson(SESSION_KEY, { user: null, gold: 0 });
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
        cover: work.cover || { mode: "color", color: "#47645e", showTitle: true },
        periodViews: work.periodViews || null,
        firstEpisodePublishedAt: work.firstEpisodePublishedAt || work.startedAt || work.createdAt || daysAgo(30),
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

function fallbackPeriodViews(work) {
  const total = Number(work.views || 0);
  return {
    monthly: Math.max(0, Math.round(total * 0.52)),
    weekly: Math.max(0, Math.round(total * 0.18)),
    daily: Math.max(0, Math.round(total * 0.035)),
    new: Math.max(0, Math.round(total * 0.2)),
  };
}

function isNewWork(work) {
  const date = new Date(work.firstEpisodePublishedAt || work.createdAt || 0);
  if (Number.isNaN(date.getTime())) return false;
  return Date.now() - date.getTime() <= 7 * 86400000;
}

function rankingValue(work) {
  const views = work.periodViews || fallbackPeriodViews(work);
  return Number(views[activePeriod] || 0);
}

function rankedWorks() {
  return currentWorks()
    .filter((work) => (activePayType === "paid" ? work.paid : !work.paid))
    .filter((work) => (activePeriod === "new" ? isNewWork(work) : true))
    .sort((a, b) => rankingValue(b) + b.favorites * 2 - (rankingValue(a) + a.favorites * 2));
}

function coverStyle(work) {
  const cover = work.cover || {};
  if (cover.mode === "image" && cover.imageData) {
    return `background:#ffffff; background-image:url('${esc(cover.imageData)}')`;
  }
  return `background:${esc(cover.color || "#47645e")}`;
}

function renderTabs() {
  $$("[data-best-period]").forEach((button) => button.classList.toggle("active", button.dataset.bestPeriod === activePeriod));
  $("#paidBestShortcut")?.classList.toggle("active", activePayType === "paid");
  $("#freeBestShortcut")?.classList.toggle("active", activePayType === "free");
  document.body.dataset.shellPage = activePayType === "paid" ? "paidBest" : "freeBest";
  const payLabel = activePayType === "paid" ? "유료" : "무료";
  const title = `${payLabel} ${periodLabels[activePeriod]} 베스트`;
  $("#bestTitle").textContent = title;
  $("#bestDescription").textContent =
    activePeriod === "new"
      ? "첫 화 연재 시작일로부터 7일 이내인 작품 중 조회 반응이 높은 작품입니다."
      : `${periodLabels[activePeriod]} 조회 반응이 높은 작품입니다.`;
  document.title = `${title} - 숲글:숲갈래글 (알파테스트:0.0.6)`;
}

function renderList() {
  const works = rankedWorks();
  const visibleWorks = works.slice(0, visibleCount);
  $("#rankingList").innerHTML = visibleWorks.length
    ? visibleWorks
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
            <span>${periodLabels[activePeriod]} ${formatNumber(rankingValue(work))}</span>
          </div>
        </div>
        <span class="score">TOP ${index + 1}</span>
      </article>`,
    )
    .join("")
    : `<p class="empty-ranking">조건에 맞는 작품이 없습니다.</p>`;

  const moreButton = $("#loadMoreRankings");
  moreButton.classList.toggle("hidden", works.length <= visibleCount);
  moreButton.textContent = `더보기 ${Math.max(0, Math.min(10, works.length - visibleCount))}개`;
}

function renderTopCovers() {
  const topWorks = rankedWorks().slice(0, 3);
  $("#bestTopTitle").textContent = `${activePayType === "paid" ? "유료" : "무료"} ${periodLabels[activePeriod]} TOP 3`;
  $("#bestCoverGrid").innerHTML = topWorks
    .map(
      (work, index) => `<a class="best-cover-card" href="${workHref(work)}">
        <span class="best-cover-rank">${index + 1}</span>
        <span class="best-cover" style="${coverStyle(work)}">${work.cover?.showTitle === false ? "" : esc(work.title)}</span>
        <strong>${esc(work.title)}</strong>
        <span>${esc(work.author)} · ${periodLabels[activePeriod]} ${formatNumber(rankingValue(work))}</span>
      </a>`,
    )
    .join("") || `<p class="empty-ranking">조건에 맞는 TOP 3 작품이 없습니다.</p>`;
}

function renderRails() {
  const recentRoot = $("#recentList");
  const favoriteRoot = $("#favoriteUpdateList");
  if (!recentRoot || !favoriteRoot) return;
  const session = readSession();
  if (!session.user) {
    recentRoot.innerHTML = "";
    favoriteRoot.innerHTML = "";
    return;
  }

  const works = currentWorks();
  const lastRead = readJson(LAST_READ_KEY, null);
  const favoriteIds = readJson(FAVORITE_KEY, []);
  const recent = lastRead?.workId ? works.filter((work) => work.id === lastRead.workId).slice(0, 1) : [];
  const favoriteUpdates = works
    .filter((work) => favoriteIds.includes(work.id))
    .sort((a, b) => Number(Boolean(b.updated)) - Number(Boolean(a.updated)))
    .slice(0, 3);

  recentRoot.innerHTML = recent
    .map((work) => `<a class="rail-item" href="${workHref(work)}"><strong>${esc(work.title)}</strong><span>이어보기 · ${esc(work.latest)}</span></a>`)
    .join("");
  favoriteRoot.innerHTML = favoriteUpdates
    .map((work) => `<a class="rail-item" href="${workHref(work)}"><strong>${esc(work.title)}</strong><span>${esc(work.author)} · ${esc(work.latest)}</span></a>`)
    .join("");
}

function applyPeriod(period) {
  activePeriod = PERIODS.includes(period) ? period : "monthly";
  visibleCount = 10;
  history.replaceState(null, "", `./phase2_best_rankings.html?tab=${activePayType}&period=${activePeriod}`);
  render();
}

function bindEvents() {
  $$("[data-best-period]").forEach((button) => {
    button.addEventListener("click", () => applyPeriod(button.dataset.bestPeriod));
  });

  $("#loadMoreRankings").addEventListener("click", () => {
    visibleCount += 10;
    renderList();
  });

  document.body.addEventListener("click", (event) => {
    const button = event.target.closest("[data-empty-action]");
    if (!button) return;
    showToast(`${button.dataset.emptyAction} 기능은 알파테스트 준비 중입니다.`);
  });
}

function render() {
  renderTabs();
  renderTopCovers();
  renderList();
  renderRails();
}

function boot() {
  render();
  bindEvents();
}

boot();

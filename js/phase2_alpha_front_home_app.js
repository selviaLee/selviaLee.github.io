const SESSION_KEY = "supgeul_phase2_alpha_session";
const PHASE1_KEY = "supgeul_phase1_author_studio_v2";
const FAVORITE_KEY = "supgeul_phase3_favorites";
const LAST_READ_KEY = "supgeul_phase3_last_read";

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
    adult: false,
    updated: true,
    coverColor: "#284a36",
    recommendCopy: "첫 선택부터 갈림길이 열리는 숲속 갈래글",
    releaseSettings: { method: "regular", days: ["월", "수", "금"], hour: "18", minute: "00" },
  },
  {
    id: "sample_other",
    title: "눈사람 밑의 문장들",
    author: "숲고지기",
    genre1: "판타지",
    genre2: "일반글",
    latest: "12화",
    views: 58000,
    favorites: 160,
    paid: false,
    interactive: false,
    adult: false,
    updated: false,
    coverColor: "#587965",
    recommendCopy: "차분한 문장으로 밤에 읽기 좋은 연재",
    releaseSettings: { method: "irregular", days: [], hour: "18", minute: "00" },
  },
  {
    id: "sample_night_weight",
    title: "오늘 밤 한 글자의 무게",
    author: "연녹",
    genre1: "현대",
    genre2: "일반글",
    latest: "38화",
    views: 49200,
    favorites: 1880,
    paid: true,
    interactive: false,
    adult: false,
    updated: true,
    coverColor: "#334f58",
    recommendCopy: "짧은 회차마다 감정의 무게가 남는 일반글",
    releaseSettings: { method: "irregular", days: [], hour: "18", minute: "00" },
  },
  {
    id: "sample_black_bookshop",
    title: "검은 책방의 주인",
    author: "문장연자",
    genre1: "미스터리",
    genre2: "갈래글",
    latest: "12화",
    views: 8900,
    favorites: 315,
    paid: false,
    interactive: true,
    adult: false,
    updated: false,
    coverColor: "#2c3934",
    recommendCopy: "책장을 넘길 때마다 단서가 바뀌는 미스터리",
    releaseSettings: { method: "regular", days: ["화", "목"], hour: "20", minute: "30" },
  },
  {
    id: "sample_moon_archive",
    title: "달빛 저장소의 사서들",
    author: "이월",
    genre1: "서정",
    genre2: "일반글",
    latest: "완결",
    views: 71200,
    favorites: 3210,
    paid: true,
    interactive: false,
    adult: false,
    updated: false,
    coverColor: "#52616d",
    recommendCopy: "완결까지 바로 달릴 수 있는 서정 판타지",
    releaseSettings: { method: "irregular", days: [], hour: "18", minute: "00" },
  },
  {
    id: "sample_dice_choice",
    title: "주사위는 선택지를 믿지 않는다",
    author: "서바",
    genre1: "성장",
    genre2: "갈래글",
    latest: "64화",
    views: 93400,
    favorites: 6400,
    paid: true,
    interactive: true,
    adult: true,
    updated: true,
    coverColor: "#2f5d46",
    recommendCopy: "선택지를 믿지 않는 독자를 위한 성장 갈래글",
    releaseSettings: { method: "regular", days: ["월", "화", "수"], hour: "22", minute: "00" },
  },
];

let activeFilter = "all";
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

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function readSession() {
  return readJson(SESSION_KEY, { user: null, gold: 0 });
}

function formatNumber(value) {
  const number = Number(value || 0);
  if (number >= 10000) return `${(number / 10000).toFixed(number >= 100000 ? 0 : 1)}만`;
  return number.toLocaleString("ko-KR");
}

function releaseLabel(settings = {}) {
  if (settings.method !== "regular") return "비정기연재";
  const days = Array.isArray(settings.days) && settings.days.length ? settings.days.join("") : "요일미정";
  const hour = String(settings.hour ?? "18").padStart(2, "0");
  const minute = String(settings.minute ?? "00").padStart(2, "0");
  return `${days} ${hour}:${minute}`;
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 1800);
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
        adult: work.isAdult === "adult",
        updated: true,
        coverImage: work.coverImage || work.cover?.imageData || "",
        coverColor: work.coverColor || work.cover?.color || "#47645e",
        recommendCopy: work.recommendCopy || work.adCopy || `${work.title || "작품"}을 지금 추천합니다.`,
        releaseSettings: work.releaseSettings || { method: "irregular", days: [], hour: "18", minute: "00" },
      }))
    : [];
  return [...phase1Works, ...fallbackWorks];
}

function filteredWorks() {
  return currentWorks().filter((work) => {
    if (activeFilter === "free") return !work.paid;
    if (activeFilter === "paid") return work.paid;
    if (activeFilter === "interactive") return work.interactive;
    if (activeFilter === "general") return !work.interactive;
    if (activeFilter === "updated") return work.updated;
    return true;
  });
}

function workHref(work) {
  return work.id ? `./phase3_work_home.html?workId=${encodeURIComponent(work.id)}` : "./phase3_work_home.html";
}

function goAuth() {
  location.href = "./phase2_auth_entry.html?next=phase2_alpha_front_home.html";
}

function goCharge() {
  if (!readSession().user) {
    goAuth();
    return;
  }
  location.href = "./phase7_gold_shop_charge.html";
}

function renderAccount() {
  const session = readSession();
  const loggedIn = Boolean(session.user);
  $("#profileEntry")?.classList.toggle("logged-in", loggedIn);
  $("#profileEntry").textContent = loggedIn ? "" : "로그인";
  $("#profileEntry")?.setAttribute("aria-label", loggedIn ? "마이 메뉴" : "로그인 또는 회원가입");
  $("#profileMenu")?.classList.toggle("hidden", true);
  $("#createWorkButton")?.classList.toggle("hidden", !loggedIn);
  $("#walletCard")?.classList.toggle("is-ghost", !loggedIn);
  $("#walletUserName").textContent = session.user?.name || "테스트계정";
  $("#goldBalance").textContent = `${Number(session.gold || 0).toLocaleString("ko-KR")}숲결`;
  $("#walletChargeButton").textContent = "충전";
}

function coverStyle(work) {
  if (work.coverImage) return `background-image: url('${esc(work.coverImage)}')`;
  const color = work.coverColor || "#47645e";
  return `background: linear-gradient(145deg, rgba(255, 255, 255, 0.16), transparent 44%), linear-gradient(145deg, ${esc(color)}, #9db98b)`;
}

function recommendedWorks() {
  return currentWorks()
    .filter((work) => work.recommended !== false)
    .sort((a, b) => Number(Boolean(b.updated)) - Number(Boolean(a.updated)) || b.views - a.views)
    .slice(0, 10);
}

function renderRecommendations() {
  $("#recommendList").innerHTML = recommendedWorks()
    .map(
      (work) => `<a class="recommend-card" href="${workHref(work)}">
        <span class="recommend-cover" style="${coverStyle(work)}">
          <span class="recommend-copy">${esc(work.recommendCopy || "지금 읽기 좋은 숲속의 한 편")}</span>
          <strong>${esc(work.title)}</strong>
        </span>
        <b>${esc(work.title)}</b>
        <em>${esc(work.author)} · ${esc(work.latest)} · ${formatNumber(work.views)}</em>
      </a>`,
    )
    .join("");
}

function renderWorks() {
  const labels = {
    all: "전체 목록",
    free: "무료 작품",
    paid: "유료 작품",
    interactive: "갈래글",
    general: "일반글",
    updated: "최근 갱신",
  };
  $("#filterLabel").textContent = labels[activeFilter];
  $("#workList").innerHTML = filteredWorks()
    .sort((a, b) => b.views - a.views)
    .map(
      (work, index) => `<article class="work-row">
        <strong class="rank-no">${index + 1}</strong>
        <div>
          <div class="work-title-line">
            <a class="work-title" href="${workHref(work)}">${esc(work.title)}</a>
            <span class="title-badge ${work.interactive ? "branch" : "normal"}">${work.interactive ? "갈래글" : "일반글"}</span>
            <span class="title-badge ${work.paid ? "paid" : "free"}">${work.paid ? "유료" : "무료"}</span>
          </div>
          <div class="work-info">
            <span>${esc(work.author)}</span>
            <span>${esc(work.genre1)}</span>
            <span>${esc(work.genre2)}</span>
            <span>${esc(work.latest)}</span>
            <span>${releaseLabel(work.releaseSettings)}</span>
          </div>
          <div class="work-stats">
            <span>조회 ${formatNumber(work.views)}</span>
            <span>선호 ${formatNumber(work.favorites)}</span>
          </div>
        </div>
      </article>`,
    )
    .join("");
}

function renderRails() {
  const session = readSession();
  const recentRoot = $("#recentList");
  const favoriteRoot = $("#favoriteUpdateList");
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
    .map((work) => `<a class="rail-item" href="${workHref(work)}"><strong>${esc(work.title)}</strong><span>${esc(work.author)} · ${releaseLabel(work.releaseSettings)}</span></a>`)
    .join("");
}

function applyFilter(filter) {
  activeFilter = filter;
  $$("[data-filter]").forEach((item) => item.classList.toggle("active", item.dataset.filter === activeFilter));
  $$(".menu-tab-item").forEach((item) => item.classList.toggle("active", item.dataset.filter === activeFilter));
  renderWorks();
}

function bindEvents() {
  $("#profileEntry")?.addEventListener("click", () => {
    if (!readSession().user) {
      goAuth();
      return;
    }
    $("#profileMenu")?.classList.toggle("hidden");
  });

  $("#mobileMyMenu")?.addEventListener("click", () => {
    if (!readSession().user) {
      goAuth();
      return;
    }
    location.href = "./phase6_myhome_home.html";
  });

  $("#logoutUser")?.addEventListener("click", () => {
    writeJson(SESSION_KEY, { user: null, gold: readSession().gold || 0 });
    renderAccount();
    renderRails();
    showToast("로그아웃했습니다.");
  });

  $("#chargeGold")?.addEventListener("click", () => {
    goCharge();
  });

  $("#walletChargeButton")?.addEventListener("click", () => {
    goCharge();
  });

  $$("[data-filter]").forEach((button) => {
    button.addEventListener("click", () => applyFilter(button.dataset.filter));
  });

  document.body.addEventListener("click", (event) => {
    if (!event.target.closest("#profileEntry") && !event.target.closest("#profileMenu")) {
      $("#profileMenu")?.classList.add("hidden");
    }
    const button = event.target.closest("[data-empty-action]");
    if (!button) return;
    showToast(`${button.dataset.emptyAction} 기능은 알파테스트 준비 중입니다.`);
  });
}

function boot() {
  renderAccount();
  renderRecommendations();
  renderWorks();
  renderRails();
  bindEvents();
}

boot();

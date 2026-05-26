const SESSION_KEY = "supgeul_phase2_alpha_session";
const PHASE1_KEY = "supgeul_phase1_author_studio_v2";

const fallbackWorks = [
  {
    title: "비밀 숲의 선택자",
    author: "숲고지기",
    genre1: "여성향",
    genre2: "창작 웹소설",
    latest: "1화",
    status: "연재중",
    views: 1240,
    favorites: 84,
    paid: false,
    interactive: true,
    adult: false,
    updated: true,
  },
  {
    title: "오늘 밤 황궁의 문장이 바뀐다",
    author: "연녹",
    genre1: "여성향",
    genre2: "창작 웹소설",
    latest: "38화",
    status: "연재중",
    views: 49200,
    favorites: 1880,
    paid: true,
    interactive: false,
    adult: false,
    updated: true,
  },
  {
    title: "검은 열쇠의 주인",
    author: "문장상자",
    genre1: "그 외",
    genre2: "창작 웹소설",
    latest: "12화",
    status: "연재중",
    views: 8900,
    favorites: 315,
    paid: false,
    interactive: true,
    adult: false,
    updated: false,
  },
  {
    title: "폐허 도서관의 사서들",
    author: "담쟁이",
    genre1: "여성향",
    genre2: "문학",
    latest: "완결",
    status: "완결",
    views: 71200,
    favorites: 3210,
    paid: true,
    interactive: false,
    adult: false,
    updated: false,
  },
  {
    title: "회귀자는 선택지를 믿지 않는다",
    author: "한밤",
    genre1: "남성향",
    genre2: "창작 웹소설",
    latest: "64화",
    status: "연재중",
    views: 93400,
    favorites: 6400,
    paid: true,
    interactive: true,
    adult: true,
    updated: true,
  },
  {
    title: "달의 하역장",
    author: "서리문",
    genre1: "그 외",
    genre2: "창작 웹소설",
    latest: "7화",
    status: "연재중",
    views: 2130,
    favorites: 98,
    paid: false,
    interactive: false,
    adult: false,
    updated: true,
  },
];

const reactions = [
  "테스트계정 · 비밀 숲의 선택자 1화에서 낡은열쇠를 얻었습니다.",
  "독자14 · 회귀자는 선택지를 믿지 않는다 새 분기 진입.",
  "초록연필 · 폐허 도서관의 사서들 완결 정주행 시작.",
  "문장수집가 · 오늘 밤 황궁의 문장이 바뀐다 38화 댓글 등록.",
];

let activeFilter = "all";
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
  if (value >= 10000) return `${(value / 10000).toFixed(value >= 100000 ? 0 : 1)}만`;
  return value.toLocaleString("ko-KR");
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 1800);
}

function currentWorks() {
  let state = null;
  try {
    state = JSON.parse(localStorage.getItem(PHASE1_KEY));
  } catch {
    state = null;
  }
  const phase1Works = Array.isArray(state?.works)
    ? state.works.map((work) => ({
        title: work.title,
        author: work.temporaryAuthorNickname || state?.users?.[0]?.officialNickname || "작가",
        genre1: work.genre1 || "그 외",
        genre2: work.genre2 || "창작 웹소설",
        latest: `${Math.max(0, (work.episodeOrder || []).length - 1)}화`,
        status: work.status === "completed" ? "완결" : "연재중",
        views: work.views || 0,
        favorites: work.favorites || 0,
        paid: Boolean(work.isPaidWork),
        interactive: work.type === "interactive",
        adult: work.isAdult === "adult",
        updated: true,
      }))
    : [];
  return [...phase1Works, ...fallbackWorks];
}

function filteredWorks() {
  return currentWorks().filter((work) => {
    if (activeFilter === "free") return !work.paid;
    if (activeFilter === "paid") return work.paid;
    if (activeFilter === "interactive") return work.interactive;
    if (activeFilter === "updated") return work.updated;
    return true;
  });
}

function renderAccount() {
  const session = readSession();
  const loggedIn = Boolean(session.user);
  $("#loggedOutPanel").classList.toggle("hidden", loggedIn);
  $("#loggedInPanel").classList.toggle("hidden", !loggedIn);
  $("#myPagePanel").classList.toggle("hidden", !loggedIn || $("#myPagePanel").dataset.open !== "true");
  $("#userName").textContent = session.user?.name || "테스트계정";
  $("#goldBalance").textContent = `${Number(session.gold || 0).toLocaleString("ko-KR")}골드`;
}

function renderPaidBest() {
  const paidBest = currentWorks()
    .filter((work) => work.paid)
    .sort((a, b) => b.views - a.views)
    .slice(0, 3);
  $("#paidBestGrid").innerHTML = paidBest
    .map(
      (work, index) => `<button class="rank-card" type="button" data-empty-action="${work.title}">
        <span class="mini-cover">${index + 1}</span>
        <span>
          <strong>${work.title}</strong>
          <span class="meta">${work.author} · ${work.latest} · ${formatNumber(work.views)}</span>
        </span>
      </button>`,
    )
    .join("");
}

function renderWorks() {
  const labels = {
    all: "전체 목록",
    free: "무료 작품",
    paid: "유료 작품",
    interactive: "인터랙티브 작품",
    updated: "최신 업데이트",
  };
  $("#filterLabel").textContent = labels[activeFilter];
  $("#workList").innerHTML = filteredWorks()
    .sort((a, b) => b.views - a.views)
    .map(
      (work, index) => `<article class="work-row">
        <strong class="rank-no">${index + 1}</strong>
        <div>
          <button class="work-title" type="button" data-empty-action="${work.title}">${work.title}</button>
          <div class="work-info">
            <span>${work.author}</span>
            <span>${work.genre1}</span>
            <span>${work.genre2}</span>
            <span>${work.latest}</span>
            <span>${work.status}</span>
          </div>
          <div class="work-stats">
            <span>조회 ${formatNumber(work.views)}</span>
            <span>선호 ${formatNumber(work.favorites)}</span>
            ${work.paid ? `<span class="badge paid">유료</span>` : `<span class="badge">무료</span>`}
            ${work.interactive ? `<span class="badge">인터랙티브</span>` : ""}
            ${work.adult ? `<span class="badge adult">19금</span>` : ""}
          </div>
        </div>
        <button class="row-action" type="button" data-empty-action="${work.title} 읽기">읽기</button>
      </article>`,
    )
    .join("");
}

function renderReactions() {
  $("#reactionList").innerHTML = reactions.map((reaction) => `<li>${reaction}</li>`).join("");
}

function bindEvents() {
  $$("[data-login]").forEach((button) => {
    button.addEventListener("click", () => {
      writeSession({ user: { name: "테스트계정", provider: button.dataset.login }, gold: readSession().gold || 0 });
      renderAccount();
      showToast("테스트계정으로 로그인했습니다.");
    });
  });

  $("#logoutUser").addEventListener("click", () => {
    writeSession({ user: null, gold: readSession().gold || 0 });
    $("#myPagePanel").dataset.open = "false";
    renderAccount();
    showToast("로그아웃했습니다.");
  });

  $("#myPageButton").addEventListener("click", () => {
    const session = readSession();
    if (!session.user) {
      showToast("내 페이지는 로그인 후 사용할 수 있습니다.");
      return;
    }
    const panel = $("#myPagePanel");
    panel.dataset.open = "true";
    renderAccount();
    panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
  });

  $("#chargeGold").addEventListener("click", () => {
    const session = readSession();
    if (!session.user) {
      showToast("먼저 테스트계정으로 로그인해주세요.");
      return;
    }
    session.gold = Number(session.gold || 0) + 5000;
    writeSession(session);
    renderAccount();
    showToast("5000골드가 충전되었습니다.");
  });

  $$(".quick-tabs button").forEach((button) => {
    button.addEventListener("click", () => {
      activeFilter = button.dataset.filter;
      $$(".quick-tabs button").forEach((item) => item.classList.toggle("active", item === button));
      renderWorks();
    });
  });

  document.body.addEventListener("click", (event) => {
    const button = event.target.closest("[data-empty-action]");
    if (!button) return;
    showToast(`${button.dataset.emptyAction} 기능은 알파 테스트 준비중입니다.`);
  });
}

function boot() {
  renderAccount();
  renderPaidBest();
  renderWorks();
  renderReactions();
  bindEvents();
}

boot();

const SESSION_KEY = "supgeul_phase2_alpha_session";
const PHASE1_KEY = "supgeul_phase1_author_studio_v2";
const FAVORITE_KEY = "supgeul_phase3_favorites";
const LAST_READ_KEY = "supgeul_phase3_last_read";
const MYHOME_KEY = "supgeul_phase6_myhome_state";
const PURCHASED_WORK_KEYS = ["supgeul_phase6_purchased_works", "supgeul_phase7_purchased_works", "supgeul_phase3_purchased_works"];

const alphaWorks = [
  {
    id: "sample_modern_dev",
    title: "이세계에서 최고 개발자였던 내가 현대에서는 무능력자?",
    author: "민봉개발자",
    type: "normal",
    genre1: "여성향",
    genre2: "창작 웹소설",
    status: "serializing",
    latestLabel: "3화",
    views: 0,
    favorites: 0,
    releaseSettings: { method: "irregular", days: [], hour: "18", minute: "00" },
    cover: { mode: "color", color: "#47645e", showTitle: true },
  },
  {
    id: "sample_test_work",
    title: "테스트 작품",
    author: "테스트",
    type: "interactive",
    genre1: "여성향",
    genre2: "창작 웹소설",
    status: "serializing",
    latestLabel: "0화",
    views: 0,
    favorites: 0,
    releaseSettings: { method: "regular", days: ["수"], hour: "12", minute: "00" },
    cover: { mode: "color", color: "#2f6f50", showTitle: true },
  },
];

const defaultMyhomeState = {
  categories: [
    { id: "cat_night", name: "밤에 읽기", tags: ["#밤", "#조용한"], workIds: [], recommendation: "neutral" },
    { id: "cat_choice", name: "선택지 작품", tags: ["#갈래글", "#선택지"], workIds: [], recommendation: "neutral" },
  ],
  endings: [
    {
      id: "ending_green_door",
      workId: "sample_test_work",
      workTitle: "테스트 작품",
      title: "초록 문을 연 결말",
      reachedAt: "2026-05-28T00:00:00.000Z",
      routeSummary: "첫 선택지에서 문을 열고 숲 안쪽으로 들어갔습니다.",
      choiceName: "초록 문을 연다",
      items: ["숲의 열쇠", "낡은 지도"],
      collected: true,
    },
    {
      id: "ending_river_lamp",
      workId: "sample_test_work",
      workTitle: "테스트 작품",
      title: "강가의 등불",
      reachedAt: "2026-05-29T00:00:00.000Z",
      routeSummary: "등불을 따라 강가로 내려가 잃어버린 이름을 되찾았습니다.",
      choiceName: "등불을 따라간다",
      items: ["젖은 성냥", "작은 등불"],
      collected: true,
    },
    {
      id: "ending_library_return",
      workId: "sample_modern_dev",
      workTitle: "이세계에서 최고 개발자였던 내가 현대에서는 무능력자?",
      title: "도서관으로 돌아간 개발자",
      reachedAt: "2026-05-30T00:00:00.000Z",
      routeSummary: "기록 보관소의 마지막 문서를 열어 원래 세계의 호출을 확인했습니다.",
      choiceName: "마지막 문서를 펼친다",
      items: ["깨진 배지", "기록 보관소 열쇠"],
      collected: true,
    },
    {
      id: "ending_locked_1",
      workId: "sample_test_work",
      workTitle: "테스트 작품",
      title: "잠긴 엔딩",
      reachedAt: "",
      routeSummary: "",
      choiceName: "",
      items: [],
      collected: false,
    },
    {
      id: "ending_locked_2",
      workId: "sample_test_work",
      workTitle: "테스트 작품",
      title: "잠긴 엔딩",
      reachedAt: "",
      routeSummary: "",
      choiceName: "",
      items: [],
      collected: false,
    },
    {
      id: "ending_locked_3",
      workId: "sample_test_work",
      workTitle: "테스트 작품",
      title: "잠긴 엔딩",
      reachedAt: "",
      routeSummary: "",
      choiceName: "",
      items: [],
      collected: false,
    },
    {
      id: "ending_locked_4",
      workId: "sample_modern_dev",
      workTitle: "이세계에서 최고 개발자였던 내가 현대에서는 무능력자?",
      title: "잠긴 엔딩",
      reachedAt: "",
      routeSummary: "",
      choiceName: "",
      items: [],
      collected: false,
    },
    {
      id: "ending_locked_5",
      workId: "sample_modern_dev",
      workTitle: "이세계에서 최고 개발자였던 내가 현대에서는 무능력자?",
      title: "잠긴 엔딩",
      reachedAt: "",
      routeSummary: "",
      choiceName: "",
      items: [],
      collected: false,
    },
    {
      id: "ending_locked_6",
      workId: "sample_modern_dev",
      workTitle: "이세계에서 최고 개발자였던 내가 현대에서는 무능력자?",
      title: "잠긴 엔딩",
      reachedAt: "",
      routeSummary: "",
      choiceName: "",
      items: [],
      collected: false,
    },
    {
      id: "ending_locked_7",
      workId: "sample_test_work",
      workTitle: "테스트 작품",
      title: "잠긴 엔딩",
      reachedAt: "",
      routeSummary: "",
      choiceName: "",
      items: [],
      collected: false,
    },
    {
      id: "ending_locked_8",
      workId: "sample_modern_dev",
      workTitle: "이세계에서 최고 개발자였던 내가 현대에서는 무능력자?",
      title: "잠긴 엔딩",
      reachedAt: "",
      routeSummary: "",
      choiceName: "",
      items: [],
      collected: false,
    },
    {
      id: "ending_locked_9",
      workId: "sample_test_work",
      workTitle: "테스트 작품",
      title: "잠긴 엔딩",
      reachedAt: "",
      routeSummary: "",
      choiceName: "",
      items: [],
      collected: false,
    },
  ],
};

let activeView = viewFromHash(location.hash);
let activeReadingFilter = "all";
let activeEndingId = "";
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

function writeSession(session) {
  writeJson(SESSION_KEY, session);
}

function clonePlain(value) {
  return JSON.parse(JSON.stringify(value));
}

function readMyhomeState() {
  const saved = readJson(MYHOME_KEY, null);
  const state = saved && typeof saved === "object" ? saved : clonePlain(defaultMyhomeState);
  state.categories = Array.isArray(state.categories) ? state.categories : [];
  state.endings = Array.isArray(state.endings) ? state.endings : [];
  if (!state.categories.length) state.categories = clonePlain(defaultMyhomeState.categories);
  if (!state.endings.length) state.endings = clonePlain(defaultMyhomeState.endings);
  const defaultEndings = new Map(defaultMyhomeState.endings.map((ending) => [ending.id, ending]));
  state.endings = state.endings.map((ending) => ({ ...clonePlain(defaultEndings.get(ending.id) || {}), ...ending }));
  defaultMyhomeState.endings.forEach((ending) => {
    if (!state.endings.some((item) => item.id === ending.id)) state.endings.push(clonePlain(ending));
  });
  state.categories.forEach((category) => {
    category.id ||= `cat_${Date.now().toString(36)}`;
    category.name ||= "새 카테고리";
    category.tags = Array.isArray(category.tags) ? category.tags : [];
    category.workIds = Array.isArray(category.workIds) ? category.workIds : [];
    category.recommendation ||= "neutral";
  });
  state.endings.forEach((ending) => {
    ending.id ||= `ending_${Date.now().toString(36)}`;
    ending.workId ||= "";
    ending.workTitle ||= workById(ending.workId)?.title || "작품";
    ending.title ||= "잠긴 엔딩";
    ending.choiceName ||= "";
    ending.items = Array.isArray(ending.items) ? ending.items : [];
    ending.collected = Boolean(ending.collected);
  });
  return state;
}

function saveMyhomeState(state) {
  writeJson(MYHOME_KEY, state);
}

function phase1State() {
  const saved = readJson(PHASE1_KEY, null);
  if (!saved || !Array.isArray(saved.works)) return { users: [], works: [], episodes: [] };
  saved.users = Array.isArray(saved.users) ? saved.users : [];
  saved.episodes = Array.isArray(saved.episodes) ? saved.episodes : [];
  return saved;
}

function officialNickname(data) {
  return data.users?.[0]?.officialNickname || "테스트";
}

function publishedEpisodes(data, workId) {
  return (data.episodes || [])
    .filter((episode) => episode.workId === workId && episode.status === "published")
    .sort((a, b) => Number(a.episodeNo || 0) - Number(b.episodeNo || 0));
}

function normalizeWork(work, data) {
  const episodes = publishedEpisodes(data, work.id);
  const latest = episodes[episodes.length - 1];
  return {
    id: work.id,
    title: work.title || "제목 없는 작품",
    author: work.temporaryAuthorNickname || officialNickname(data),
    type: work.type || "normal",
    genre1: work.genre1 || "기타",
    genre2: work.genre2 || (work.type === "interactive" ? "갈래글" : "일반글"),
    status: work.status || "serializing",
    latestLabel: latest ? `${Number(latest.episodeNo || 0)}화` : "공개 화 없음",
    latestEpisodeId: latest?.id || "",
    views: Number(work.views || 0),
    favorites: Number(work.favorites || 0),
    releaseSettings: work.releaseSettings || { method: "irregular", days: [], hour: "18", minute: "00" },
    cover: work.cover || { mode: "color", color: "#47645e", showTitle: true },
  };
}

function allWorks() {
  const data = phase1State();
  const map = new Map();
  data.works.map((work) => normalizeWork(work, data)).forEach((work) => map.set(work.id, work));
  alphaWorks.forEach((work) => {
    if (!map.has(work.id)) map.set(work.id, work);
  });
  return [...map.values()];
}

function workById(workId) {
  return allWorks().find((work) => work.id === workId) || null;
}

function idsFromStoredValue(value) {
  if (Array.isArray(value)) {
    return value.map((item) => (typeof item === "string" ? item : item?.workId || item?.id)).filter(Boolean);
  }
  if (value && typeof value === "object") {
    return Object.entries(value)
      .filter(([, enabled]) => Boolean(enabled))
      .map(([id]) => id);
  }
  return [];
}

function favoriteIds() {
  const stored = readJson(FAVORITE_KEY, null);
  const ids = new Set(idsFromStoredValue(stored));
  if (!stored || !ids.size) {
    // 알파테스트에서는 선호작 저장 흐름이 없어도 마이홈 화면을 바로 확인할 수 있게 기본 표본을 보여준다.
    alphaWorks.forEach((work) => ids.add(work.id));
  }
  return ids;
}

function favoriteWorks() {
  const ids = favoriteIds();
  return allWorks().filter((work) => ids.has(work.id));
}

function purchasedWorkIds() {
  const ids = new Set();
  PURCHASED_WORK_KEYS.forEach((key) => idsFromStoredValue(readJson(key, [])).forEach((id) => ids.add(id)));
  favoriteWorks().forEach((work) => ids.add(work.id));
  return ids;
}

function purchasedWorks() {
  const ids = purchasedWorkIds();
  return allWorks().filter((work) => ids.has(work.id));
}

function formatDate(value) {
  if (!value) return "미수집";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "미수집";
  return date.toISOString().slice(0, 10).replaceAll("-", ".");
}

function releaseLabel(settings = {}) {
  if (settings.method !== "regular") return "비정기연재";
  const days = Array.isArray(settings.days) && settings.days.length ? settings.days.join("") : "요일미정";
  const hour = String(settings.hour ?? "18").padStart(2, "0");
  const minute = String(settings.minute ?? "00").padStart(2, "0");
  return `${days} ${hour}:${minute}`;
}

function statusLabel(status) {
  if (status === "completed") return "완결";
  if (status === "hiatus") return "휴재";
  return "연재중";
}

function workHomeHref(workId) {
  return `./phase3_work_home.html?workId=${encodeURIComponent(workId)}`;
}

function coverInlineStyle(cover = {}) {
  if (cover.mode === "image" && cover.imageData) return `background:#ffffff; background-image:url('${esc(cover.imageData)}')`;
  return `background:${esc(cover.color || "#47645e")}`;
}

function endingCoverStyle(ending) {
  const work = workById(ending.workId);
  return coverInlineStyle(work?.cover || { mode: "color", color: ending.collected ? "#47645e" : "#8b948e" });
}

function showToast(message) {
  const toast = $("#toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 1600);
}

function viewFromHash(hash) {
  const value = String(hash || "").replace("#", "");
  if (value === "reading" || value === "categories" || value === "endings") return value;
  return "home";
}

function hashForView(view) {
  return view === "home" ? "#myhome" : `#${view}`;
}

function setView(view, pushHistory = true) {
  activeView = view || "home";
  $$("[data-myhome-view]").forEach((section) => {
    section.hidden = section.dataset.myhomeView !== activeView;
  });
  $$("[data-myhome-route]").forEach((link) => {
    link.classList.toggle("active", link.dataset.myhomeRoute === activeView);
  });
  if (pushHistory && location.hash !== hashForView(activeView)) {
    history.pushState(null, "", hashForView(activeView));
  }
  renderActiveView();
}

function currentCategoryForWork(workId) {
  return readMyhomeState().categories.find((category) => category.workIds.includes(workId)) || null;
}

function filteredFavoriteWorks() {
  const works = favoriteWorks();
  if (activeReadingFilter === "all") return works;
  if (activeReadingFilter === "uncategorized") return works.filter((work) => !currentCategoryForWork(work.id));
  const category = readMyhomeState().categories.find((item) => item.id === activeReadingFilter);
  if (!category) return works;
  return works.filter((work) => category.workIds.includes(work.id));
}

function renderReadingFilters() {
  const state = readMyhomeState();
  const validIds = new Set(["all", "uncategorized", ...state.categories.map((category) => category.id)]);
  if (!validIds.has(activeReadingFilter)) activeReadingFilter = "all";
  const chips = [
    { id: "all", label: "전체" },
    ...state.categories.map((category) => ({ id: category.id, label: category.name })),
    { id: "uncategorized", label: "무분류" },
  ];
  $("#readingFilters").innerHTML = chips
    .map(
      (chip) => `<button class="filter-chip ${chip.id === activeReadingFilter ? "active" : ""}" type="button" data-reading-filter="${esc(chip.id)}">${esc(chip.label)}</button>`,
    )
    .join("");
}

function categorySelect(work) {
  const state = readMyhomeState();
  const current = currentCategoryForWork(work.id)?.id || "";
  const options = [`<option value="">무분류</option>`]
    .concat(state.categories.map((category) => `<option value="${esc(category.id)}" ${category.id === current ? "selected" : ""}>${esc(category.name)}</option>`))
    .join("");
  return `<select class="work-category-select" data-work-category="${esc(work.id)}" aria-label="${esc(work.title)} 개인 카테고리">${options}</select>`;
}

function readingWorkCard(work) {
  const isBranch = work.type === "interactive";
  return `<article class="reading-work-card">
    <div class="reading-work-main">
      <a class="reading-work-title" href="${workHomeHref(work.id)}">${esc(work.title)}</a>
      <div class="work-meta">
        <span>${esc(work.author)}</span>
        <span>${esc(work.genre1)}</span>
        <span>${esc(work.genre2)}</span>
        <span>${esc(work.latestLabel)}</span>
      </div>
      <div class="work-record">
        <span class="work-badge">${statusLabel(work.status)}</span>
        <span class="work-badge">${esc(releaseLabel(work.releaseSettings))}</span>
        <span class="work-badge">선호작</span>
        ${isBranch ? `<span class="work-badge">갈래글 · 선택 기록</span>` : ""}
        <span>조회 ${Number(work.views || 0).toLocaleString("ko-KR")}</span>
      </div>
    </div>
    <div class="work-actions">
      <a class="work-action-link" href="${workHomeHref(work.id)}">작품 홈</a>
      <button class="work-action-button" type="button" data-continue-work="${esc(work.id)}">이어보기</button>
      ${categorySelect(work)}
    </div>
  </article>`;
}

function renderReading() {
  const works = filteredFavoriteWorks();
  $("#favoriteCount").textContent = `${works.length}개`;
  renderReadingFilters();
  $("#favoriteWorkList").innerHTML = works.length
    ? works.map((work) => readingWorkCard(work)).join("")
    : `<div class="empty-state">현재 조건에 맞는 읽는 작품이 없습니다.</div>`;
}

function parseTags(value) {
  return String(value || "")
    .split(/[\s,]+/)
    .map((tag) => tag.trim())
    .filter(Boolean)
    .map((tag) => (tag.startsWith("#") ? tag : `#${tag}`));
}

function recommendationText(value) {
  if (value === "more") return "더 추천받기";
  if (value === "less") return "덜 추천받기";
  return "기본";
}

function categoryWorkPills(category) {
  const works = category.workIds.map((id) => workById(id)).filter(Boolean);
  if (!works.length) return `<p class="empty-inline">아직 넣은 작품이 없습니다.</p>`;
  return works
    .map(
      (work) => `<span class="category-work-pill">${esc(work.title)}<button class="remove-work-button" type="button" data-remove-work="${esc(work.id)}" data-category-id="${esc(category.id)}" aria-label="${esc(work.title)} 제거">×</button></span>`,
    )
    .join("");
}

function addWorkSelect(category) {
  const works = purchasedWorks().filter((work) => !category.workIds.includes(work.id));
  if (!works.length) return `<p class="empty-inline">추가할 수 있는 구매/선호 작품이 없습니다.</p>`;
  return `<div class="add-work-row">
    <select data-add-work-select="${esc(category.id)}" aria-label="${esc(category.name)}에 작품 추가">
      ${works.map((work) => `<option value="${esc(work.id)}">${esc(work.title)}</option>`).join("")}
    </select>
    <button class="add-work-button" type="button" data-add-work="${esc(category.id)}">넣기</button>
  </div>`;
}

function renderCategories() {
  const state = readMyhomeState();
  $("#categoryList").innerHTML = state.categories
    .map(
      (category) => `<article class="category-card">
        <div class="category-card-head">
          <div>
            <h3>${esc(category.name)}</h3>
            <div class="tag-row">${category.tags.length ? category.tags.map((tag) => `<span class="tag-chip">${esc(tag)}</span>`).join("") : `<span class="tag-chip">#태그없음</span>`}</div>
          </div>
          <button class="category-action" type="button" data-delete-category="${esc(category.id)}">삭제</button>
        </div>
        <div class="preference-row" aria-label="${esc(category.name)} 추천 조절">
          <button class="category-action ${category.recommendation === "more" ? "active" : ""}" type="button" data-category-preference="${esc(category.id)}" data-preference="more">더 추천받기</button>
          <button class="category-action ${category.recommendation === "less" ? "active" : ""}" type="button" data-category-preference="${esc(category.id)}" data-preference="less">덜 추천받기</button>
          <button class="category-action ${category.recommendation === "neutral" ? "active" : ""}" type="button" data-category-preference="${esc(category.id)}" data-preference="neutral">${recommendationText("neutral")}</button>
        </div>
        <div class="category-work-list">${categoryWorkPills(category)}</div>
        ${addWorkSelect(category)}
      </article>`,
    )
    .join("");
}

function renderEndings() {
  const endings = readMyhomeState().endings;
  const collectedCount = endings.filter((ending) => ending.collected).length;
  if (activeEndingId && !endings.some((ending) => ending.id === activeEndingId && ending.collected)) activeEndingId = "";
  $("#endingCount").textContent = `${collectedCount}/${endings.length}개`;
  $("#endingList").innerHTML = endings
    .map(
      (ending) => `<button class="ending-card ${ending.collected ? "" : "is-locked"} ${activeEndingId === ending.id ? "active" : ""}" type="button" data-ending-id="${esc(ending.id)}">
        <span class="ending-cover" style="${endingCoverStyle(ending)}">
          <strong>${ending.collected ? esc(ending.title) : "잠긴 엔딩"}</strong>
        </span>
        <span class="ending-card-info">
          <b>${esc(ending.workTitle || workById(ending.workId)?.title || "작품")}</b>
          <em>${ending.collected ? `${formatDate(ending.reachedAt)} 도달` : "아직 도달하지 않았습니다."}</em>
        </span>
      </button>`,
    )
    .join("");
  renderEndingDetail(endings);
}

function renderEndingDetail(endings) {
  const detail = $("#endingDetail");
  const ending = endings.find((item) => item.id === activeEndingId && item.collected);
  if (!detail || !ending) {
    if (detail) {
      detail.hidden = true;
      detail.innerHTML = "";
    }
    return;
  }
  const items = ending.items.length ? ending.items : ["얻은 아이템 없음"];
  detail.hidden = false;
  detail.innerHTML = `<h3>엔딩까지의 여정</h3>
    <div class="ending-journey-choice">
      <span>선택지 이름</span>
      <strong>${esc(ending.choiceName || "기록된 선택지 없음")}</strong>
    </div>
    <p>${esc(ending.routeSummary || "기록된 여정이 없습니다.")}</p>
    <div class="ending-item-section">
      <span>얻은 아이템 목록</span>
      <div class="ending-item-list">${items.map((item) => `<b>${esc(item)}</b>`).join("")}</div>
    </div>`;
}

function renderUserSummary() {
  const session = readSession();
  $("#myhomeUserName").textContent = session.user?.name || "테스트계정";
}

function renderActiveView() {
  renderUserSummary();
  if (activeView === "reading") renderReading();
  if (activeView === "categories") renderCategories();
  if (activeView === "endings") renderEndings();
}

function ensureAlphaUser() {
  const session = readSession();
  if (session.user) return;
  writeSession({ user: { name: "테스트계정", provider: "alpha", joinedAt: new Date().toISOString() }, gold: Number(session.gold || 0) });
}

function renderGate() {
  ensureAlphaUser();
  $("#loginGate").hidden = true;
  $("#myhomeContent").hidden = false;
  setView(activeView, false);
}

function createCategory(form) {
  const formData = new FormData(form);
  const name = String(formData.get("categoryName") || "").trim();
  if (!name) {
    showToast("카테고리 이름을 입력해주세요.");
    return;
  }
  const state = readMyhomeState();
  state.categories.push({
    id: `cat_${Date.now().toString(36)}`,
    name,
    tags: parseTags(formData.get("categoryTags")),
    workIds: [],
    recommendation: "neutral",
  });
  saveMyhomeState(state);
  form.reset();
  renderCategories();
  renderReadingFilters();
  showToast("개인 카테고리를 만들었습니다.");
}

function updateWorkCategory(workId, categoryId) {
  const state = readMyhomeState();
  state.categories.forEach((category) => {
    category.workIds = category.workIds.filter((id) => id !== workId);
  });
  const nextCategory = state.categories.find((category) => category.id === categoryId);
  if (nextCategory) nextCategory.workIds.push(workId);
  saveMyhomeState(state);
  renderReading();
}

function continueWork(workId) {
  const data = phase1State();
  const work = workById(workId);
  const episodes = publishedEpisodes(data, workId);
  const latest = episodes[episodes.length - 1];
  writeJson(LAST_READ_KEY, { workId, episodeId: latest?.id || "", updatedAt: new Date().toISOString() });
  showToast(`${work?.title || "작품"} 이어보기 위치를 저장했습니다.`);
}

function bindEvents() {
  document.addEventListener("click", (event) => {
    const route = event.target.closest("[data-myhome-route]");
    if (route) {
      event.preventDefault();
      setView(route.dataset.myhomeRoute, true);
      return;
    }

    const filter = event.target.closest("[data-reading-filter]");
    if (filter) {
      activeReadingFilter = filter.dataset.readingFilter;
      renderReading();
      return;
    }

    const continueButton = event.target.closest("[data-continue-work]");
    if (continueButton) {
      continueWork(continueButton.dataset.continueWork);
      return;
    }

    const endingButton = event.target.closest("[data-ending-id]");
    if (endingButton) {
      const ending = readMyhomeState().endings.find((item) => item.id === endingButton.dataset.endingId);
      if (!ending?.collected) {
        showToast("아직 도달하지 않은 엔딩입니다.");
        return;
      }
      activeEndingId = ending.id;
      renderEndings();
      $("#endingDetail")?.scrollIntoView({ block: "nearest" });
      return;
    }

    const preferenceButton = event.target.closest("[data-category-preference]");
    if (preferenceButton) {
      const state = readMyhomeState();
      const category = state.categories.find((item) => item.id === preferenceButton.dataset.categoryPreference);
      if (category) category.recommendation = preferenceButton.dataset.preference;
      saveMyhomeState(state);
      renderCategories();
      return;
    }

    const deleteButton = event.target.closest("[data-delete-category]");
    if (deleteButton) {
      const state = readMyhomeState();
      state.categories = state.categories.filter((category) => category.id !== deleteButton.dataset.deleteCategory);
      if (activeReadingFilter === deleteButton.dataset.deleteCategory) activeReadingFilter = "all";
      saveMyhomeState(state);
      renderCategories();
      renderReadingFilters();
      return;
    }

    const addButton = event.target.closest("[data-add-work]");
    if (addButton) {
      const state = readMyhomeState();
      const category = state.categories.find((item) => item.id === addButton.dataset.addWork);
      const select = $$("[data-add-work-select]").find((item) => item.dataset.addWorkSelect === addButton.dataset.addWork);
      const workId = select?.value;
      if (category && workId && !category.workIds.includes(workId)) category.workIds.push(workId);
      saveMyhomeState(state);
      renderCategories();
      return;
    }

    const removeButton = event.target.closest("[data-remove-work]");
    if (removeButton) {
      const state = readMyhomeState();
      const category = state.categories.find((item) => item.id === removeButton.dataset.categoryId);
      if (category) category.workIds = category.workIds.filter((id) => id !== removeButton.dataset.removeWork);
      saveMyhomeState(state);
      renderCategories();
      if (activeView === "reading") renderReading();
    }
  });

  document.addEventListener("change", (event) => {
    const select = event.target.closest("[data-work-category]");
    if (!select) return;
    updateWorkCategory(select.dataset.workCategory, select.value);
  });

  $("#categoryForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    createCategory(event.currentTarget);
  });

  $("#testLoginButton")?.addEventListener("click", () => {
    const session = readSession();
    writeSession({ user: { name: "테스트계정", provider: "alpha", joinedAt: new Date().toISOString() }, gold: Number(session.gold || 0) });
    location.reload();
  });

  window.addEventListener("popstate", () => setView(viewFromHash(location.hash), false));
  window.addEventListener("hashchange", () => setView(viewFromHash(location.hash), false));
  window.addEventListener("supgeul:shell-session-change", () => renderGate());
}

function boot() {
  bindEvents();
  renderGate();
}

boot();

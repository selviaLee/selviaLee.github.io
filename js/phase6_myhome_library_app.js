const SESSION_KEY = "supgeul_phase2_alpha_session";
const PHASE1_KEY = "supgeul_phase1_author_studio_v2";
const FAVORITE_KEY = "supgeul_phase3_favorites";
const LAST_READ_KEY = "supgeul_phase3_last_read";
const MYHOME_KEY = "supgeul_phase6_myhome_state";

const fallbackWorks = [
  {
    id: "sample_work",
    title: "비밀 숲의 선택자",
    type: "interactive",
    temporaryAuthorNickname: "숲고지기",
    genre1: "여성향",
    genre2: "창작 웹소설",
    status: "serializing",
    views: 12000,
    favorites: 209,
    releaseSettings: { method: "regular", days: ["월", "수", "금"], hour: "18", minute: "00" },
  },
  {
    id: "sample_other",
    title: "잎사귀 밑의 문장들",
    type: "normal",
    temporaryAuthorNickname: "",
    genre1: "여성향",
    genre2: "창작 웹소설",
    status: "completed",
    views: 58000,
    favorites: 160,
    releaseSettings: { method: "irregular", days: [], hour: "18", minute: "00" },
  },
];

const fallbackEpisodes = [
  { id: "sample_ep_0", workId: "sample_work", episodeNo: 1, title: "프롤로그", status: "published" },
  { id: "sample_ep_1", workId: "sample_work", episodeNo: 2, title: "첫 번째 문장", status: "published" },
];

let activeCategory = "all";
let toastTimer = null;

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

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

function session() {
  return readJson(SESSION_KEY, { user: null, gold: 0 });
}

function phase1State() {
  const saved = readJson(PHASE1_KEY, null);
  if (!saved || !Array.isArray(saved.works)) {
    return { users: [{ officialNickname: "나무나비" }], works: fallbackWorks, episodes: fallbackEpisodes };
  }
  saved.users ||= [{ officialNickname: "작가" }];
  saved.episodes ||= [];
  return saved;
}

function myhomeState() {
  const saved = readJson(MYHOME_KEY, null);
  if (saved?.categories && saved?.assignments) return saved;
  return {
    categories: [
      { id: "cat_night", name: "밤에 읽기" },
      { id: "cat_choice", name: "선택지 작품" },
    ],
    assignments: { sample_work: "cat_choice" },
    endings: [
      { workId: "sample_work", title: "초록 문을 연 사람", reached: true, reachedAt: "2026.05.27" },
      { workId: "sample_work", title: "잠긴 숲의 끝", reached: false, reachedAt: "" },
    ],
  };
}

function saveMyhomeState(nextState) {
  writeJson(MYHOME_KEY, nextState);
}

function authorName(data, work) {
  return work.temporaryAuthorNickname || data.users?.[0]?.officialNickname || "작가";
}

function formatNumber(value) {
  const number = Number(value || 0);
  if (number >= 10000) return `${(number / 10000).toFixed(number >= 100000 ? 0 : 1)}만`;
  return number.toLocaleString("ko-KR");
}

function statusText(status) {
  if (status === "completed") return "완결";
  if (status === "draft") return "습작";
  return "연재중";
}

function releaseText(work) {
  const release = work.releaseSettings || {};
  if (release.method !== "regular") return "비정기연재";
  const days = Array.isArray(release.days) && release.days.length ? release.days.join("") : "요일미정";
  const hour = String(release.hour ?? "18").padStart(2, "0");
  const minute = String(release.minute ?? "00").padStart(2, "0");
  return `${days} ${hour}:${minute}`;
}

function publicEpisodes(data, workId) {
  return data.episodes
    .filter((episode) => episode.workId === workId && episode.status === "published")
    .sort((a, b) => Number(a.episodeNo || 0) - Number(b.episodeNo || 0));
}

function latestEpisodeLabel(data, work) {
  const episodes = publicEpisodes(data, work.id);
  const latest = episodes.at(-1);
  if (!latest) return "공개 화 없음";
  return `${latest.episodeNo || episodes.length}화 ${latest.title || ""}`.trim();
}

function readingWorks() {
  const data = phase1State();
  const favorites = readJson(FAVORITE_KEY, []);
  const lastRead = readJson(LAST_READ_KEY, null);
  const favoriteSet = new Set(favorites);
  const works = data.works.filter((work, index) => favoriteSet.has(work.id) || lastRead?.workId === work.id || index < 4);
  return works.map((work) => ({ ...work, favorite: favoriteSet.has(work.id), data }));
}

function visibleWorks() {
  const state = myhomeState();
  return readingWorks().filter((work) => {
    if (activeCategory === "all") return true;
    if (activeCategory === "uncategorized") return !state.assignments[work.id];
    return state.assignments[work.id] === activeCategory;
  });
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 1800);
}

function ensureLogin() {
  const loggedIn = Boolean(session().user);
  $("#loginGate").classList.toggle("hidden", loggedIn);
  $("#myhomeShell").classList.toggle("hidden", !loggedIn);
  if (loggedIn) $("#myhomeUserName").textContent = session().user.name || "테스트계정";
  return loggedIn;
}

function renderCategoryFilters() {
  const state = myhomeState();
  const filters = [
    { id: "all", name: "전체" },
    ...state.categories,
    { id: "uncategorized", name: "무분류" },
  ];
  $("#categoryFilters").innerHTML = filters
    .map((category) => `<button type="button" class="${activeCategory === category.id ? "active" : ""}" data-filter-category="${category.id}">${category.name}</button>`)
    .join("");
}

function renderCategoryList() {
  const state = myhomeState();
  $("#categoryList").innerHTML = state.categories.length
    ? state.categories.map((category) => `<button type="button" class="category-pill ${activeCategory === category.id ? "active" : ""}" data-filter-category="${category.id}">${category.name}</button>`).join("")
    : `<p class="empty">아직 만든 카테고리가 없습니다.</p>`;
}

function categorySelect(workId) {
  const state = myhomeState();
  return `<select data-category-work="${workId}" aria-label="개인 카테고리 선택">
    <option value="">무분류</option>
    ${state.categories.map((category) => `<option value="${category.id}" ${state.assignments[workId] === category.id ? "selected" : ""}>${category.name}</option>`).join("")}
  </select>`;
}

function renderReadingWorks() {
  const works = visibleWorks();
  $("#readingCount").textContent = `${works.length}개`;
  $("#readingWorks").innerHTML = works.length
    ? works.map((work) => {
      const data = work.data;
      const isInteractive = work.type === "interactive";
      return `<article class="work-row">
        <div>
          <h3>${work.title}</h3>
          <div class="work-meta">
            <span>${authorName(data, work)}</span>
            <span>${work.genre1 || "그 외"}</span>
            <span>${work.genre2 || "창작 웹소설"}</span>
            <span>${latestEpisodeLabel(data, work)}</span>
          </div>
          <div class="work-flags">
            <span class="flag">${statusText(work.status)}</span>
            <span class="flag">${releaseText(work)}</span>
            ${work.favorite ? `<span class="flag">선호작</span>` : ""}
            ${isInteractive ? `<span class="flag">갈래글 · 선택 기록</span>` : ""}
            <span>조회 ${formatNumber(work.views)}</span>
          </div>
        </div>
        <div class="row-actions">
          <a href="./phase3_work_home.html?workId=${encodeURIComponent(work.id)}">작품 홈</a>
          <button type="button" data-continue-work="${work.id}">이어보기</button>
          ${categorySelect(work.id)}
        </div>
      </article>`;
    }).join("")
    : `<p class="empty">이 카테고리에 담긴 작품이 없습니다.</p>`;
}

function renderEndings() {
  const state = myhomeState();
  const data = phase1State();
  const endings = state.endings || [];
  $("#endingList").innerHTML = endings.length
    ? endings.map((ending) => {
      const work = data.works.find((item) => item.id === ending.workId);
      return `<article class="ending-card ${ending.reached ? "" : "locked"}">
        <strong>${ending.reached ? ending.title : "잠긴 엔딩"}</strong>
        <p>${work?.title || "작품"} · ${ending.reached ? `${ending.reachedAt} 도달` : "아직 도달하지 않았습니다."}</p>
      </article>`;
    }).join("")
    : `<p class="empty">아직 수집한 엔딩이 없습니다.</p>`;
}

function renderAll() {
  if (!ensureLogin()) return;
  renderCategoryFilters();
  renderCategoryList();
  renderReadingWorks();
  renderEndings();
}

function bindEvents() {
  $("#testLogin").addEventListener("click", () => {
    const current = session();
    writeJson(SESSION_KEY, { ...current, user: { name: "테스트계정", provider: "myhome" } });
    renderAll();
    showToast("테스트계정으로 로그인했습니다.");
  });

  $("#categoryForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const input = event.currentTarget.elements.categoryName;
    const name = input.value.trim();
    if (!name) return showToast("카테고리 이름을 입력해주세요.");
    const state = myhomeState();
    state.categories.push({ id: `cat_${Date.now()}`, name });
    saveMyhomeState(state);
    input.value = "";
    renderAll();
    showToast("개인 카테고리를 추가했습니다.");
  });

  document.body.addEventListener("click", (event) => {
    const filter = event.target.closest("[data-filter-category]");
    if (filter) {
      activeCategory = filter.dataset.filterCategory;
      renderAll();
      return;
    }
    const continueButton = event.target.closest("[data-continue-work]");
    if (continueButton) {
      const data = phase1State();
      const workId = continueButton.dataset.continueWork;
      const episode = publicEpisodes(data, workId).at(-1);
      if (!episode) return showToast("아직 공개된 화가 없습니다.");
      writeJson(LAST_READ_KEY, { workId, episodeId: episode.id });
      showToast(`${episode.title || "최근 화"}로 이동합니다.`);
    }
  });

  document.body.addEventListener("change", (event) => {
    const select = event.target.closest("[data-category-work]");
    if (!select) return;
    const state = myhomeState();
    const workId = select.dataset.categoryWork;
    if (select.value) state.assignments[workId] = select.value;
    else delete state.assignments[workId];
    saveMyhomeState(state);
    renderAll();
    showToast("개인 카테고리를 변경했습니다.");
  });
}

bindEvents();
renderAll();

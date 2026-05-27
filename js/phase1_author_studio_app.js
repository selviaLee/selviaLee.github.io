import {
  CURRENT_USER_ID,
  currentUser,
  displayAuthor,
  exportState,
  loadState,
  noticeTemplate,
  resetState,
  saveState,
  timestamp,
  uid,
  upsert,
  workEpisodes,
  workWorld,
} from "./phase1_storage_repository.js";
import { navItems, pageLinks, readInitialRoute, linkForPage } from "./phase1_author_navigation.js";
import { shell, statusCounts, statusFilterBar } from "./phase1_author_common_ui.js";
import { bindChoiceCards, bindCoverControls, bindHelpDots, bindWorkFieldControls, bindWorldModeControls, preventEnterSubmit, syncCommittedTags } from "./phase1_author_form_controls.js";
import { $, $$, bindModal, esc, formatDate, formData, showModal, splitList, statusText, typeText } from "./phase1_ui_helpers.js";

const app = $("#app");
const genre1Options = ["여성향", "남성향", "마음대로"];
const genre2Options = ["창작 웹소설", "2차 창작", "문학", "자유"];
const weekdays = ["월", "화", "수", "목", "금", "토", "일"];
const coverSamples = [
  ["#47645e", "샘플배경1"],
  ["#8c5a43", "샘플배경2"],
  ["#315c8b", "샘플배경3"],
];
const APP_VERSION = "0.0.1";
let route = readInitialRoute(document.body.dataset.defaultPage || "dashboard");
let registerDraft = null;

function navigate(page, params = {}) {
  if (pageLinks[page] && page !== route.page) {
    window.location.href = linkForPage(page, params);
    return;
  }
  route = { page, ...params };
  const paramsForUrl = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") paramsForUrl.set(key, value);
  });
  const query = paramsForUrl.toString();
  window.history.replaceState(null, "", query ? `${window.location.pathname}?${query}` : window.location.pathname);
  render();
}

function refreshChrome() {
  const state = loadState();
  $("#workspaceTitle").textContent = state.authorProfile.workspaceTitle || "숲글 작가 작업실";
  $("#officialNickname").textContent = currentUser().officialNickname || "공식 닉네임 없음";
  let version = $("#appVersion");
  if (!version) {
    version = document.createElement("span");
    version.id = "appVersion";
    version.className = "app-version";
    $(".sidebar-foot")?.prepend(version);
  }
  version.textContent = `v${APP_VERSION}`;
  $("#sideNav").innerHTML = navItems
    .map(([page, label]) => `<a class="nav-item ${route.page === page ? "active" : ""}" href="${linkForPage(page)}" data-nav="${page}">${label}</a>`)
    .join("");
  $$("[data-nav]").forEach((button) =>
    button.addEventListener("click", (event) => {
      event.preventDefault();
      window.location.href = button.getAttribute("href");
    })
  );
}

function render() {
  refreshChrome();
  if (route.page === "dashboard") renderDashboard();
  if (route.page === "register") renderRegister();
  if (route.page === "intro") renderIntro();
  if (route.page === "worlds") renderWorlds();
  if (route.page === "items") renderItems();
  if (route.page === "characters") renderCharacters();
  if (route.page === "editor") renderEditor();
  if (route.page === "queue") renderQueue();
  if (route.page === "notices") renderNotices();
  if (route.page === "settings") renderSettings();
  if (route.page === "preview") renderPreview();
  bindHelpDots();
}

function workNoticeCount(workId) {
  return loadState().workNotices.filter((notice) => notice.workId === workId).length;
}

function queuedCount(workId) {
  return loadState().episodes.filter((ep) => ep.workId === workId && ["queued", "confirmed"].includes(ep.status)).length;
}

function canMonetize(work) {
  return !work.isPaidWork && !["2차 창작", "자유"].includes(work.genre2);
}

function renderDashboard() {
  const statusFilter = route.statusFilter || "serializing";
  const allWorks = loadState().works;
  const works = allWorks.filter((work) => work.status === statusFilter);
  const counts = statusCounts(allWorks);
  app.innerHTML =
    shell("작가 작업실", "내 작품 목록", `<button class="primary-btn" id="newWork">새 작품 등록</button>`) +
    statusFilterBar(statusFilter, counts, "status-filter") +
    `<div class="view">${works.length ? works.map(workCard).join("") : `<div class="empty">아직 등록한 작품이 없습니다.</div>`}</div>`;
  $("#newWork").addEventListener("click", () => {
    registerDraft = null;
    navigate("register", { step: 1 });
  });
  $$("[data-status-filter]").forEach((button) => button.addEventListener("click", () => navigate("dashboard", { statusFilter: button.dataset.statusFilter })));
  bindWorkActions();
}

function workCard(work) {
  const episodes = workEpisodes(work.id);
  const published = episodes.filter((ep) => ep.status === "published");
  const world = workWorld(work);
  const qCount = queuedCount(work.id);
  const nCount = workNoticeCount(work.id);
  const release = work.releaseSettings || {};
  const isRegular = release.method === "regular";
  const coverStyle = coverInlineStyle(work.cover);
  const nextWaiters = work.nextEpisodeWaiters ?? work.waitingReaders ?? 0;
  const episodeCountLabel = work.status === "draft" ? "비공개" : "공개";
  const episodeCountValue = work.status === "draft" ? 0 : published.length;
  return `<article class="work-card">
    <div class="work-content">
      <div class="work-info-row">
        <div class="work-cover-area">
          <div class="cover ${work.cover?.showTitle === false ? "no-title" : ""}" ${coverStyle}>${esc(work.title)}</div>
        </div>
        <div class="work-main">
          <div class="card-topline">
            <span>${esc(work.genre1)} &gt; <span class="topline-value">${esc(work.genre2)}</span></span>
            <span><span class="topline-label-muted">세계관</span> <span class="topline-value">${esc(world?.title || "연결 없음")}</span></span>
          </div>
          <div class="work-title-row">
            <button class="title-link" data-action="home" data-work-id="${work.id}">${esc(work.title)}</button>
            <span class="badge brand">${typeText(work.type)}</span>
            ${work.type === "interactive" ? `<span class="badge blue">아이템 존재</span>` : ""}
            ${work.isAdult === "adult" ? `<span class="badge danger">19금</span>` : ""}
            ${work.isPaidWork ? `<span class="badge warn">유료</span>` : ""}
          </div>
          <div class="work-stat-grid">
            ${statBlock("글", displayAuthor(work))}
            ${statBlock(episodeCountLabel, `${episodeCountValue}화`)}
            ${statBlock("연재", isRegular ? `${esc(release.hour)}:${esc(release.minute)}` : "비정기")}
            ${statBlock("조회수", work.views || 0)}
            ${statBlock("선호", work.favorites || 0)}
            ${statBlock("댓글/리뷰", work.comments || 0)}
          </div>
          ${isRegular ? weekdayChips(release.days) : ""}
        <div class="work-subline">
            <span><span class="subline-medium">다음화 대기</span> <span class="subline-strong">${esc(nextWaiters)}</span></span>
            <span>${formatRecentPublished(published.at(-1)?.updatedAt)}</span>
          </div>
          <div class="work-tag-summary">
            <button class="tag-summary-button" data-action="tags" data-tags-kind="작품 태그" data-tags="${esc((work.normalTags || []).join(", "))}"><span>작품 태그</span><strong>${work.normalTags?.length || 0}개</strong></button>
            <button class="tag-summary-button sensitive-summary" data-action="tags" data-tags-kind="민감 태그" data-tags="${esc((work.sensitiveTags || []).join(", "))}"><span>민감 태그</span><strong>${work.sensitiveTags?.length || 0}개</strong></button>
          </div>
        </div>
      </div>
      <div class="work-description-row">
        <p class="description">${esc(work.description || "작품 소개가 없습니다.")}</p>
        <button type="button" class="description-toggle" data-action="toggle-description">더보기</button>
      </div>
    </div>
      <div class="work-actions">
        <button class="secondary-btn" data-action="editor" data-work-id="${work.id}">새 화 작성</button>
        <button class="secondary-btn" data-action="queue" data-work-id="${work.id}">대기열관리(${qCount ? "있음" : "없음"})</button>
        <button class="secondary-btn" data-action="notices" data-work-id="${work.id}">공지관리(${nCount ? "있음" : "없음"})</button>
        <button class="secondary-btn" data-action="intro" data-work-id="${work.id}">작품소개관리</button>
        <button class="secondary-btn" data-action="world" data-work-id="${work.id}">세계관관리</button>
        <button class="secondary-btn" data-action="reviews" data-work-id="${work.id}">리뷰관리</button>
        ${canMonetize(work) ? `<button class="secondary-btn" data-action="monetize" data-work-id="${work.id}">유료화하기</button>` : ""}
      </div>
  </article>`;
}

function statBlock(label, value) {
  return `<span class="stat-block"><small>${label}</small><strong>${esc(value)}</strong></span>`;
}

function formatRecentPublished(value) {
  if (!value) return `<span class="subline-medium">최근 공개</span> <span class="subline-strong">없음</span>`;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return `<span class="subline-medium">최근 공개</span> <span class="subline-strong">${esc(value)}</span>`;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = date.getHours();
  const period = hours < 12 ? "오전" : "오후";
  const hour12 = String(hours % 12 || 12).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `<span class="subline-medium">최근 공개</span> ${year}. <span class="subline-strong">${month}. ${day}</span>. <span class="subline-medium">${period} ${hour12}:${minute}</span>`;
}

function weekdayChips(active = []) {
  return `<div class="weekday-row">${weekdays.map((day) => `<span class="weekday-chip ${active.includes(day) ? "active" : ""}">${day}</span>`).join("")}</div>`;
}

function tagRow(tags = []) {
  return tags.length ? `<div class="tag-row">${tags.map((tag) => `<span class="tag">${esc(tag)}</span>`).join("")}</div>` : "";
}

function bindWorkActions() {
  $$("[data-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const { action, workId } = button.dataset;
      if (action === "home") location.href = `./phase3_work_home.html?workId=${encodeURIComponent(workId)}`;
      if (action === "tags") showModal({ title: button.dataset.tagsKind, body: tagPopup(button.dataset.tags) });
      if (action === "toggle-description") toggleDescription(button);
      if (action === "intro") navigate("intro", { workId });
      if (action === "world") navigate("worlds", { workId });
      if (action === "editor") navigate("editor", { workId });
      if (action === "queue") navigate("queue", { workId });
      if (action === "notices") navigate("notices", { workId });
      if (action === "reviews") showModal({ body: "리뷰관리 기능입니다. 지금은 mock입니다." });
      if (action === "monetize") monetizeWork(workId);
    });
  });
}

function monetizeWork(workId) {
  const state = loadState();
  const work = state.works.find((item) => item.id === workId);
  if (!work) return;
  if (!canMonetize(work)) {
    showModal({ body: "이 작품은 유료화할 수 없거나 이미 유료화된 작품입니다." });
    return;
  }
  work.isPaidWork = true;
  work.updatedAt = timestamp();
  saveState(state);
  showModal({ title: "유료화 테스트", body: "테스트 기능으로 유료 뱃지를 적용했습니다. 대기열 관리에서도 유료 작품으로 표시됩니다." });
  renderDashboard();
}

function toggleDescription(button) {
  const box = button.closest(".work-description-row");
  box.classList.toggle("expanded");
  button.textContent = box.classList.contains("expanded") ? "접기" : "더보기";
}

function tagPopup(rawTags = "") {
  const tags = splitList(rawTags);
  return tags.length ? tagRow(tags) : `<p class="helper">등록된 태그가 없습니다.</p>`;
}

function ensureDraft() {
  if (registerDraft) return registerDraft;
  registerDraft = {
    type: "general",
    title: "",
    temporaryAuthorNickname: "",
    description: "",
    genre1: "여성향",
    genre2: "창작 웹소설",
    normalTags: "",
    sensitiveTags: "",
    isAdult: "all",
    status: "draft",
    method: "irregular",
    days: [],
    hour: "18",
    minute: "00",
    cover: { mode: "color", color: "#47645e", showTitle: true },
    worldMode: "new",
    worldId: "",
  };
  return registerDraft;
}

function renderRegister() {
  const step = Number(route.step || 1);
  const draft = ensureDraft();
  const titles = ["작품 유형", "세계관 연결 정보", "작품 기본 정보", "표지 설정", "등록 완료"];
  app.innerHTML =
    shell("새 작품 등록", titles[step - 1]) +
    `<div class="stepper">${titles.map((title, index) => `<span class="${index + 1 === step ? "active" : ""}">${index + 1}. ${title}</span>`).join("")}</div>
    <form class="form-card" id="registerForm">${registerStep(step, draft)}
      <div class="step-actions register-actions">
        <div class="register-action-left">${step > 1 ? `<button type="button" class="secondary-btn" id="prevStep">이전</button>` : ""}</div>
        <div class="register-action-center"><button type="button" class="secondary-btn" id="cancelRegister">취소</button></div>
        <div class="register-action-right">${step < 5 ? `<button class="primary-btn">다음</button>` : `<button class="primary-btn">작품 등록</button>`}</div>
      </div>
    </form>`;
  $("#prevStep")?.addEventListener("click", () => {
    collectDraft(step, $("#registerForm"));
    navigate("register", { step: step - 1 });
  });
  $("#cancelRegister").addEventListener("click", () => navigate("dashboard"));
  preventEnterSubmit($("#registerForm"));
  bindChoiceCards($("#registerForm"));
  bindWorkFieldControls($("#registerForm"));
  bindWorldModeControls($("#registerForm"));
  bindCoverControls($("#registerForm"));
  $("#registerForm").addEventListener("submit", (event) => {
    event.preventDefault();
    if (!collectDraft(step, event.currentTarget)) return;
    if (step < 5) return navigate("register", { step: step + 1 });
    createWorkFromDraft();
  });
}

function registerStep(step, draft) {
  if (step === 1) {
    return `<div class="choice-cards">
      ${[
        ["general", "일반글", "일반적인 소설 경험입니다. 단순 텍스트 기반 연재입니다."],
        ["interactive", "갈래글", "인터렉티브 소설 경험입니다. 선택지, 씬, 아이템 문법을 사용할 수 있습니다."],
      ].map(([value, title, text]) => `<label class="choice-card ${draft.type === value ? "active" : ""}"><input class="visually-hidden" type="radio" name="type" value="${value}" ${draft.type === value ? "checked" : ""}/><strong>${title}</strong><span>${text}</span></label>`).join("")}
    </div>`;
  }
  if (step === 2) {
    const worlds = loadState().worldbuildings;
    const hasWorlds = worlds.length > 0;
    const useExisting = draft.worldMode === "existing" && hasWorlds;
    return `<section class="form-section">
      <h2>세계관 연결 정보</h2>
      <p class="helper">세계관은 작품에 종속되지 않는 별도 자료입니다. 작품 유형을 고른 뒤 바로 세계관을 선택하고, 작품 카드는 세계관관리에서 다시 관리합니다.</p>
      <p class="helper">세계관 생성하기를 선택하면 등록 완료 시점에 이후 입력한 작품 제목과 소개를 기준으로 새 세계관이 생성됩니다. 등록 전에는 실제 세계관 데이터가 만들어지지 않습니다.</p>
      <div class="segmented">
        <label><input type="radio" name="worldMode" value="new" ${useExisting ? "" : "checked"}/> 세계관 생성하기</label>
        <label><input type="radio" name="worldMode" value="existing" ${useExisting ? "checked" : ""} ${hasWorlds ? "" : "disabled"}/> 기존 세계관 연결하기</label>
      </div>
      ${hasWorlds ? "" : `<p class="helper">등록된 세계관이 없어서 기존 세계관 연결하기를 선택할 수 없습니다.</p>`}
      <div class="form-row ${useExisting ? "" : "is-gone"}" data-existing-world-row ${useExisting ? "" : "hidden"}><label>기존 세계관</label><select name="worldId" ${useExisting ? "required" : "disabled"}>${worlds.map((world) => `<option value="${world.id}" ${draft.worldId === world.id ? "selected" : ""}>${esc(world.title)}</option>`).join("")}</select></div>
    </section>`;
  }
  if (step === 3) return workFields(draft, "register");
  if (step === 4) {
    return renderCoverSettings(draft, draft.title || "");
  }
  return `<section class="confirm-layout"><div>
    <h2>${esc(draft.title || "제목 없음")}</h2>
    <dl class="summary-list">
      <dt>유형</dt><dd>${typeText(draft.type)}</dd><dt>작가명</dt><dd>${esc(draft.temporaryAuthorNickname || currentUser().officialNickname)}</dd>
      <dt>장르</dt><dd>${esc(draft.genre1)} / ${esc(draft.genre2)}</dd><dt>연재 방식</dt><dd>${draft.method === "regular" ? `정기 연재 ${draft.days.join(", ")} ${draft.hour}:${draft.minute}` : "비정기 연재"}</dd>
    </dl></div>${coverPreview(draft, true)}</section>`;
}

function workFields(values, mode) {
  const official = currentUser().officialNickname;
  const useOfficial = !values.temporaryAuthorNickname;
  return `<section class="form-section">
    <h2>작품 기본 정보</h2>
    <div class="work-basic-grid">
      <div class="form-row"><label>작품 제목</label><input name="title" value="${esc(values.title)}" required placeholder="예: 숲의 문이 열리는 밤" /></div>
      ${radioGroup("status", "연재 상태", [["draft", "습작"], ["serializing", "연재"], ["completed", "완결"]], values.status, "status-field")}
      <div class="form-row"><label>작품별 임시닉네임</label><input data-temp-nickname name="temporaryAuthorNickname" value="${esc(values.temporaryAuthorNickname || "")}" placeholder="작품에서만 쓸 임시 표시명을 적어주세요." /></div>
      <div class="form-row official-choice"><label>공식쓰기 <button type="button" class="help-dot" data-help="공식쓰기를 체크하면 이 작품은 계정 닉네임을 표시명으로 사용합니다. 이때 임시닉네임 저장값은 비워두며, 계정 닉네임을 임시닉네임 칸에 복사하지 않습니다. 임시닉네임이 비어 있던 작품은 무료로 새 임시닉네임을 입력할 수 있습니다.">?</button></label><label class="choice inline"><input type="checkbox" name="useOfficialNickname" ${useOfficial ? "checked" : ""}/> 사용</label></div>
      <div class="form-row"><label>공식닉네임</label><input value="${esc(official)}" disabled /></div>
      <p class="helper nickname-guide">작품별 임시닉네임은 이 작품에만 적용되는 표시명입니다.</p>
      <div class="form-row"><label>장르1</label><select name="genre1">${genre1Options.map((x) => `<option ${values.genre1 === x ? "selected" : ""}>${x}</option>`)}</select></div>
      <div class="form-row"><label>장르2 <button type="button" class="help-dot" data-help="2차 창작과 자유는 유료화가 불가능합니다. AI를 소설 창작에 사용할 시 자유를 선택해주세요.">?</button></label><select name="genre2">${genre2Options.map((x) => `<option ${values.genre2 === x ? "selected" : ""}>${x}</option>`)}</select></div>
      ${radioGroup("isAdult", "19금 작품 여부", [["all", "전체"], ["adult", "19금"]], values.isAdult, "adult-field")}
      <div class="form-row span-all"><label>작품 소개</label><textarea name="description" placeholder="작품의 분위기, 주인공, 주요 갈등을 1~2문단으로 적어주세요.">${esc(values.description || "")}</textarea></div>
      <section class="form-section tag-section span-all">
        <h3>태그</h3>
        <div class="grid two">
          <div class="form-row"><label>작품 태그</label><input data-tag-input name="normalTags" value="${Array.isArray(values.normalTags) ? values.normalTags.join(", ") : esc(values.normalTags || "")}" placeholder="예: 판타지, 성장, 숲" /></div>
          <div class="form-row"><label>민감 태그</label><input data-tag-input name="sensitiveTags" value="${Array.isArray(values.sensitiveTags) ? values.sensitiveTags.join(", ") : esc(values.sensitiveTags || "")}" placeholder="필요한 경우에만 적어주세요." /></div>
        </div>
        <p class="helper">태그는 Enter를 누르면 등록됩니다. 전부 소문자로 입력한 태그는 대문자로 저장됩니다.</p>
      </section>
      ${radioGroup("method", "연재 방식", [["regular", "정기 연재"], ["irregular", "비정기 연재"]], values.method)}
      <section class="schedule-row span-all" data-schedule-row>
        <div class="form-row weekday-field"><label>요일선택</label><div class="weekday-edit">${weekdays.map((day) => `<label class="weekday-choice"><input type="checkbox" name="days" value="${day}" ${values.days?.includes(day) ? "checked" : ""}/>${day}</label>`).join("")}</div></div>
        <div class="form-row"><label>시</label><select name="hour">${Array.from({ length: 24 }, (_, i) => `${i + 1}`.padStart(2, "0")).map((x) => `<option ${values.hour === x ? "selected" : ""}>${x}</option>`)}</select></div>
        <div class="form-row"><label>분</label><select name="minute">${["00", "10", "20", "30", "40", "50"].map((x) => `<option ${values.minute === x ? "selected" : ""}>${x}</option>`)}</select></div>
      </section>
    </div>
  </section>`;
}

function radioGroup(name, title, options, value, extraClass = "") {
  return `<div class="form-row ${extraClass}"><label>${title}</label><div class="segmented">${options.map(([v, label]) => `<label><input type="radio" name="${name}" value="${v}" ${value === v ? "checked" : ""}/>${label}</label>`).join("")}</div></div>`;
}

function collectDraft(step, form) {
  syncCommittedTags(form);
  const data = formData(form);
  if (step === 1) registerDraft.type = data.type || registerDraft.type;
  if (step === 2) {
    if (data.worldMode === "existing" && !data.worldId) {
      showModal({ title: "안내", body: "기존 세계관 연결하기를 선택했다면 연결할 세계관을 반드시 선택해야 합니다." });
      return false;
    }
    Object.assign(registerDraft, { worldMode: data.worldMode || "new", worldId: data.worldMode === "existing" ? data.worldId : "" });
  }
  if (step === 3) Object.assign(registerDraft, data, { temporaryAuthorNickname: data.useOfficialNickname ? "" : data.temporaryAuthorNickname || "", days: data.method === "regular" ? $$('input[name="days"]:checked', form).map((input) => input.value) : [] });
  if (step === 4) {
    registerDraft.cover = coverFromData(data, registerDraft.cover);
  }
  return true;
}

function renderCoverSettings(values, title = "") {
  const currentColor = values.cover?.color || "#47645e";
  const imageData = values.cover?.imageData || "";
  const isUpload = values.cover?.mode === "image" || currentColor === "#ffffff";
  const isSample = coverSamples.some(([color]) => color === currentColor);
  const liveStyle = values.cover?.mode === "image" && imageData ? `background:#ffffff; background-image:url('${esc(imageData)}')` : `background:${esc(currentColor)}`;
  const uploadStyle = imageData ? `style="background:#ffffff; background-image:url('${esc(imageData)}')"` : "";
  return `<section class="form-section cover-settings">
    <h2>표지 설정</h2>
    <div class="cover-settings-layout">
      <div class="my-cover-panel">
        <h3>내 표지</h3>
        <div class="cover live-cover" data-cover-live-preview data-fallback-title="${esc(title)}" style="${liveStyle}">${values.cover?.showTitle === false ? "" : esc(title)}</div>
        <label class="choice inline cover-title-toggle"><input type="checkbox" name="showTitle" ${values.cover?.showTitle === false ? "" : "checked"}/> 제목 표시</label>
      </div>
      <div class="cover-choice-scroll">
        <div class="cover-option-panel upload-panel">
          <button type="button" class="primary-btn cover-top-button" data-cover-upload>이미지 업로드</button>
          <input class="visually-hidden" type="file" name="coverUploadFile" accept="image/*" />
          <input type="hidden" name="coverImageData" value="${esc(imageData)}" />
          <input type="hidden" name="coverImageName" value="${esc(values.cover?.imageName || "")}" />
          <label class="cover-card-choice"><div class="cover-option upload-mock" data-upload-cover-swatch ${uploadStyle}>${imageData ? "" : `<span class="plus-mark">+</span>`}</div>
          <input class="cover-radio" type="radio" name="coverChoice" value="upload" data-color="#ffffff" ${isUpload ? "checked" : ""} /></label>
        </div>
        <div class="cover-option-panel">
          <button type="button" class="primary-btn cover-top-button color-button" data-cover-color-button>색선택</button>
          <input class="visually-hidden" type="color" name="coverColor" value="${esc(isUpload || isSample ? "#47645e" : currentColor)}" />
          <label class="cover-card-choice"><div class="cover-option" data-custom-cover-swatch style="background:${esc(isUpload || isSample ? "#47645e" : currentColor)}"></div>
          <input class="cover-radio" type="radio" name="coverChoice" value="custom" data-color="${esc(isUpload || isSample ? "#47645e" : currentColor)}" ${!isUpload && !isSample ? "checked" : ""} /></label>
        </div>
        ${coverSamples.map(([color, label]) => `<label class="cover-option-panel">
          <strong>${label}</strong>
          <div class="cover-option" style="background:${color}"></div>
          <input class="cover-radio" type="radio" name="coverChoice" value="${color}" data-color="${color}" ${currentColor === color ? "checked" : ""} />
        </label>`).join("")}
      </div>
    </div>
  </section>`;
}

function coverColorFromChoice(data, fallback = "#47645e") {
  if (data.coverChoice === "custom") return data.coverColor || "#47645e";
  if (data.coverChoice === "upload") return "#ffffff";
  return data.coverChoice || fallback;
}

function coverFromData(data, previous = {}) {
  const showTitle = Boolean(data.showTitle);
  if (data.coverChoice === "upload" && data.coverImageData) {
    return { ...previous, mode: "image", color: "#ffffff", imageData: data.coverImageData, imageName: data.coverImageName || "", showTitle };
  }
  return { ...previous, mode: "color", color: coverColorFromChoice(data, previous.color), imageData: "", imageName: "", showTitle };
}

function coverInlineStyle(cover = {}) {
  if (cover.mode === "image" && cover.imageData) return `style="background:#ffffff; background-image:url('${esc(cover.imageData)}')"`;
  return `style="background:${esc(cover.color || "#47645e")}"`;
}

function coverPreview(values, small = false) {
  return `<div class="cover preview-cover ${small ? "small-cover" : ""} ${values.cover?.showTitle === false ? "no-title" : ""}" ${coverInlineStyle(values.cover)}>${esc(values.title || "표지 제목")}</div>`;
}

function createWorkFromDraft() {
  const state = loadState();
  const workId = uid("work");
  let worldId = registerDraft.worldId;
  if (registerDraft.worldMode !== "existing" || !worldId) {
    worldId = uid("world");
    state.worldbuildings.push({
      id: worldId,
      ownerUserId: CURRENT_USER_ID,
      title: registerDraft.title || "새 작품",
      description: registerDraft.description || "작품 등록 과정에서 생성한 세계관입니다.",
      sourceScope: "me",
      externalSourceName: "",
      externalSourceLink: "",
      workIds: [workId],
      itemIds: [],
      characterIds: [],
      createdAt: timestamp(),
      updatedAt: timestamp(),
    });
  }
  const episodeIds = [];
  if (registerDraft.type === "interactive") {
    const epId = uid("ep");
    episodeIds.push(epId);
    state.episodes.push({
      id: epId,
      workId,
      episodeNo: 0,
      requiredPreviousEpisodeNo: "",
      title: "프롤로그",
      body: "",
      authorNote: "",
      status: "draft",
      publishAt: "",
      isPaid: false,
      price: 0,
      createdAt: timestamp(),
      updatedAt: timestamp(),
    });
  }
  state.works.push({
    id: workId,
    title: registerDraft.title,
    type: registerDraft.type,
    userId: CURRENT_USER_ID,
    temporaryAuthorNickname: registerDraft.temporaryAuthorNickname || "",
    temporaryAuthorNicknameUpdatedAt: registerDraft.temporaryAuthorNickname ? timestamp() : "",
    description: registerDraft.description,
    genre1: registerDraft.genre1,
    genre2: registerDraft.genre2,
    normalTags: splitList(registerDraft.normalTags),
    sensitiveTags: splitList(registerDraft.sensitiveTags),
    isAdult: registerDraft.isAdult,
    adultEditable: true,
    status: registerDraft.status,
    isPaidWork: false,
    cover: registerDraft.cover,
    createdAt: timestamp(),
    updatedAt: timestamp(),
    episodeOrder: episodeIds,
    worldbuildingId: worldId,
    releaseSettings: { method: registerDraft.method, days: registerDraft.days || [], hour: registerDraft.hour, minute: registerDraft.minute, timezone: "Asia/Seoul" },
    views: 0,
    favorites: 0,
    comments: 0,
    queueMaxSlots: 1,
    queueSupportTickets: 2,
    queueShowEmptySlots: true,
  });
  const world = state.worldbuildings.find((item) => item.id === worldId);
  if (world && !world.workIds.includes(workId)) world.workIds.push(workId);
  saveState(state);
  registerDraft = null;
  navigate("dashboard");
}

function renderIntro() {
  const state = loadState();
  const work = state.works.find((item) => item.id === route.workId);
  if (!work) return navigate("dashboard");
  const values = {
    ...work,
    method: work.releaseSettings.method,
    days: work.releaseSettings.days,
    hour: work.releaseSettings.hour,
    minute: work.releaseSettings.minute,
  };
  app.innerHTML =
    shell("작품소개관리", esc(work.title)) +
    `<form class="form-card" id="introForm">${workFields(values, "intro")}
      ${renderCoverSettings(work, work.title || "")}
      <div class="step-actions intro-actions"><button class="primary-btn">작품소개저장</button><button type="button" class="secondary-btn" id="cancelIntro">취소</button><button type="button" class="secondary-btn" id="backWorks">작품목록으로 돌아가기</button><button type="button" class="danger-btn" id="deleteWork">작품삭제하기</button></div>
    </form>`;
  $("#cancelIntro").addEventListener("click", () => renderIntro());
  $("#backWorks").addEventListener("click", () => navigate("dashboard"));
  $("#deleteWork").addEventListener("click", () => confirmDeleteWork(work.id));
  preventEnterSubmit($("#introForm"));
  bindChoiceCards($("#introForm"));
  bindWorkFieldControls($("#introForm"));
  bindCoverControls($("#introForm"));
  $("#introForm").addEventListener("submit", (event) => {
    event.preventDefault();
    syncCommittedTags(event.currentTarget);
    const data = formData(event.currentTarget);
    Object.assign(work, {
      title: data.title,
      temporaryAuthorNickname: data.useOfficialNickname ? "" : data.temporaryAuthorNickname || "",
      temporaryAuthorNicknameUpdatedAt: !data.useOfficialNickname && data.temporaryAuthorNickname ? timestamp() : work.temporaryAuthorNicknameUpdatedAt,
      description: data.description,
      genre1: data.genre1,
      genre2: data.genre2,
      normalTags: splitList(data.normalTags),
      sensitiveTags: splitList(data.sensitiveTags),
      isAdult: data.isAdult,
      status: data.status,
      releaseSettings: { method: data.method, days: data.method === "regular" ? $$('input[name="days"]:checked', event.currentTarget).map((input) => input.value) : [], hour: data.hour, minute: data.minute, timezone: "Asia/Seoul" },
      cover: coverFromData(data, work.cover),
      updatedAt: timestamp(),
    });
    saveState(state);
    showModal({ body: `저장했습니다. 저장 시간: ${formatDate(work.updatedAt)}` });
    renderIntro();
  });
}

function confirmDeleteWork(workId) {
  const state = loadState();
  const work = state.works.find((item) => item.id === workId);
  if (!work) return navigate("dashboard");
  showModal({
    title: "작품삭제하기",
    body: "정말 삭제하시겠습니까?",
    actions: [
      { label: "삭제", kind: "danger", onClick: () => handleDeleteWorkDecision(workId) },
      { label: "취소", kind: "secondary" },
    ],
  });
}

function handleDeleteWorkDecision(workId) {
  const state = loadState();
  const work = state.works.find((item) => item.id === workId);
  if (!work) return navigate("dashboard");
  const waiters = Number(work.nextEpisodeWaiters ?? work.waitingReaders ?? 0);
  if (work.isPaidWork) {
    if (waiters > 0) {
      showModal({
        title: "유료작품은 습작만 가능합니다.",
        body: `다음화를 기다리는 독자가 ${waiters}명 있습니다. 환불하시겠습니까?`,
        actions: [
          { label: "예", kind: "primary", onClick: () => convertPaidWorkToDraft(workId, true) },
          { label: "아니오", kind: "secondary" },
        ],
      });
      return;
    }
    showModal({
      title: "유료작품은 습작만 가능합니다.",
      body: "다음화를 기다리는 독자가 없습니다. 작품을 습작으로 전환하시겠습니까?",
      actions: [
        { label: "습작", kind: "primary", onClick: () => convertPaidWorkToDraft(workId, false) },
        { label: "취소", kind: "secondary" },
      ],
    });
    return;
  }
  if (waiters > 0) {
    showModal({
      title: "작품삭제하기",
      body: `${waiters}명의 독자가 기다리고 있습니다. 그래도 지우시겠습니까?`,
      actions: [
        { label: "삭제", kind: "danger", onClick: () => deleteFreeWork(workId) },
        { label: "취소", kind: "secondary" },
      ],
    });
    return;
  }
  deleteFreeWork(workId);
}

function convertPaidWorkToDraft(workId, refundNextWaiters) {
  const state = loadState();
  const work = state.works.find((item) => item.id === workId);
  if (!work) return navigate("dashboard");
  work.status = "draft";
  if (refundNextWaiters) {
    work.nextEpisodeWaiters = 0;
    work.waitingReaders = 0;
  }
  work.updatedAt = timestamp();
  saveState(state);
  showModal({ body: refundNextWaiters ? "다음화에 걸린 금액을 환불 처리하고 작품을 습작으로 전환했습니다." : "작품을 습작으로 전환했습니다." });
  navigate("dashboard", { statusFilter: "draft" });
}

function deleteFreeWork(workId) {
  const state = loadState();
  state.works = state.works.filter((work) => work.id !== workId);
  state.episodes = state.episodes.filter((episode) => episode.workId !== workId);
  state.workNotices = state.workNotices.filter((notice) => notice.workId !== workId);
  state.worldbuildings.forEach((world) => {
    world.workIds = (world.workIds || []).filter((id) => id !== workId);
  });
  if (state.authorState?.selectedWorkId === workId) state.authorState.selectedWorkId = state.works[0]?.id || "";
  saveState(state);
  showModal({ body: "작품을 삭제했습니다." });
  navigate("dashboard");
}

function renderWorlds() {
  const state = loadState();
  const focusWork = state.works.find((work) => work.id === route.workId);
  const worlds = focusWork ? state.worldbuildings.filter((world) => world.id === focusWork.worldbuildingId) : state.worldbuildings;
  app.innerHTML =
    shell("세계관 관리", focusWork ? `${esc(focusWork.title)} 세계관` : "세계관 목록", `<button class="primary-btn" id="newWorld">새 세계관 등록</button>`) +
    `<div class="view">${worlds.map(worldCard).join("")}</div>`;
  $("#newWorld").addEventListener("click", () => renderWorldForm());
  $$("[data-world-edit]").forEach((button) => button.addEventListener("click", () => renderWorldForm(button.dataset.worldEdit)));
  $$("[data-items]").forEach((button) => button.addEventListener("click", () => navigate("items", { worldId: button.dataset.items })));
  $$("[data-characters]").forEach((button) => button.addEventListener("click", () => navigate("characters", { worldId: button.dataset.characters })));
}

function worldCard(world) {
  const works = loadState().works.filter((work) => world.workIds?.includes(work.id));
  const scopeText = { me: "나", external: "외부", myExternal: "나의 외부" }[world.sourceScope] || "나";
  return `<article class="world-card">
    <div class="world-card-head"><span class="badge">${scopeText}</span><h2>${esc(world.title)}</h2><small>${works.length}개 작품 연결</small></div>
    <p>${esc(world.description || "세계관 소개가 없습니다.")}</p>
    ${tagRow(works.map((work) => work.title))}
    <div class="world-actions"><button class="secondary-btn" data-world-edit="${world.id}">세계관 편집</button><button class="secondary-btn" data-items="${world.id}">아이템 관리</button><button class="secondary-btn" data-characters="${world.id}">등장인물 관리</button></div>
  </article>`;
}

function renderWorldForm(worldId = "") {
  const state = loadState();
  const world = state.worldbuildings.find((item) => item.id === worldId) || { id: uid("world"), title: "", description: "", sourceScope: "me", externalSourceName: "", externalAuthorName: "", externalSourceLink: "", workIds: [], itemIds: [], characterIds: [] };
  const connectedCount = state.works.filter((work) => world.workIds?.includes(work.id)).length;
  app.innerHTML =
    shell(worldId ? "세계관 편집" : "새 세계관 등록", "세계관 정보") +
    `<form class="form-card" id="worldForm">
      <div class="form-row"><label>세계관 제목</label><input name="title" value="${esc(world.title)}" required placeholder="예: 비밀 숲 세계관" /></div>
      <div class="form-row"><label>소개글</label><textarea name="description" placeholder="세계관의 핵심 분위기, 배경, 규칙을 적어주세요.">${esc(world.description)}</textarea></div>
      ${radioGroup("sourceScope", "세계관 출처", [["me", "나"], ["external", "외부"], ["myExternal", "나의 외부"]], world.sourceScope)}
      <div class="grid three external-source-fields"><div class="form-row"><label>외부작품 이름</label><input data-external-source name="externalSourceName" value="${esc(world.externalSourceName)}" placeholder="외부 출처 작품명을 적어주세요." /></div><div class="form-row"><label>외부작품 작가이름</label><input data-external-source name="externalAuthorName" value="${esc(world.externalAuthorName || "")}" placeholder="외부작품의 작가명을 적어주세요." /></div><div class="form-row"><label>외부 링크</label><input data-external-source name="externalSourceLink" value="${esc(world.externalSourceLink)}" placeholder="외부 출처 링크가 있으면 적어주세요." /></div></div>
      <div class="step-actions"><button class="primary-btn">저장</button><button type="button" class="secondary-btn" id="backWorlds">세계관 목록으로 돌아가기</button>${worldId && connectedCount === 0 ? `<button type="button" class="danger-btn" id="deleteWorld">세계관 삭제</button>` : ""}</div>
    </form>`;
  $("#backWorlds").addEventListener("click", () => navigate("worlds"));
  $("#deleteWorld")?.addEventListener("click", () => confirmDeleteWorld(world.id));
  preventEnterSubmit($("#worldForm"));
  const syncExternalFields = () => {
    const disabled = $('input[name="sourceScope"]:checked', $("#worldForm"))?.value === "me";
    $$("[data-external-source]", $("#worldForm")).forEach((input) => {
      input.disabled = disabled;
      if (disabled) input.value = "";
    });
  };
  $$('input[name="sourceScope"]', $("#worldForm")).forEach((input) => input.addEventListener("change", syncExternalFields));
  syncExternalFields();
  $("#worldForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const data = formData(event.currentTarget);
    if (data.sourceScope === "me") {
      data.externalSourceName = "";
      data.externalAuthorName = "";
      data.externalSourceLink = "";
    }
    upsert("worldbuildings", { ...world, ...data, ownerUserId: world.ownerUserId || CURRENT_USER_ID, workIds: world.workIds || [], itemIds: world.itemIds || [], characterIds: world.characterIds || [] });
    navigate("worlds");
  });
}

function confirmDeleteWorld(worldId) {
  const state = loadState();
  const world = state.worldbuildings.find((item) => item.id === worldId);
  if (!world) return navigate("worlds");
  const connectedCount = state.works.filter((work) => world.workIds?.includes(work.id)).length;
  if (connectedCount > 0) {
    showModal({ title: "안내", body: "연결된 작품이 있는 세계관은 삭제할 수 없습니다." });
    return;
  }
  showModal({
    title: "세계관 삭제",
    body: "정말 삭제하시겠습니까?",
    actions: [
      { label: "삭제", kind: "danger", onClick: () => deleteWorld(worldId) },
      { label: "취소", kind: "secondary" },
    ],
  });
}

function deleteWorld(worldId) {
  const state = loadState();
  state.worldbuildings = state.worldbuildings.filter((world) => world.id !== worldId);
  state.items = state.items.filter((item) => item.worldbuildingId !== worldId);
  state.characters = state.characters.filter((character) => character.worldbuildingId !== worldId);
  saveState(state);
  showModal({ body: "세계관을 삭제했습니다." });
  navigate("worlds");
}

function currentWorld() {
  return loadState().worldbuildings.find((world) => world.id === route.worldId) || loadState().worldbuildings[0];
}

function renderItems() {
  const world = currentWorld();
  const items = loadState().items.filter((item) => item.worldbuildingId === world.id);
  app.innerHTML =
    shell("아이템 관리", esc(world.title), `<button class="primary-btn" id="newItem">새 아이템 등록</button>`) +
    `<p class="readonly-note">아이템은 갈래글 작품의 진행 상태입니다. 일반글에서는 세계관 자료로만 사용됩니다.</p><div class="view">${items.map(itemCard).join("")}</div><div class="step-actions"><button class="secondary-btn" id="backWorld">세계관으로 돌아가기</button></div>`;
  $("#newItem").addEventListener("click", () => itemForm(world.id));
  $("#backWorld").addEventListener("click", () => navigate("worlds", { worldId: world.id }));
  $$("[data-item-edit]").forEach((button) => button.addEventListener("click", () => itemForm(world.id, button.dataset.itemEdit)));
}

function itemCard(item) {
  return `<article class="item-row"><strong>${esc(item.name)}</strong><span>${item.type === "main" ? "메인" : "서브"} ${esc(item.priority)}</span>${tagRow(item.tags)}<button class="secondary-btn" data-item-edit="${item.id}">수정</button></article>`;
}

function itemForm(worldId, itemId = "") {
  const item = loadState().items.find((x) => x.id === itemId) || { id: uid("item"), worldbuildingId: worldId, ownerUserId: CURRENT_USER_ID, name: "", type: "main", priority: 1, tags: [], itemKind: "normal", defaultAddMessage: "", defaultRemoveMessage: "" };
  app.innerHTML =
    shell(itemId ? "아이템 수정" : "아이템 생성", "인터렉티브 소설 전용") +
    `<form class="form-card" id="itemForm">
      <div class="form-row"><label>아이템 이름</label><input name="name" id="itemName" value="${esc(item.name)}" required placeholder="예: 낡은열쇠" /></div>
      <div class="item-compact-row">
        ${radioGroup("type", "타입", [["main", "메인"], ["sub", "서브"]], item.type)}
        <div class="form-row"><label>우선순위 <button type="button" class="help-dot" data-help="우선순위 숫자가 클수록 중요도가 높고 이벤트 처리 인식률이 높습니다. 우선순위가 더 높더라도 타입이 서브면 메인 타입이 먼저 인식됩니다.">?</button></label><input type="number" name="priority" value="${esc(item.priority)}" min="1" /></div>
      </div>
      <div class="form-row"><label>태그</label><input data-tag-input name="tags" value="${esc(item.tags.join(", "))}" placeholder="태그를 적고 Enter를 누르면 등록됩니다. 예: 열쇠" /></div>
      <div class="grid two"><div class="form-row"><label>기본 추가 멘트</label><input name="defaultAddMessage" id="addMessage" value="${esc(item.defaultAddMessage)}" placeholder="아이템을 얻었을 때 보여줄 문장" /></div><div class="form-row"><label>기본 삭제 멘트</label><input name="defaultRemoveMessage" id="removeMessage" value="${esc(item.defaultRemoveMessage)}" placeholder="아이템을 잃었을 때 보여줄 문장" /></div></div>
      <div class="step-actions"><button class="primary-btn">저장</button><button type="button" class="secondary-btn" id="backItems">아이템 목록으로 돌아가기</button></div>
    </form>`;
  $("#itemName").addEventListener("blur", () => {
    if (!$("#addMessage").value) $("#addMessage").value = `${$("#itemName").value}를 손에 넣었다.`;
    if (!$("#removeMessage").value) $("#removeMessage").value = `${$("#itemName").value}를 잃었다.`;
  });
  $("#backItems").addEventListener("click", () => navigate("items", { worldId }));
  preventEnterSubmit($("#itemForm"));
  $("#itemForm").addEventListener("submit", (event) => {
    event.preventDefault();
    syncCommittedTags(event.currentTarget);
    const data = formData(event.currentTarget);
    upsert("items", { ...item, ...data, priority: Number(data.priority), tags: splitList(data.tags) });
    navigate("items", { worldId });
  });
}

function renderCharacters() {
  const world = currentWorld();
  const characters = loadState().characters.filter((character) => character.worldbuildingId === world.id);
  app.innerHTML =
    shell("등장인물 관리", esc(world.title), `<button class="primary-btn" id="newCharacter">새 등장인물 등록</button>`) +
    `<div class="view">${characters.map(characterCard).join("")}</div><div class="step-actions"><button class="secondary-btn" id="backWorld">세계관으로 돌아가기</button></div>`;
  $("#newCharacter").addEventListener("click", () => characterForm(world.id));
  $("#backWorld").addEventListener("click", () => navigate("worlds"));
  $$("[data-character-edit]").forEach((button) => button.addEventListener("click", () => characterForm(world.id, button.dataset.characterEdit)));
}

function characterCard(character) {
  const label = character.authorLabel || character.name || "";
  const avatarStyle = character.image ? `style="background-image:url('${esc(character.image)}')"` : "";
  return `<article class="character-card">
    <div class="character-line main"><div class="avatar" ${avatarStyle}>${character.image ? "" : "얼굴"}</div><strong>${esc(label)}</strong><span>${esc(character.fullName || "풀네임 없음")}</span><button class="secondary-btn" data-character-edit="${character.id}">수정</button></div>
    <div class="character-line">${esc(character.publicDescription || "공개 설명이 없습니다.")}</div>
    <div class="character-line helper">${esc(character.privateDescription || "비공개 메모 없음")}</div>
  </article>`;
}

function characterForm(worldId, characterId = "") {
  const character = loadState().characters.find((x) => x.id === characterId) || { id: uid("char"), worldbuildingId: worldId, authorLabel: "", name: "", fullName: "", publicDescription: "", privateDescription: "", image: "" };
  const label = character.authorLabel || character.name || "";
  app.innerHTML =
    shell(characterId ? "등장인물 수정" : "등장인물 등록", "등장인물 정보") +
    `<form class="form-card" id="characterForm">
      <div class="grid two"><div class="form-row"><label>작가호칭</label><input name="authorLabel" value="${esc(label)}" required placeholder="예: 주인공, 조연1" /></div><div class="form-row"><label>풀네임</label><input name="fullName" value="${esc(character.fullName)}" placeholder="예: 한서린" /></div></div>
      <div class="character-face-field"><div class="square-image-card"><input name="image" value="${esc(character.image)}" placeholder="얼굴 이미지 mock. 선택사항입니다." /></div></div>
      <div class="form-row"><label>설명(공개)</label><textarea name="publicDescription" placeholder="독자에게 보여줄 수 있는 공개 설명을 적어주세요.">${esc(character.publicDescription)}</textarea></div>
      <div class="form-row"><label>설명(비공개)</label><textarea name="privateDescription" placeholder="작가만 보는 메모를 적어주세요.">${esc(character.privateDescription)}</textarea></div>
      <div class="step-actions"><button class="primary-btn">저장</button><button type="button" class="secondary-btn" id="backCharacters">등장인물 목록으로 돌아가기</button></div>
    </form>`;
  $("#backCharacters").addEventListener("click", () => navigate("characters", { worldId }));
  preventEnterSubmit($("#characterForm"));
  $("#characterForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const data = formData(event.currentTarget);
    upsert("characters", { ...character, ...data, name: data.authorLabel });
    navigate("characters", { worldId });
  });
}

function renderEditor() {
  const state = loadState();
  const work = state.works.find((item) => item.id === route.workId) || state.works[0];
  const episodes = workEpisodes(work.id);
  const episode = state.episodes.find((item) => item.id === route.episodeId) || {
    id: uid("ep"),
    workId: work.id,
    episodeNo: episodes.length ? Math.max(...episodes.map((ep) => Number(ep.episodeNo))) + 1 : work.type === "interactive" ? 0 : 1,
    requiredPreviousEpisodeNo: "",
    title: "",
    body: "",
    authorNote: "",
    status: "draft",
    publishAt: "",
    isPaid: false,
    price: 0,
  };
  app.innerHTML =
    shell("화 작성 에디터", esc(work.title)) +
    `<form class="form-card editor-form" id="episodeForm">
      <div class="grid two"><div class="form-row"><label>화 선택</label><select id="episodeSelect"><option value="">새 화</option>${episodes.map((ep) => `<option value="${ep.id}" ${ep.id === episode.id ? "selected" : ""}>${ep.episodeNo}화 ${esc(ep.title)}</option>`)}</select></div><div class="form-row"><label>화 제목</label><input name="title" value="${esc(episode.title)}" required placeholder="예: 프롤로그, 숲의 문이 열리는 밤" /></div></div>
      ${work.type === "interactive" ? `<div class="form-row"><label>필수 이전 홧수</label><select name="requiredPreviousEpisodeNo"><option value="">없음</option>${episodes.filter((ep) => ep.id !== episode.id).map((ep) => `<option value="${ep.episodeNo}" ${String(episode.requiredPreviousEpisodeNo) === String(ep.episodeNo) ? "selected" : ""}>${ep.episodeNo}화 ${esc(ep.title)}</option>`)}</select><p class="helper">필수 이전 홧수는 이 화를 보기 전에 반드시 지나쳐야 하는 화입니다. 없음이면 별도 진입 조건이 없습니다. 특정 분기를 지나온 독자에게만 보여주려면 그 분기 화를 선택하고, 갈래글 형식으로 일반 순차 연재를 하려면 바로 전 화를 선택하세요.</p></div>` : ""}
      <div class="editor-tools">${work.type === "interactive" ? `<button type="button" class="secondary-btn" data-insert="[[선택지:\\n무엇을 한다.\\n아무것도 안한다.\\n]]">선택지</button><button type="button" class="secondary-btn" data-insert="[[씬:무엇을 한다.\\n무엇을 했다.\\n]]">씬</button><button type="button" class="secondary-btn" data-insert="[[+아이템]]">+아이템</button><button type="button" class="secondary-btn" data-insert="[[엔딩:이름\\n내용\\n]]">엔딩</button>` : ""}</div>
      <div class="form-row"><label>본문</label><textarea class="manuscript" id="bodyInput" name="body" placeholder="${work.type === "interactive" ? "본문을 쓰고 [[선택지:]], [[씬:]], [[+아이템]] 문법을 사용할 수 있습니다." : "첫 문장을 적어보세요. 독자가 보는 줄폭에 가깝게 작성됩니다."}">${esc(episode.body)}</textarea></div>
      <div class="form-row"><label>작가의 말</label><textarea name="authorNote" placeholder="생략하면 작가의 말이 표시되지 않습니다.">${esc(episode.authorNote)}</textarea></div>
      <div class="step-actions"><button class="secondary-btn" data-save="draft">임시 저장</button><button class="primary-btn" data-save="queued">등록/대기열 보내기</button><button type="button" class="secondary-btn" id="previewEpisode">미리보기</button><button type="button" class="secondary-btn" id="backDashboard">작품목록으로 돌아가기</button></div>
    </form>`;
  $("#episodeSelect").addEventListener("change", (event) => navigate("editor", { workId: work.id, episodeId: event.target.value || undefined }));
  $$("[data-insert]").forEach((button) => button.addEventListener("click", () => insertText($("#bodyInput"), button.dataset.insert.replaceAll("\\n", "\n"))));
  $("#previewEpisode").addEventListener("click", () => {
    saveEpisode(work, episode, $("#episodeForm"), "draft", false);
    navigate("preview", { workId: work.id, episodeId: episode.id });
  });
  $("#backDashboard").addEventListener("click", () => navigate("dashboard"));
  preventEnterSubmit($("#episodeForm"));
  $("#episodeForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const status = event.submitter?.dataset.save || "draft";
    saveEpisode(work, episode, event.currentTarget, status, true);
  });
}

function insertText(textarea, text) {
  const start = textarea.selectionStart;
  textarea.value = `${textarea.value.slice(0, start)}${text}${textarea.value.slice(textarea.selectionEnd)}`;
  textarea.focus();
  textarea.selectionStart = textarea.selectionEnd = start + text.length;
}

function saveEpisode(work, episode, form, status, moveQueue) {
  const state = loadState();
  const stateWork = state.works.find((item) => item.id === work.id) || work;
  const data = formData(form);
  Object.assign(episode, {
    title: data.title,
    requiredPreviousEpisodeNo: data.requiredPreviousEpisodeNo || "",
    body: data.body,
    authorNote: data.authorNote,
    status,
    updatedAt: timestamp(),
    createdAt: episode.createdAt || timestamp(),
    isPaid: episode.isPaid || false,
    price: episode.price || 0,
  });
  if (!state.episodes.find((item) => item.id === episode.id)) {
    state.episodes.push(episode);
    stateWork.episodeOrder.push(episode.id);
  }
  if (status === "queued") enforceQueueLimit(state, stateWork);
  saveState(state);
  if (moveQueue) navigate(status === "queued" ? "queue" : "editor", { workId: work.id, episodeId: episode.id });
}

function renderQueue() {
  const state = loadState();
  const focusWork = state.works.find((work) => work.id === route.workId);
  const queueStatusFilter = route.queueStatusFilter || focusWork?.status || "serializing";
  const counts = statusCounts(state.works);
  const works = [...state.works]
    .filter((work) => work.status === queueStatusFilter)
    .sort((a, b) => {
      if (focusWork?.id === a.id) return -1;
      if (focusWork?.id === b.id) return 1;
      if (a.releaseSettings.method !== b.releaseSettings.method) return a.releaseSettings.method === "regular" ? -1 : 1;
      return nextScheduleTime(a.releaseSettings) - nextScheduleTime(b.releaseSettings);
    });
  app.innerHTML =
    shell(
      "대기열 관리",
      "작품별 연재 대기열",
      `<div class="queue-sim-panel"><button class="secondary-btn slim-btn" id="queueSimAdd">새 원고 대기열 추가</button><button class="secondary-btn slim-btn" id="queueSimCron">정기연재 시간 도래</button><span>공용: 대기열 추가권 ${currentUser().queueAddTickets || 0}개</span></div>`
    ) +
    statusFilterBar(queueStatusFilter, counts, "queue-status-filter") +
    `<div class="view">${works.length ? works.map(queueSection).join("") : `<p class="empty">해당 상태의 작품이 없습니다.</p>`}</div>`;
  $("#queueSimAdd")?.addEventListener("click", () => simulateQueueAdd(works[0]?.id));
  $("#queueSimCron")?.addEventListener("click", () => simulateQueueCron());
  $$("[data-queue-status-filter]").forEach((button) => button.addEventListener("click", () => navigate("queue", { queueStatusFilter: button.dataset.queueStatusFilter })));
  $$("[data-queue-edit]").forEach((button) => button.addEventListener("click", () => navigate("editor", { workId: button.dataset.workId, episodeId: button.dataset.queueEdit })));
  $$("[data-confirm-episode]").forEach((button) => button.addEventListener("click", () => confirmQueueEpisode(button.dataset.confirmEpisode)));
  $$("[data-confirmed-down]").forEach((button) => button.addEventListener("click", () => moveConfirmedToQueue(button.dataset.confirmedDown)));
  $$("[data-publish-confirmed]").forEach((button) => button.addEventListener("click", () => publishConfirmedEpisodes(button.dataset.publishConfirmed)));
  $$("[data-delete-queue]").forEach((button) => button.addEventListener("click", () => askDeleteQueueEpisode(button.dataset.deleteQueue)));
  $$("[data-expand-queue]").forEach((button) => button.addEventListener("click", () => askExpandQueue(button.dataset.expandQueue)));
  $$("[data-toggle-empty-slots]").forEach((input) => input.addEventListener("change", () => toggleEmptySlots(input.dataset.toggleEmptySlots, input.checked)));
  $$("[data-queue-help]").forEach((button) => button.addEventListener("click", showConfirmedHelp));
  bindQueueDrag();
}

function queueSection(work) {
  const episodes = workEpisodes(work.id);
  const confirmed = queueSorted(episodes.filter((ep) => ep.status === "confirmed"));
  const queued = queueSorted(episodes.filter((ep) => ep.status === "queued"));
  const published = episodes.filter((ep) => ep.status === "published").length;
  const maxSlots = Number(work.queueMaxSlots || 1);
  const emptySlots = Math.max(maxSlots - queued.length, 0);
  const scheduleText = nextScheduleLabel(work.releaseSettings);
  const isRegular = work.releaseSettings.method === "regular";
  const isCompleted = work.status === "completed";
  return `<section class="queue-work">
    <div class="queue-head queue-head-rich">
      <div>
        <h2>${esc(work.title)} <span class="badge">${isCompleted ? "완결" : isRegular ? "정기연재" : "비정기"}</span>${work.type === "interactive" ? ` <span class="badge blue">갈래글</span>` : ""}${work.isAdult === "adult" ? ` <span class="badge danger">19금</span>` : ""}${work.isPaidWork ? ` <span class="badge warn">유료</span>` : ""}</h2>
        <div class="queue-meta"><span class="queue-meta-main">연재방식 <strong>${isRegular ? `${weekdayChipsText(work.releaseSettings.days)} ${work.releaseSettings.hour}:${work.releaseSettings.minute}` : "비정기"}</strong></span><span>공개 완료 <strong>${published}화</strong></span><span>확정 목록 <strong>${confirmed.length}개</strong></span><span class="queue-meta-soft">대기열 <strong>${queued.length}/${maxSlots}</strong></span><span class="queue-meta-soft">지원권 <strong>${work.queueSupportTickets}장</strong></span></div>
      </div>
    </div>
    ${isCompleted ? `<p class="readonly-note">완결 작품은 대기열 없이 즉시 공개만 사용할 수 있습니다.</p>` : ""}
    <div class="publish-zone">
      <div class="publish-zone-title"><h3>연재 확정 목록 <button type="button" class="help-dot" data-queue-help>?</button></h3><span>${esc(scheduleText)}</span></div>
      <p class="queue-zone-note">${isRegular ? "다음 연재 시간에 이 목록의 모든 원고가 공개됩니다." : "이 목록의 원고는 [지금 모두 공개]로 한 번에 공개할 수 있습니다."}</p>
      ${confirmed.length ? confirmedList(work, confirmed, published) : `<p class="helper confirmed-empty">확정 목록이 비어 있습니다. 아래 대기열에서 연재확정을 눌러주세요.</p>`}
      <button class="primary-btn publish-all-btn" data-publish-confirmed="${work.id}" ${confirmed.length ? "" : "disabled"}>지금 모두 공개</button>
    </div>
    <div class="queue-list-head"><strong>대기열 목록</strong><label class="plain-check"><input type="checkbox" data-toggle-empty-slots="${work.id}" ${work.queueShowEmptySlots !== false ? "checked" : ""}/> 빈 자리 보이기</label></div>
    ${queueList(work, queued, published + confirmed.length, emptySlots)}
  </section>`;
}

function confirmedList(work, episodes, publishedCount) {
  return `<table class="queue-table confirmed-table"><thead><tr><th>화 번호</th><th>제목</th><th>최근 작성일</th><th>액션</th></tr></thead><tbody>${episodes
    .map((ep, index) => `<tr><td><strong>${publishedCount + index + 1}화</strong></td><td><strong>${esc(ep.title)}</strong></td><td>${formatDate(ep.updatedAt)}</td><td><button class="secondary-btn slim-btn" data-confirmed-down="${ep.id}">대기열로 내리기</button></td></tr>`)
    .join("")}</tbody></table>`;
}

function queueList(work, episodes, startNumber, emptySlots) {
  return `<table class="queue-table queue-waiting-table">
    <thead><tr><th></th><th>화 번호</th><th>제목</th><th>최근 작성일</th><th>관리</th></tr></thead>
    <tbody class="queue-drag-container" data-work-id="${work.id}">
      ${episodes.length || (work.queueShowEmptySlots !== false && emptySlots) ? `${queuedRows(work, episodes, startNumber)}${work.queueShowEmptySlots !== false ? emptySlotRows(startNumber + episodes.length, emptySlots) : ""}` : `<tr><td colspan="5" class="queue-empty-cell">대기열 원고가 없습니다.</td></tr>`}
      <tr class="transparent-plus-row"><td colspan="5"><button class="queue-expand-row" data-expand-queue="${work.id}">+ 대기열 1칸 늘리기</button></td></tr>
    </tbody>
  </table>`;
}

function queuedRows(work, episodes, startNumber) {
  return episodes
    .map((ep, index) => `<tr class="queue-row-slim queue-draggable-row" draggable="true" data-ep-id="${ep.id}"><td><span class="drag-handle" aria-label="위치 이동">☰</span></td><td><strong>${startNumber + index + 1}화</strong></td><td><strong>${esc(ep.title)}</strong></td><td>${formatDate(ep.updatedAt)}</td><td><div class="queue-actions"><button class="secondary-btn slim-btn" data-work-id="${work.id}" data-queue-edit="${ep.id}">수정</button><button class="primary-btn slim-btn" data-confirm-episode="${ep.id}" ${index === 0 ? "" : "disabled title=\"맨 위의 화만 연재확정할 수 있습니다.\""}>연재확정</button><span class="queue-action-gap"></span><button class="danger-btn slim-btn" data-delete-queue="${ep.id}">삭제</button></div></td></tr>`)
    .join("");
}

function emptySlotRows(startNumber, count) {
  return Array.from({ length: count }, (_, index) => `<tr class="empty-slot-row"><td></td><td>${startNumber + index + 1}화</td><td colspan="3">비어 있는 자리</td></tr>`).join("");
}

function queueSorted(episodes) {
  return [...episodes].sort((a, b) => Number(a.episodeNo) - Number(b.episodeNo) || String(a.createdAt || "").localeCompare(String(b.createdAt || "")));
}

function reindexQueuedEpisodes(state, workId, orderedQueued) {
  const episodes = state.episodes.filter((episode) => episode.workId === workId);
  const publishedCount = episodes.filter((ep) => ep.status === "published").length;
  const confirmedCount = episodes.filter((ep) => ep.status === "confirmed").length;
  orderedQueued.forEach((episode, index) => {
    const target = state.episodes.find((item) => item.id === episode.id);
    if (target) {
      target.episodeNo = publishedCount + confirmedCount + index + 1;
    }
  });
}

function weekdayChipsText(days = []) {
  return days?.length ? days.join(", ") : "요일 없음";
}

function nextScheduleTime(settings = {}) {
  if (settings.method !== "regular" || !settings.days?.length) return Number.MAX_SAFE_INTEGER;
  const dayMap = { 일: 0, 월: 1, 화: 2, 수: 3, 목: 4, 금: 5, 토: 6 };
  const nowDate = new Date();
  const targetHour = Number(settings.hour || 0);
  const targetMinute = Number(settings.minute || 0);
  const candidates = settings.days.map((day) => {
    const target = new Date(nowDate);
    let diff = dayMap[day] - nowDate.getDay();
    target.setHours(targetHour, targetMinute, 0, 0);
    if (diff < 0 || (diff === 0 && target <= nowDate)) diff += 7;
    target.setDate(nowDate.getDate() + diff);
    return target.getTime();
  });
  return Math.min(...candidates);
}

function nextScheduleLabel(settings = {}) {
  if (settings.method !== "regular") return "";
  const time = nextScheduleTime(settings);
  if (!Number.isFinite(time) || time === Number.MAX_SAFE_INTEGER) return "";
  return `확정 스케줄: ${formatDate(new Date(time).toISOString())} 업로드 예정`;
}

function enforceQueueLimit(state, work) {
  const queued = queueSorted(state.episodes.filter((ep) => ep.workId === work.id && ep.status === "queued"));
  while (queued.length > Number(work.queueMaxSlots || 1)) {
    const oldest = queued.shift();
    if (!oldest) break;
    oldest.status = "confirmed";
  }
}

function confirmQueueEpisode(episodeId) {
  const state = loadState();
  const ep = state.episodes.find((item) => item.id === episodeId);
  if (!ep) return;
  const queued = queueSorted(state.episodes.filter((item) => item.workId === ep.workId && item.status === "queued"));
  if (queued[0]?.id !== ep.id) return showModal({ body: "맨 위의 화만 연재확정할 수 있습니다." });
  ep.status = "confirmed";
  saveState(state);
  showQueueToast("연재 확정 목록으로 이동했습니다.");
  renderQueue();
}

function moveQueueEpisode(episodeId, direction) {
  const state = loadState();
  const ep = state.episodes.find((item) => item.id === episodeId);
  if (!ep) return;
  const queued = queueSorted(state.episodes.filter((item) => item.workId === ep.workId && item.status === "queued"));
  const index = queued.findIndex((item) => item.id === episodeId);
  const nextIndex = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || nextIndex < 0 || nextIndex >= queued.length) return;
  [queued[index], queued[nextIndex]] = [queued[nextIndex], queued[index]];
  reindexQueuedEpisodes(state, ep.workId, queued);
  saveState(state);
  renderQueue();
}

function bindQueueDrag() {
  $$(".queue-drag-container").forEach((container) => {
    let dragging = null;
    container.addEventListener("dragstart", (event) => {
      dragging = event.target.closest(".queue-draggable-row");
      if (!dragging) return;
      dragging.classList.add("dragging");
      event.dataTransfer.effectAllowed = "move";
    });
    container.addEventListener("dragover", (event) => {
      event.preventDefault();
      const current = container.querySelector(".dragging");
      if (!current) return;
      const after = dragAfterElement(container, event.clientY);
      const anchor = after || container.querySelector(".empty-slot-row") || container.querySelector(".transparent-plus-row");
      if (anchor) container.insertBefore(current, anchor);
      else container.appendChild(current);
    });
    container.addEventListener("dragend", () => {
      if (!dragging) return;
      dragging.classList.remove("dragging");
      applyDraggedQueueOrder(container.dataset.workId, container);
      dragging = null;
    });
  });
}

function dragAfterElement(container, y) {
  return [...container.querySelectorAll(".queue-draggable-row:not(.dragging)")].reduce(
    (closest, row) => {
      const box = row.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) return { offset, row };
      return closest;
    },
    { offset: Number.NEGATIVE_INFINITY, row: null }
  ).row;
}

function applyDraggedQueueOrder(workId, container) {
  const state = loadState();
  const ordered = [...container.querySelectorAll(".queue-draggable-row")]
    .map((row) => state.episodes.find((episode) => episode.id === row.dataset.epId))
    .filter(Boolean);
  reindexQueuedEpisodes(state, workId, ordered);
  saveState(state);
  showQueueToast("대기열 순서를 저장했습니다.");
  renderQueue();
}

function moveConfirmedToQueue(episodeId) {
  const state = loadState();
  const ep = state.episodes.find((item) => item.id === episodeId);
  const work = state.works.find((item) => item.id === ep?.workId);
  if (!ep || !work) return;
  const queued = queueSorted(state.episodes.filter((item) => item.workId === work.id && item.status === "queued"));
  if (queued.length >= Number(work.queueMaxSlots || 1)) {
    const oldest = queued[0];
    oldest.status = "confirmed";
  }
  ep.status = "queued";
  saveState(state);
  showQueueToast("대기열로 이동했습니다.");
  renderQueue();
}

function simulateQueueAdd(workId) {
  const state = loadState();
  const work = state.works.find((item) => item.id === workId) || state.works.find((item) => item.status === "serializing");
  if (!work) return showModal({ body: "연재중 작품이 없습니다." });
  const episodes = workEpisodes(work.id);
  const episode = {
    id: uid("ep"),
    workId: work.id,
    episodeNo: episodes.length ? Math.max(...episodes.map((ep) => Number(ep.episodeNo))) + 1 : 1,
    requiredPreviousEpisodeNo: "",
    title: "새 원고",
    body: "",
    authorNote: "",
    status: "queued",
    publishAt: "",
    isPaid: false,
    price: 0,
    createdAt: timestamp(),
    updatedAt: timestamp(),
  };
  state.episodes.push(episode);
  work.episodeOrder.push(episode.id);
  enforceQueueLimit(state, work);
  saveState(state);
  showModal({ title: "대기열 추가", body: "새 원고를 대기열에 추가했습니다. 자리가 부족하면 맨 위 원고가 연재 확정 목록으로 올라갑니다." });
  renderQueue();
}

function simulateQueueCron() {
  const state = loadState();
  const regularWorks = state.works.filter((work) => work.status === "serializing" && work.releaseSettings.method === "regular");
  let publishedCount = 0;
  let delayedCount = 0;
  regularWorks.forEach((work) => {
    const confirmed = queueSorted(state.episodes.filter((ep) => ep.workId === work.id && ep.status === "confirmed"));
    if (!confirmed.length) {
      delayedCount += 1;
      const noticeCode = uid("notice");
      state.noticeTemplates.push({
        id: uid("template"),
        noticeCode,
        title: "연재 지연 공지",
        body: `${work.title} 정기 연재분이 지연됩니다.`,
        noticeType: "delayed",
        createdAt: timestamp(),
        updatedAt: timestamp(),
        isAutoGenerated: true,
      });
      state.workNotices.push({ id: uid("work_notice"), workId: work.id, noticeCode, createdAt: timestamp(), updatedAt: timestamp(), isAutoGenerated: true });
      return;
    }
    const publishTime = timestamp();
    confirmed.forEach((ep) => {
      ep.status = "published";
      ep.publishAt = publishTime;
      ep.updatedAt = publishTime;
      publishedCount += 1;
      state.releases.push({ id: uid("release"), workId: ep.workId, episodeId: ep.id, releaseType: "scheduledConfirmed", status: "published", publishAt: publishTime });
      state.homeIndex.push({ workId: ep.workId, episodeId: ep.id, publishedAt: publishTime });
    });
  });
  saveState(state);
  showModal({ title: "정기연재 처리", body: `공개 ${publishedCount}개, 지연 공지 ${delayedCount}개를 처리했습니다.` });
  renderQueue();
}

function publishConfirmedEpisodes(workId) {
  const state = loadState();
  const confirmed = queueSorted(state.episodes.filter((ep) => ep.workId === workId && ep.status === "confirmed"));
  if (!confirmed.length) return showModal({ body: "현재 확정 목록에 원고가 없습니다." });
  const publishTime = timestamp();
  confirmed.forEach((ep) => {
    ep.status = "published";
    ep.publishAt = publishTime;
    ep.updatedAt = publishTime;
    state.releases.push({ id: uid("release"), workId: ep.workId, episodeId: ep.id, releaseType: "confirmedAll", status: "published", publishAt: publishTime });
    state.homeIndex.push({ workId: ep.workId, episodeId: ep.id, publishedAt: publishTime });
  });
  saveState(state);
  showModal({ title: "공개 성공", body: `연재 확정 목록에 있던 ${confirmed.length}개의 회차를 공개했습니다.` });
  renderQueue();
}

function askDeleteQueueEpisode(episodeId) {
  showModal({
    title: "원고 삭제",
    body: "이 원고를 삭제하시겠습니까? 삭제하면 대기열/확정 목록에서 제거됩니다.",
    actions: [
      { label: "취소", kind: "secondary" },
      { label: "삭제", kind: "danger", onClick: () => deleteQueueEpisode(episodeId) },
    ],
  });
}

function deleteQueueEpisode(episodeId) {
  const state = loadState();
  const ep = state.episodes.find((item) => item.id === episodeId);
  state.episodes = state.episodes.filter((item) => item.id !== episodeId);
  const work = state.works.find((item) => item.id === ep?.workId);
  if (work) work.episodeOrder = work.episodeOrder.filter((id) => id !== episodeId);
  saveState(state);
  renderQueue();
}

function askExpandQueue(workId) {
  const state = loadState();
  const work = state.works.find((item) => item.id === workId);
  const user = currentUser();
  if (!work) return;
  if ((work.queueSupportTickets || 0) > 0) {
    showModal({
      title: "대기열 1칸 늘리기",
      body: `<p>지원권 1장을 사용해 이 작품의 대기열을 1칸 늘립니다.</p><p class="helper">이 작품 전용 지원권입니다. 다른 작품에는 사용할 수 없습니다.</p><div class="queue-ticket-box">보유 수량: <strong class="queue-ticket-free">지원권 ${work.queueSupportTickets}장</strong></div>`,
      actions: [
        { label: "취소", kind: "secondary" },
        { label: "지원권 사용", kind: "primary", onClick: () => consumeQueueTicket(workId, "support") },
      ],
    });
    return;
  }
  if ((user.queueAddTickets || 0) > 0) {
    showModal({
      title: "대기열 추가권 사용",
      body: `<p>계정에 있는 대기열 추가권 1개를 사용해 이 작품의 대기열을 1칸 늘립니다.</p><div class="queue-ticket-box premium">보유 수량: <strong class="queue-ticket-paid">대기열 추가권 ${user.queueAddTickets}개</strong></div>`,
      actions: [
        { label: "취소", kind: "secondary" },
        { label: "사용", kind: "primary", onClick: () => consumeQueueTicket(workId, "paid") },
      ],
    });
    return;
  }
  showModal({ title: "상점", body: "보유 중인 대기열 추가권이 부족합니다. 상점으로 이동합니다. 지금은 mock입니다." });
}

function consumeQueueTicket(workId, type) {
  const state = loadState();
  const work = state.works.find((item) => item.id === workId);
  const user = state.users.find((item) => item.id === CURRENT_USER_ID) || state.users[0];
  if (!work || !user) return;
  if (type === "support" && (work.queueSupportTickets || 0) > 0) {
    work.queueSupportTickets -= 1;
    work.queueMaxSlots += 1;
  } else if (type === "paid" && (user.queueAddTickets || 0) > 0) {
    user.queueAddTickets -= 1;
    work.queueMaxSlots += 1;
  }
  work.updatedAt = timestamp();
  saveState(state);
  showQueueToast("대기열 한도를 늘렸습니다.");
  renderQueue();
}

function toggleEmptySlots(workId, checked) {
  const state = loadState();
  const work = state.works.find((item) => item.id === workId);
  if (!work) return;
  work.queueShowEmptySlots = checked;
  saveState(state);
  renderQueue();
}

function showQueueToast(message) {
  let toast = $("#queueToast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "queueToast";
    toast.className = "queue-toast";
    document.body.append(toast);
  }
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 1400);
}

function showConfirmedHelp() {
  showModal({
    title: "확정 목록 작동 안내",
    body: "연재 확정 목록은 실제로 공개될 원고를 모아두는 곳입니다. 정기연재 작품은 정해진 시간이 되면 이 목록의 원고가 모두 공개됩니다. 비정기연재 작품은 [지금 모두 공개]를 눌러 공개합니다. 대기열에 있는 원고는 먼저 [연재확정]을 눌러 이 목록으로 올려야 공개됩니다.",
  });
}

function renderNotices() {
  const state = loadState();
  const focusWork = state.works.find((work) => work.id === route.workId);
  const noticeStatusFilter = route.noticeStatusFilter || focusWork?.status || "serializing";
  const counts = statusCounts(state.works);
  const works = focusWork ? [focusWork] : state.works.filter((work) => work.status === noticeStatusFilter);
  app.innerHTML =
    shell("공지 관리", focusWork ? `${esc(focusWork.title)} 공지` : "전체 공지", `<button class="primary-btn" id="newNotice">새 공지 작성</button>`) +
    statusFilterBar(noticeStatusFilter, counts, "notice-status-filter") +
    `<div class="view notice-work-sections">${works.length ? works.map(noticeWorkSection).join("") : `<p class="empty">해당 상태의 작품이 없습니다.</p>`}</div>`;
  $("#newNotice").addEventListener("click", () => noticeForm());
  $$("[data-notice-status-filter]").forEach((button) => button.addEventListener("click", () => navigate("notices", { noticeStatusFilter: button.dataset.noticeStatusFilter })));
  $$("[data-notice-edit]").forEach((button) => button.addEventListener("click", () => noticeForm(button.dataset.noticeEdit)));
  $$("[data-notice-toggle]").forEach((button) => button.addEventListener("click", () => toggleNotice(button)));
}

function noticeWorkSection(work) {
  const state = loadState();
  const notices = state.workNotices
    .filter((notice) => notice.workId === work.id)
    .map((notice) => ({ ...notice, template: noticeTemplate(notice.noticeCode), work }));
  return `<section class="notice-work-section">
    <div class="notice-work-head"><div><h2>${esc(work.title)}</h2><p>${statusText(work.status)} · ${notices.length}개 공지</p></div><div class="notice-work-badges">${work.isAdult === "adult" ? `<span class="badge danger">19금</span>` : ""}${work.isPaidWork ? `<span class="badge warn">유료</span>` : ""}</div></div>
    <div class="notice-list">${notices.length ? notices.map(noticeRow).join("") : `<p class="helper">등록된 공지가 없습니다.</p>`}</div>
  </section>`;
}

function noticeRow(notice) {
  const linked = loadState().workNotices.filter((item) => item.noticeCode === notice.noticeCode).length;
  const date = shortNoticeDate(notice.template?.createdAt || notice.createdAt || notice.template?.updatedAt);
  return `<article class="notice-card notice-card-slim">
    <button type="button" class="notice-summary" data-notice-toggle>
      <span class="notice-date">[${esc(date)}]</span>
      <strong>${esc(notice.template?.title || "제목 없음")}</strong>
      <span class="badge">${notice.template?.isAutoGenerated ? "자동" : "공지"}</span>
    </button>
    <div class="notice-detail" hidden>
      <p>${esc(notice.template?.body || "")}</p>
      <p class="helper">연결 작품 ${linked}개</p>
      <button class="secondary-btn slim-btn" data-notice-edit="${notice.noticeCode}">수정</button>
    </div>
  </article>`;
}

function shortNoticeDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "날짜없음";
  return `${date.getMonth() + 1}.${date.getDate()}`;
}

function toggleNotice(button) {
  const card = button.closest(".notice-card");
  const detail = $(".notice-detail", card);
  if (!detail) return;
  detail.hidden = !detail.hidden;
  card.classList.toggle("open", !detail.hidden);
}

function noticeForm(noticeCode = "") {
  const state = loadState();
  const template = state.noticeTemplates.find((item) => item.noticeCode === noticeCode) || { id: uid("template"), noticeCode: uid("notice"), title: "", body: "", noticeType: "manual", isAutoGenerated: false };
  const noticeTargetGroup = (status, label) => {
    const works = state.works.filter((work) => work.status === status);
    return `<section class="notice-target-group">
      <div class="notice-target-head"><h3>${label}(${works.length}개)</h3><label class="choice"><input type="checkbox" data-notice-select-all="${status}" ${works.length ? "" : "disabled"} /> ${label} 전체선택</label></div>
      <div class="notice-work-list">${works.length ? works.map((work) => `<label class="choice"><input type="checkbox" name="workIds" data-work-status="${status}" value="${work.id}" ${route.workId === work.id ? "checked" : ""}/> ${esc(work.title)}</label>`).join("") : `<p class="helper">해당 상태의 작품이 없습니다.</p>`}</div>
    </section>`;
  };
  app.innerHTML =
    shell(noticeCode ? "공지 수정" : "새 공지 작성", noticeCode ? "같은 공지코드 함께 변경" : "공지 작성") +
    `<form class="form-card" id="noticeForm">
      ${noticeCode ? `<p class="readonly-note">? 이 공지는 같은 공지코드를 쓰는 작품들과 내용을 공유합니다. 여기서 제목이나 내용을 바꾸면 같은 공지코드로 연결된 작품 공지도 함께 바뀝니다.</p>` : ""}
      <div class="form-row"><label>공지 제목</label><input name="title" value="${esc(template.title)}" required placeholder="예: 연재 일정 안내" /></div>
      <div class="form-row"><label>공지 내용</label><textarea name="body" placeholder="독자에게 전달할 공지 내용을 적어주세요.">${esc(template.body)}</textarea></div>
      ${noticeCode ? "" : `<div class="form-row notice-targets"><label>연결 작품</label><div class="notice-target-groups">${noticeTargetGroup("serializing", "연재중")}${noticeTargetGroup("completed", "완결")}</div></div>`}
      <div class="step-actions"><button class="primary-btn">저장</button><button type="button" class="secondary-btn" id="backNotices">취소</button>${noticeCode ? `<button type="button" class="danger-btn" id="deleteNotice">공지 삭제</button>` : ""}</div>
    </form>`;
  $$("[data-notice-select-all]").forEach((input) =>
    input.addEventListener("change", (event) => $$(`input[name="workIds"][data-work-status="${event.target.dataset.noticeSelectAll}"]`, $("#noticeForm")).forEach((checkbox) => (checkbox.checked = event.target.checked)))
  );
  $("#backNotices").addEventListener("click", () => navigate("notices", { workId: route.workId }));
  $("#deleteNotice")?.addEventListener("click", () => askDeleteNotice(noticeCode));
  preventEnterSubmit($("#noticeForm"));
  $("#noticeForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const data = formData(event.currentTarget);
    template.title = data.title;
    template.body = data.body;
    template.updatedAt = timestamp();
    if (!state.noticeTemplates.find((item) => item.noticeCode === template.noticeCode)) {
      template.createdAt = timestamp();
      state.noticeTemplates.push(template);
      const workIds = $$('input[name="workIds"]:checked', event.currentTarget).map((input) => input.value);
      workIds.forEach((workId) => state.workNotices.push({ id: uid("work_notice"), workId, noticeCode: template.noticeCode, createdAt: timestamp(), updatedAt: timestamp(), isAutoGenerated: false }));
    }
    saveState(state);
    navigate("notices", { workId: route.workId });
  });
}

function askDeleteNotice(noticeCode) {
  showModal({
    title: "공지 삭제",
    body: "이 공지를 삭제하시겠습니까? 같은 공지코드로 연결된 작품 공지도 함께 사라집니다.",
    actions: [
      { label: "취소", kind: "secondary" },
      { label: "삭제", kind: "danger", onClick: () => deleteNotice(noticeCode) },
    ],
  });
}

function deleteNotice(noticeCode) {
  const state = loadState();
  state.noticeTemplates = state.noticeTemplates.filter((template) => template.noticeCode !== noticeCode);
  state.workNotices = state.workNotices.filter((notice) => notice.noticeCode !== noticeCode);
  saveState(state);
  navigate("notices", { workId: route.workId });
}

function renderSettings() {
  const state = loadState();
  const user = currentUser();
  const tempWorks = state.works.filter((work) => work.temporaryAuthorNickname);
  const adultLabels = { none: "인증 안 됨", verified: "인증 완료", expired: "만료", failed: "실패" };
  app.innerHTML =
    shell("작가 작업실 설정", "작가 작업실 설정") +
    `<form class="settings-page" id="settingsForm">
      <section class="settings-block"><h2>작업실 기본 정보</h2><div class="form-row"><label>작업실 표시명</label><input name="workspaceTitle" value="${esc(state.authorProfile.workspaceTitle)}" placeholder="작가 작업실 상단에 표시할 이름" /></div></section>
      <section class="settings-block"><h2>작가 닉네임 상태</h2><p class="helper">본 닉네임은 users.officialNickname에 저장되는 계정 공통 닉네임 1개입니다.</p><div class="official-name-line"><input id="officialNameInput" value="${esc(user.officialNickname)}" disabled /><button type="button" class="secondary-btn" id="editOfficial">수정</button></div><p class="helper">남은 본 닉네임 변경권 ${user.officialNicknameChangeTickets}개</p></section>
      <section class="settings-block"><h2>임시닉네임 상태</h2><div class="temporary-name-list">${tempWorks.length ? tempWorks.map((work) => `<div class="temporary-name-row"><div><strong>${esc(work.temporaryAuthorNickname)}</strong><span>${esc(work.title)}</span></div><button type="button" class="secondary-btn" data-reset-temp="${work.id}">본 닉네임으로 변경</button><button type="button" class="secondary-btn" data-temp-shop>변경권 충전</button></div>`).join("") : `<p class="helper">사용 중인 임시닉네임이 없습니다.</p>`}</div></section>
      <section class="settings-block"><h2>내가 보는 장르 표시</h2><p class="helper">작품 등록 기본값으로 사용하지 않는 독자 선호 표시입니다.</p><div class="genre-display-row"><div class="form-row"><label>장르 표시 1</label><select name="readerGenreDisplay1">${genre1Options.map((x) => `<option ${state.authorProfile.readerGenreDisplay1 === x ? "selected" : ""}>${x}</option>`)}</select></div><div class="form-row"><label>장르 표시 2</label><select name="readerGenreDisplay2">${genre2Options.map((x) => `<option ${state.authorProfile.readerGenreDisplay2 === x ? "selected" : ""}>${x}</option>`)}</select></div></div></section>
      <section class="settings-block compact-status"><h2>성인인증 상태</h2><span class="badge">${adultLabels[state.authorProfile.adultVerificationStatus] || "인증 안 됨"}</span></section>
      <section class="settings-block shop-line"><h2>상점</h2><p class="helper">닉네임 변경권 구매는 상점에서 진행합니다.</p><button type="button" class="secondary-btn" id="shopButton">상점 이동</button></section>
      <div class="step-actions"><button class="primary-btn">설정 저장</button><button type="button" class="secondary-btn" id="cancelSettings">취소</button><button type="button" class="secondary-btn" id="backWorks">내 작품 목록으로 돌아가기</button></div>
    </form>`;
  $("#editOfficial").addEventListener("click", handleOfficialNicknameButton);
  $("#shopButton").addEventListener("click", () => showModal({ title: "상점", body: "상점페이지로 이동합니다. 지금은 mock입니다." }));
  $("#cancelSettings").addEventListener("click", () => renderSettings());
  $("#backWorks").addEventListener("click", () => navigate("dashboard"));
  $$("[data-reset-temp]").forEach((button) => button.addEventListener("click", () => resetTempName(button.dataset.resetTemp)));
  $$("[data-temp-shop]").forEach((button) => button.addEventListener("click", () => showModal({ title: "상점", body: "임시닉네임 변경권 충전 화면으로 이동합니다. 지금은 mock입니다." })));
  preventEnterSubmit($("#settingsForm"));
  $("#settingsForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const data = formData(event.currentTarget);
    Object.assign(state.authorProfile, {
      workspaceTitle: data.workspaceTitle,
      readerGenreDisplay1: data.readerGenreDisplay1,
      readerGenreDisplay2: data.readerGenreDisplay2,
      updatedAt: timestamp(),
    });
    saveState(state);
    showModal({ body: "설정을 저장했습니다." });
    renderSettings();
  });
}

function askOfficialNickname() {
  const user = currentUser();
  showModal({
    title: "공식 닉네임 변경",
    body: `<p>1회 변경 가능. 변경하시겠습니까?</p><p class="helper">남은 변경권 ${user.officialNicknameChangeTickets}개</p>`,
    actions: [
      { label: "변경", kind: "primary", onClick: () => enableNicknameEdit() },
      { label: "취소", kind: "secondary" },
      { label: "상점", kind: "secondary", onClick: () => showModal({ title: "상점", body: "상점페이지로 이동합니다. 지금은 mock입니다." }) },
    ],
  });
}

function handleOfficialNicknameButton() {
  const button = $("#editOfficial");
  if (button.dataset.mode === "complete") return completeNicknameEdit();
  askOfficialNickname();
}

function enableNicknameEdit() {
  const input = $("#officialNameInput");
  const button = $("#editOfficial");
  if (currentUser().officialNicknameChangeTickets <= 0) {
    showModal({ body: "변경권이 없습니다. 상점에서 충전해주세요." });
    return;
  }
  input.disabled = false;
  input.focus();
  button.textContent = "완료";
  button.dataset.mode = "complete";
}

function completeNicknameEdit() {
  const input = $("#officialNameInput");
  const user = currentUser();
  user.officialNickname = input.value.trim() || user.officialNickname;
  user.officialNicknameUpdatedAt = timestamp();
  user.officialNicknameChangeTickets = Math.max(0, user.officialNicknameChangeTickets - 1);
  saveState(loadState());
  showModal({ body: "공식 닉네임을 변경했습니다." });
  renderSettings();
}

function resetTempName(workId) {
  const state = loadState();
  const work = state.works.find((item) => item.id === workId);
  if (!work) return;
  work.temporaryAuthorNickname = "";
  work.temporaryAuthorNicknameUpdatedAt = timestamp();
  saveState(state);
  renderSettings();
}

function renderPreview() {
  const episode = loadState().episodes.find((item) => item.id === route.episodeId);
  app.innerHTML =
    shell("작가 미리보기", episode ? esc(episode.title) : "미리보기") +
    `<div class="preview-box"><div class="preview-reader">${renderReader(episode?.body || "")}</div><div class="step-actions"><button class="secondary-btn" id="backEditor">에디터로 돌아가기</button></div></div>`;
  $("#backEditor").addEventListener("click", () => navigate("editor", { workId: route.workId, episodeId: route.episodeId }));
}

function renderReader(body) {
  const withoutBlocks = esc(body)
    .replace(/\[\[선택지:\n([\s\S]*?)\]\]/g, (_, choices) => `<div class="reader-choices">${choices.split("\n").filter(Boolean).map((choice) => `<button>${esc(choice.replace(/\[\[.*?\]\]/g, ""))}</button>`).join("")}</div>`)
    .replace(/\[\[씬:([\s\S]*?)\]\]/g, "")
    .replace(/\[\[[+-].*?\]\]/g, "")
    .replace(/\[\[엔딩:([\s\S]*?)\]\]/g, "<strong>엔딩</strong>");
  return withoutBlocks.split("\n").map((line) => (line.trim() ? `<p>${line}</p>` : "<br>")).join("");
}

bindModal();
$("#exportJson").addEventListener("click", () => showModal({ title: "JSON 내보내기", body: `<pre class="export-box">${esc(exportState())}</pre>` }));
$("#resetSeed").addEventListener("click", () =>
  showModal({
    title: "샘플 데이터 다시 넣기",
    body: "현재 localStorage 데이터가 샘플 데이터로 초기화됩니다.",
    actions: [
      { label: "초기화", kind: "danger", onClick: () => { resetState(); navigate("dashboard"); } },
      { label: "취소", kind: "secondary" },
    ],
  }),
);

render();

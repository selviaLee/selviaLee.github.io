const STORAGE_KEY = "supgeul_phase1_author_studio_v2";
const FAVORITE_KEY = "supgeul_phase3_favorites";
const LAST_READ_KEY = "supgeul_phase3_last_read";

const fallbackState = {
  users: [{ id: "user_current", officialNickname: "숲무늬" }],
  works: [
    {
      id: "sample_work",
      userId: "user_current",
      title: "비밀 숲의 선택자",
      type: "interactive",
      temporaryAuthorNickname: "숲고지기",
      description:
        "닫힌 숲에서 시작되는 선택형 연재입니다. 독자의 선택과 아이템에 따라 다른 장면을 보게 됩니다. 이 소개는 기본 3줄까지만 보이고 더보기로 펼쳐집니다.",
      genre1: "판타지",
      genre2: "갈래글",
      normalTags: ["선택지", "성장물", "마법", "숲"],
      sensitiveTags: ["민감 태그 예시"],
      isAdult: "all",
      status: "serializing",
      isPaidWork: false,
      releaseSettings: { method: "regular", days: ["월", "수", "금"], hour: "18", minute: "00", timezone: "Asia/Seoul" },
      cover: { mode: "color", color: "#47645e", showTitle: true },
      views: 12000,
      favorites: 209,
      comments: 37,
      nextEpisodeWaiters: 12,
    },
    {
      id: "sample_other",
      userId: "user_current",
      title: "눈사람 밑의 문장들",
      type: "normal",
      temporaryAuthorNickname: "",
      description: "같은 공식 닉네임으로 쓰는 겨울 성장 연재입니다.",
      genre1: "판타지",
      genre2: "일반글",
      normalTags: ["성장", "겨울", "마법"],
      sensitiveTags: [],
      isAdult: "all",
      status: "completed",
      isPaidWork: false,
      releaseSettings: { method: "irregular", days: [], hour: "18", minute: "00", timezone: "Asia/Seoul" },
      cover: { mode: "color", color: "#6d8f5e", showTitle: true },
      views: 58000,
      favorites: 160,
      comments: 4,
    },
  ],
  episodes: [
    { id: "sample_ep_1", workId: "sample_work", episodeNo: 1, title: "프롤로그", status: "published", isPaid: false, price: 0, views: 12200, updatedAt: "2026-05-26T00:00:00.000Z" },
    { id: "sample_ep_2", workId: "sample_work", episodeNo: 2, title: "첫 번째 문장", status: "published", isPaid: false, price: 0, views: 11500, updatedAt: "2026-05-26T00:00:00.000Z" },
    { id: "sample_ep_3", workId: "sample_work", episodeNo: 3, title: "닫힌 문", status: "queued", isPaid: true, price: 100, views: 0, updatedAt: "2026-05-26T00:00:00.000Z" },
  ],
};

const recommendationSeed = [
  {
    id: "rec_1",
    title: "주의! 딸기맛 토끼 취식 금지",
    author: "알람끄고자요",
    genre: "무료 연재 · 20화",
    description: "가벼운 금지문에서 시작해 이상한 세계로 번지는 추천 작품입니다.",
    tags: ["금지문", "성장", "회귀", "선택"],
    cover: { color: "#f2efe7", text: "딸기맛 토끼" },
    stats: "조회 3만 · 댓글/리뷰 48",
  },
  {
    id: "rec_2",
    title: "악역이 임신을 숨김",
    author: "쁘띠사료",
    genre: "무료 연재 · 24화",
    description: "다른 독자가 선호한 작품 예시입니다.",
    tags: ["빙의", "오해", "관계"],
    cover: { color: "#111111", text: "악역이 임신을 숨김" },
    stats: "조회 41만 · 댓글/리뷰 364",
  },
];

let activeTab = "chapters";
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

function state() {
  const saved = readJson(STORAGE_KEY, null);
  if (!saved || !Array.isArray(saved.works)) return fallbackState;
  saved.users ||= fallbackState.users;
  saved.episodes ||= [];
  return saved;
}

function selectedWork(data) {
  const params = new URLSearchParams(location.search);
  const workId = params.get("workId");
  return data.works.find((work) => work.id === workId) || data.works[0] || fallbackState.works[0];
}

function workEpisodes(data, workId) {
  return data.episodes
    .filter((episode) => episode.workId === workId)
    .sort((a, b) => Number(b.episodeNo || 0) - Number(a.episodeNo || 0));
}

function officialNickname(data) {
  return data.users?.[0]?.officialNickname || "작가";
}

function usesOfficialName(work) {
  return !work.temporaryAuthorNickname;
}

function authorName(data, work) {
  return work.temporaryAuthorNickname || officialNickname(data);
}

function typeText(type) {
  return type === "interactive" ? "갈래글" : "일반글";
}

function twoDigit(value, fallback = "00") {
  return String(value ?? fallback).padStart(2, "0").slice(-2);
}

function releaseSchedule(work) {
  const settings = work.releaseSettings || {};
  const weekdayOrder = ["월", "화", "수", "목", "금", "토", "일"];
  const selectedDays = weekdayOrder.filter((day) => Array.isArray(settings.days) && settings.days.includes(day));
  return {
    method: settings.method || "irregular",
    selectedDays,
    time: `${twoDigit(settings.hour, "18")}:${twoDigit(settings.minute, "00")}`,
  };
}

function renderReleaseSchedule(work) {
  const schedule = releaseSchedule(work);
  if (schedule.method !== "regular") {
    return `<div class="release-schedule irregular" aria-label="연재 방식"><span>비정기연재</span></div>`;
  }
  const dayChips = schedule.selectedDays.length
    ? schedule.selectedDays.map((day) => `<span class="weekday-chip">${esc(day)}</span>`).join("")
    : `<span class="weekday-chip muted">요일미정</span>`;
  return `<div class="release-schedule regular" aria-label="정기연재 일정">
    <strong>정기연재</strong>
    <div class="weekday-chip-row">${dayChips}</div>
    <time>${esc(schedule.time)}</time>
  </div>`;
}

function compactNumber(value) {
  const number = Number(value || 0);
  if (number >= 10000) return `${(number / 10000).toFixed(number >= 100000 ? 0 : 1)}만`;
  return number.toLocaleString("ko-KR");
}

function formatDate(value) {
  const date = new Date(value || Date.now());
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10).replaceAll("-", ".");
}

function coverStyle(cover = {}) {
  if (cover.mode === "image" && cover.imageData) return `background-color:#fff; background-image:url('${esc(cover.imageData)}')`;
  return `background:${esc(cover.color || "#47645e")}`;
}

function tagList(tags = [], hasSensitiveTags = false) {
  const visibleTags = (tags.length ? tags : ["태그없음"]).map((tag) => `<span class="tag">${esc(tag)}</span>`).join("");
  const sensitiveButton = hasSensitiveTags ? `<button class="tag sensitive-chip" type="button" data-sensitive-toggle>민감태그</button>` : "";
  return `${visibleTags}${sensitiveButton}`;
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 1800);
}

function firstPublished(episodes) {
  return [...episodes].reverse().find((episode) => episode.status === "published") || episodes[episodes.length - 1] || null;
}

function siblingWorks(data, work) {
  if (!usesOfficialName(work)) return [];
  return data.works.filter((item) => item.id !== work.id && item.userId === work.userId && usesOfficialName(item));
}

function tailoredRecommendations(data, work) {
  const byGenre = data.works
    .filter((item) => item.id !== work.id)
    .filter((item) => item.genre1 === work.genre1 || item.genre2 === work.genre2)
    .slice(0, 4);
  return [...byGenre, ...recommendationSeed].slice(0, 6);
}

function latestManualNotice(data, work) {
  const noticeLinks = Array.isArray(data.workNotices) ? data.workNotices.filter((notice) => notice.workId === work.id) : [];
  const templates = Array.isArray(data.noticeTemplates) ? data.noticeTemplates : [];
  const notices = noticeLinks
    .map((link) => {
      const template = templates.find((item) => item.noticeCode === link.noticeCode);
      return template ? { ...template, linkedAt: link.updatedAt || link.createdAt } : null;
    })
    .filter(Boolean)
    .filter((notice) => !notice.isAutoGenerated && notice.noticeType !== "autoDelay")
    .sort((a, b) => new Date(b.updatedAt || b.createdAt || b.linkedAt || 0) - new Date(a.updatedAt || a.createdAt || a.linkedAt || 0));
  return notices[0] || null;
}

function latestReview(work) {
  const reviews = Array.isArray(work.reviews) ? work.reviews : [];
  return reviews
    .filter((review) => !review.episodeId)
    .sort((a, b) => new Date(b.createdAt || b.updatedAt || 0) - new Date(a.createdAt || a.updatedAt || 0))[0] || null;
}

function iconSvg(name) {
  const icons = {
    alpha: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4h10a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3Z"/><path d="M8 14.5 11.6 8h.9l3.5 6.5"/><path d="M9.4 12.4h5.2"/></svg>`,
    notice: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h14v16H5z"/><path d="M8 8h8"/><path d="M8 12h8"/><path d="M8 16h5"/></svg>`,
    review: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5h14v10H8l-3 3z"/><path d="M8 9h8"/><path d="M8 12h5"/></svg>`,
    bookmark: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4h10v16l-5-3.2L7 20z"/></svg>`,
  };
  return icons[name] || icons.alpha;
}

function renderHero(data, work) {
  const tags = work.normalTags || [];
  return `<strong class="mobile-work-title">${esc(work.title)}</strong>
  <section class="joara-hero">
    <div class="blur-backdrop" style="${coverStyle(work.cover)}"></div>
    <div class="cover-center">
      <div class="book-cover ${work.cover?.showTitle === false ? "no-title" : ""}" style="${coverStyle(work.cover)}">${work.cover?.showTitle === false ? "" : esc(work.title)}</div>
    </div>
  </section>
  <section class="work-summary">
    <div class="category-row">
      <span>${esc(work.genre1 || "기타")} · ${esc(work.genre2 || "글")} · ${typeText(work.type)}</span>
      <a href="#" data-empty>${work.isPaidWork ? "구매 테스트" : "무료 작품"}</a>
    </div>
    ${renderReleaseSchedule(work)}
    <h1>${esc(work.title)}</h1>
    <p class="author">${esc(authorName(data, work))}</p>
    <div class="stat-row" aria-label="작품 통계">
      <span>조회 ${compactNumber(work.views)}</span>
      <span>선호 ${compactNumber(work.favorites)}</span>
      <span>댓글/리뷰 ${compactNumber(work.comments)}</span>
    </div>
    <div class="tag-strip">${tagList(tags, Boolean(work.sensitiveTags?.length))}</div>
    <div class="description-box" id="descriptionBox">
      <p>${esc(work.description || "작품 소개가 없습니다.")}</p>
      <button type="button" data-description-toggle>더보기</button>
    </div>
    <button class="promo-row alpha-row" type="button" data-empty><span>${iconSvg("alpha")}</span><strong>알파테스트</strong><em>충전 숲결로 구매 흐름을 테스트할 수 있습니다.</em><b>›</b></button>
    <button class="favorite-button" type="button" data-favorite><span>${iconSvg("bookmark")}</span><strong>선호작품</strong></button>
  </section>`;
}

function renderNoticeAndReview(data, work) {
  const notice = latestManualNotice(data, work);
  const review = latestReview(work);
  const noticeDate = notice ? formatDate(notice.updatedAt || notice.createdAt || notice.linkedAt) : "";
  const rows = `${notice ? `<button class="promo-row notice-summary-row" type="button" data-empty><span>${iconSvg("notice")}</span><strong>공지</strong><em><span class="notice-title-text">${esc(notice.title || "공지")}</span>${noticeDate ? `<time>${noticeDate}</time>` : ""}</em><b>›</b></button>` : ""}
    ${review ? `<button class="promo-row" type="button" data-review-more><span>${iconSvg("review")}</span><strong>최신 리뷰</strong><em>${esc(review.body || "리뷰")}</em><b>›</b></button>` : ""}`;
  return rows.trim() ? `<section class="summary-links">${rows}</section>` : "";
}

function renderMobileInfoPanel(work) {
  return `<section class="tab-panel info-tab-panel">
    <div class="info-card">
      <h2>줄거리</h2>
      <div class="description-box expanded mobile-info-description">
        <p>${esc(work.description || "작품 소개가 없습니다.")}</p>
      </div>
    </div>
    <div class="info-card">
      <h2>태그</h2>
      <div class="tag-strip">${tagList(work.normalTags || [], Boolean(work.sensitiveTags?.length))}</div>
    </div>
    <div class="info-card">
      <h2>작품 정보</h2>
      <dl class="work-info-list">
        <div><dt>유형</dt><dd>${typeText(work.type)}</dd></div>
        <div><dt>장르</dt><dd>${esc(work.genre1 || "기타")} · ${esc(work.genre2 || "기타")}</dd></div>
        <div><dt>연재</dt><dd>${releaseSchedule(work).method === "regular" ? "정기연재" : "비정기연재"}</dd></div>
        <div><dt>이용</dt><dd>${work.isPaidWork ? "유료 작품" : "무료 작품"}</dd></div>
      </dl>
    </div>
  </section>`;
}

function noticeRows(data, work) {
  const manual = latestManualNotice(data, work);
  const schedule = releaseSchedule(work);
  const autoScheduleNotice = {
    title: schedule.method === "regular" ? "연재일 안내" : "비정기 연재 안내",
    date: new Date().toISOString(),
    body: schedule.method === "regular" ? `정기 연재 일정은 ${schedule.selectedDays.join(", ") || "요일 미정"} ${schedule.time}입니다.` : "이 작품은 비정기 연재 작품입니다.",
    auto: true,
  };
  return [manual, autoScheduleNotice].filter(Boolean);
}

function renderNewsPanel(data, work) {
  const rows = noticeRows(data, work)
    .map(
      (notice) => `<article class="notice-card">
        <div>
          <span>${notice.auto ? "자동" : "안내"}</span>
          <strong>${esc(notice.title || "공지")}</strong>
        </div>
        <time>${formatDate(notice.updatedAt || notice.createdAt || notice.date)}</time>
      </article>`,
    )
    .join("");
  return `<section class="tab-panel news-tab-panel">${rows || `<div class="empty">등록된 소식이 없습니다.</div>`}</section>`;
}

function visibleCommentItems(work) {
  const reviews = (Array.isArray(work.reviews) ? work.reviews : []).map((item) => ({ ...item, kind: item.episodeId ? "comment" : "review" }));
  const fallback = [
    { id: "review_sample", kind: "review", author: "테스트독자", body: "작품 분위기가 좋아서 다음 회차가 궁금합니다.", createdAt: new Date().toISOString(), spoiler: false },
    { id: "comment_sample", kind: "comment", author: "회차독자", body: "첫 화의 선택지가 인상적이었습니다.", createdAt: new Date().toISOString(), spoiler: false },
  ];
  return (reviews.length ? reviews : fallback)
    .filter((item) => !item.spoiler && !item.isSpoiler && item.visible !== false)
    .sort((a, b) => new Date(b.createdAt || b.updatedAt || 0) - new Date(a.createdAt || a.updatedAt || 0));
}

function renderCommentsPanel(work) {
  const rows = visibleCommentItems(work)
    .map(
      (item) => `<article class="comment-card">
        <div class="comment-avatar" aria-hidden="true"></div>
        <div>
          <div class="comment-head">
            <strong>${esc(item.author || "독자")}</strong>
            <span>${item.kind === "review" ? "리뷰" : "댓글"}</span>
            <time>${formatDate(item.createdAt || item.updatedAt)}</time>
          </div>
          <p>${esc(item.body || item.content || "내용이 없습니다.")}</p>
        </div>
      </article>`,
    )
    .join("");
  return `<section class="tab-panel comments-tab-panel">
    <div class="comment-tools"><strong>전체 ${compactNumber(rows ? visibleCommentItems(work).length : 0)}</strong><span>볼 수 있는 댓글/리뷰만 표시</span></div>
    ${rows || `<div class="empty">표시할 댓글/리뷰가 없습니다.</div>`}
  </section>`;
}

function renderReadCta() {
  return `<div class="bottom-cta">
    <button type="button" data-first-read>1화 무료보기</button>
    <button type="button" data-continue-read>이어보기</button>
  </div>`;
}

function renderSensitivePopup(work) {
  if (!work.sensitiveTags?.length) return "";
  return `<div class="sensitive-popup hidden" id="sensitivePopup" role="dialog" aria-modal="true" aria-labelledby="sensitivePopupTitle">
    <div class="sensitive-panel">
      <div>
        <strong id="sensitivePopupTitle">민감태그</strong>
        <button type="button" data-sensitive-close aria-label="닫기">×</button>
      </div>
      <p>이 작품에 등록된 민감태그입니다.</p>
      <div class="sensitive-list">${work.sensitiveTags.map((tag) => `<span>${esc(tag)}</span>`).join("")}</div>
    </div>
  </div>`;
}

function renderTabs(data, work) {
  return `<nav class="content-tabs" aria-label="작품 내용">
    <button type="button" class="${activeTab === "chapters" ? "active" : ""}" data-tab="chapters">회차</button>
    <button type="button" class="${activeTab === "info" ? "active" : ""}" data-tab="info">정보</button>
    <button type="button" class="${activeTab === "news" ? "active" : ""}" data-tab="news">소식</button>
    <button type="button" class="${activeTab === "comments" ? "active" : ""}" data-tab="comments">댓글</button>
  </nav>`;
}

function episodePaymentLabel(episode) {
  return episode.isPaid ? "구매" : "무료";
}

function renderChapters(work, episodes) {
  const visibleEpisodes = episodes.filter((episode) => episode.status === "published");
  const rows = visibleEpisodes.length
    ? visibleEpisodes
        .map(
          (episode) => `<article class="chapter-row">
        <div>
          <strong>${work.type === "interactive" ? esc(episode.title || "선택지") : `${Number(episode.episodeNo || 0)}화`}</strong>
          <p>${compactNumber(episode.views || work.views || 0)} · ${formatDate(episode.updatedAt || episode.publishAt)}</p>
        </div>
        <button type="button" data-episode-id="${esc(episode.id)}"><span>↓</span>${episodePaymentLabel(episode)}</button>
      </article>`,
        )
        .join("")
    : `<div class="empty">공개된 회차가 없습니다.</div>`;
  return `<section class="tab-panel">
    <div class="chapter-tools">
      <button type="button" data-empty>선택구매</button>
      <button type="button" data-empty>빠른구매</button>
      <span>최신순 · 1화부터</span>
    </div>
    ${rows}
  </section>`;
}

function workCard(data, work) {
  const tags = (work.normalTags || []).slice(0, 4);
  return `<a class="related-card" href="./phase3_work_home.html?workId=${encodeURIComponent(work.id)}">
    <div class="related-cover" style="${coverStyle(work.cover)}">${work.cover?.showTitle === false ? "" : esc(work.title)}</div>
    <div>
      <p>${esc(work.genre1 || "기타")} · ${typeText(work.type)}</p>
      <strong>${esc(work.title)}</strong>
      <span>${esc(authorName(data, work))}</span>
      <em>${esc(work.description || "작품 소개가 없습니다.")}</em>
      <div class="mini-stat">조회 ${compactNumber(work.views)} · 선호 ${compactNumber(work.favorites)} · 댓글/리뷰 ${compactNumber(work.comments)}</div>
      <div class="mini-tags">${tagList(tags)}</div>
    </div>
  </a>`;
}

function recommendationCard(item) {
  return `<a class="related-card" href="./phase3_work_home.html">
    <div class="related-cover" style="background:${esc(item.cover.color)}">${esc(item.cover.text)}</div>
    <div>
      <p>${esc(item.genre)}</p>
      <strong>${esc(item.title)}</strong>
      <span>${esc(item.author)}</span>
      <em>${esc(item.description)}</em>
      <div class="mini-stat">${esc(item.stats)}</div>
      <div class="mini-tags">${tagList(item.tags)}</div>
    </div>
  </a>`;
}

function renderAuthorWorks(data, work) {
  if (!usesOfficialName(work)) {
    return `<section class="tab-panel"><div class="info-box">임시 닉네임 작품은 작가의 다른 작품 대신 맞춤추천을 보여줍니다.</div>${renderRecommendations(data, work, true)}</section>`;
  }
  const list = siblingWorks(data, work);
  return `<section class="tab-panel">${list.length ? list.map((item) => workCard(data, item)).join("") : `<div class="empty">공식 닉네임으로 공개된 다른 작품이 없습니다.</div>`}</section>`;
}

function renderRecommendations(data, work, compact = false) {
  const cards = tailoredRecommendations(data, work)
    .map((item) => (item.cover?.text ? recommendationCard(item) : workCard(data, item)))
    .join("");
  return `${compact ? "" : `<section class="tab-panel"><div class="info-box">장르와 작품 형식이 비슷한 작품을 추천합니다.</div>`}${cards || `<div class="empty">추천 작품이 없습니다.</div>`}${compact ? "" : `</section>`}`;
}

function renderActiveTab(data, work, episodes) {
  if (activeTab === "info") return renderMobileInfoPanel(work);
  if (activeTab === "news") return renderNewsPanel(data, work);
  if (activeTab === "comments") return renderCommentsPanel(work);
  return renderChapters(work, episodes);
}

function renderRails(data) {
  if (!$("#recentList") || !$("#favoriteUpdateList")) return;
  const works = data.works || [];
  const recent = works.slice(0, 3);
  const favoriteUpdates = works.filter((work) => work.status !== "completed").slice(0, 3);
  $("#recentList").innerHTML = recent
    .map((work) => `<a class="rail-item" href="./phase3_work_home.html?workId=${encodeURIComponent(work.id)}"><strong>${esc(work.title)}</strong><span>${esc(authorName(data, work))} · 최근 읽음</span></a>`)
    .join("");
  $("#favoriteUpdateList").innerHTML = favoriteUpdates
    .map((work) => `<a class="rail-item" href="./phase3_work_home.html?workId=${encodeURIComponent(work.id)}"><strong>${esc(work.title)}</strong><span>${esc(authorName(data, work))} · ${releaseSchedule(work).method === "regular" ? "정기연재" : "비정기연재"}</span></a>`)
    .join("");
}

function render() {
  const data = state();
  const work = selectedWork(data);
  const episodes = workEpisodes(data, work.id);
  document.title = `${work.title} - 숲글:숲갈래글 (알파테스트:0.0.6)`;
  $("#workHomeApp").innerHTML = `${renderHero(data, work)}
    ${renderNoticeAndReview(data, work)}
    ${renderReadCta()}
    ${renderTabs(data, work)}
    <div id="tabContent">${renderActiveTab(data, work, episodes)}</div>
    ${renderSensitivePopup(work)}`;
  renderRails(data);
  bindActions(data, work, episodes);
}

function bindActions(data, work, episodes) {
  $$("[data-tab]").forEach((button) =>
    button.addEventListener("click", () => {
      activeTab = button.dataset.tab;
      render();
    }),
  );
  $("[data-description-toggle]")?.addEventListener("click", (event) => {
    const box = $("#descriptionBox");
    box?.classList.toggle("expanded");
    event.currentTarget.textContent = box?.classList.contains("expanded") ? "접기" : "더보기";
  });
  $("[data-sensitive-toggle]")?.addEventListener("click", () => $("#sensitivePopup")?.classList.remove("hidden"));
  $("[data-sensitive-close]")?.addEventListener("click", () => $("#sensitivePopup")?.classList.add("hidden"));
  $("#sensitivePopup")?.addEventListener("click", (event) => {
    if (event.target.id === "sensitivePopup") event.currentTarget.classList.add("hidden");
  });
  $("[data-review-more]")?.addEventListener("click", () => showToast("리뷰/댓글 전체 페이지는 다음 단계에서 연결합니다."));
  $("[data-favorite]")?.addEventListener("click", () => {
    const favorites = readJson(FAVORITE_KEY, []);
    writeJson(FAVORITE_KEY, favorites.includes(work.id) ? favorites : [...favorites, work.id]);
    showToast("선호작품에 등록했습니다.");
  });
  $("[data-first-read]")?.addEventListener("click", () => {
    const first = firstPublished(episodes);
    if (!first) return showToast("아직 공개된 회차가 없습니다.");
    writeJson(LAST_READ_KEY, { workId: work.id, episodeId: first.id });
    showToast(`${first.title || "1화"}로 이동합니다.`);
  });
  $("[data-continue-read]")?.addEventListener("click", () => {
    const saved = readJson(LAST_READ_KEY, null);
    const episode = episodes.find((item) => item.id === saved?.episodeId && item.status === "published") || firstPublished(episodes);
    if (!episode) return showToast("아직 공개된 회차가 없습니다.");
    writeJson(LAST_READ_KEY, { workId: work.id, episodeId: episode.id });
    showToast(`${episode.title || "회차"}로 이동합니다.`);
  });
  $$("[data-episode-id]").forEach((button) =>
    button.addEventListener("click", () => {
      const episode = episodes.find((item) => item.id === button.dataset.episodeId);
      if (!episode) return;
      writeJson(LAST_READ_KEY, { workId: work.id, episodeId: episode.id });
      showToast(`${episode.title || "회차"}로 이동합니다.`);
    }),
  );
  $$("[data-empty]").forEach((button) =>
    button.addEventListener("click", (event) => {
      event.preventDefault();
      showToast("알파테스트 준비 중 기능입니다.");
    }),
  );
}

render();

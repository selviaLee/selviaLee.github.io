import { addFreeGold, formatWalletGold, normalizeWalletSession } from "./currency_wallet.js";

const SESSION_KEY = "supgeul_phase2_alpha_session";
const PROGRESS_KEY = "supgeul_site_help_guides_v1";
const REWARD_GOLD = 500;

let activeRole = new URLSearchParams(location.search).get("role") === "author" ? "author" : "reader";
let activeLessonId = "";
let toastTimer = null;
let stopReadingReward = null;

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const guideData = {
  author: {
    label: "작가 가이드",
    summary: "글을 올리기 전에 꼭 알아야 하는 쉬운 사용법입니다.",
    lessons: [
      {
        id: "author-work-basics",
        title: "작품 만들 때 처음 정하는 것",
        excerpt: "제목, 소개, 장르, 글 종류를 먼저 정하면 독자가 작품을 쉽게 찾습니다.",
        sections: [
          ["가장 먼저 정할 것", "작품을 만들 때는 제목, 소개, 장르, 글 종류를 먼저 정하세요. 이 정보가 홈 목록과 작품홈에 그대로 보입니다."],
          ["글 종류 고르기", "갈래글은 독자가 선택지를 고르는 글입니다. 일반글은 회차를 순서대로 읽는 글입니다. 처음에 맞게 골라야 뒤에서 헷갈리지 않습니다."],
          ["조심할 점", "민감한 내용에는 트리거워닝을 포함해 독자가 미리 알아야 할 내용을 적습니다. 검색에 걸릴 수 있으니 쿠션이 필요한 말은 일반 태그가 아니라 민감태그로 넣어주세요."],
        ],
        checklist: ["제목은 한눈에 알기 쉽게 쓰기", "갈래글인지 일반글인지 먼저 고르기", "쿠션이 필요한 말은 민감태그로 넣기"],
      },
      {
        id: "author-name-cover",
        title: "작가 이름과 표지 보여주기",
        excerpt: "독자가 작품을 기억할 수 있게 이름과 표지를 깔끔하게 보여줍니다.",
        sections: [
          ["가장 중요한 것", "독자는 제목, 작가 이름, 표지를 보고 작품을 기억합니다. 이 셋은 보기 쉽게 적고 보여줘야 합니다."],
          ["작가 이름 쓰기", "기본 작가 이름을 쓸 수도 있고, 이 작품에서만 쓰는 이름을 따로 넣을 수도 있습니다. 작품마다 다른 이름을 쓰면 독자가 다른 작가로 볼 수 있습니다."],
          ["표지 고르기", "표지는 작품 분위기를 처음 보여주는 그림입니다. 로맨스인지, 판타지인지, 무거운 이야기인지 독자가 바로 느낄 수 있는 표지를 고르세요."],
        ],
        checklist: ["독자가 볼 작가 이름 확인하기", "작품 분위기와 맞는 표지 고르기", "제목과 표지가 서로 다른 느낌을 주지 않는지 보기"],
      },
      {
        id: "author-release-queue",
        title: "언제 공개할지 정하기",
        excerpt: "정해진 요일에 올릴지, 필요할 때 직접 올릴지 정합니다.",
        sections: [
          ["두 가지 방법", "정기연재는 월요일, 수요일처럼 정한 날과 시간에 올리는 방식입니다. 비정기연재는 작가가 필요할 때 직접 올리는 방식입니다."],
          ["회차 상태 알기", "임시저장은 아직 쓰는 중인 글입니다. 대기열은 공개를 기다리는 글입니다. 공개된 글만 독자가 볼 수 있습니다."],
          ["조심할 점", "아직 공개하지 않은 글이 독자 화면에 보이면 안 됩니다. 독자에게는 공개한 회차만 보여주세요."],
        ],
        checklist: ["정기연재인지 비정기연재인지 정하기", "임시저장과 공개 상태를 구분하기", "독자에게 보여줄 회차만 공개하기"],
      },
      {
        id: "author-writer-focus",
        title: "새 화 쓰는 화면 쓰기",
        excerpt: "새 화 작성 화면은 글쓰기에 집중하도록 따로 열립니다.",
        sections: [
          ["화면 구조", "가운데에는 글 쓰는 칸이 있습니다. 왼쪽에는 이전 화가 보이고, 오른쪽에는 등장인물과 아이템을 빠르게 추가하는 칸이 있습니다."],
          ["모바일에서는", "휴대폰에서는 글 쓰는 칸을 먼저 보여줍니다. 오른쪽 추가 메뉴는 ... 버튼을 눌러서 엽니다."],
          ["미리보기", "미리보기를 누르면 독자가 보는 화면처럼 확인할 수 있습니다. 작가가 쓰는 칸에서는 글 선택과 복사가 정상으로 됩니다."],
        ],
        checklist: ["가운데 글쓰기 칸에서 본문 쓰기", "오른쪽에서 인물과 아이템 빠르게 추가하기", "올리기 전에 미리보기로 확인하기"],
      },
      {
        id: "author-world-search",
        title: "@와 #로 세계관 불러오기",
        excerpt: "이름은 @, 태그는 #으로 찾습니다. 둘을 섞지 않습니다.",
        sections: [
          ["가장 중요", "@는 이름을 찾을 때 씁니다. #은 태그를 찾을 때 씁니다. 이것만 기억하면 됩니다."],
          ["@ 사용법", "본문에서 @를 치면 인물과 아이템이 뜹니다. 고르면 본문에는 이름만 들어갑니다. 예를 들어 @낡은 열쇠를 고르면 낡은 열쇠만 남습니다."],
          ["# 사용법", "본문에서 #을 치면 태그가 뜹니다. 태그를 고른 뒤 전체, 하나, 선택 중 하나를 고릅니다. 전체는 그 태그에 있는 것을 모두 고르고, 하나는 그중 하나를 자동으로 고르고, 선택은 내가 직접 고릅니다."],
        ],
        checklist: ["이름과 아이템은 @로 찾기", "태그는 #으로 찾기", "@를 골라도 호칭은 본문에 남기지 않기"],
      },
      {
        id: "author-branch-items",
        title: "선택지와 아이템 쓰기",
        excerpt: "갈래글에서 선택지, 장면, 아이템을 넣는 기본 방법입니다.",
        sections: [
          ["아이템은 이렇게", "아이템을 주려면 [[+아이템]]처럼 씁니다. 아이템을 없애려면 [[-아이템]]처럼 씁니다. 짧게 쓰면 오류가 날 수 있습니다."],
          ["태그로 아이템 주기", "같은 태그를 가진 아이템 중 하나만 주고 싶으면 [[+아이템태그 하나]]를 씁니다. 모두 주고 싶으면 [[+아이템태그 전체]]를 씁니다."],
          ["선택지 연결", "[[선택지:]] 안에는 독자가 고를 문장을 넣습니다. 선택 뒤에 보여줄 내용은 [[씬:]]이나 [[엔딩:]]으로 연결합니다."],
        ],
        checklist: ["아이템은 꼭 [[+아이템]], [[-아이템]]처럼 쓰기", "태그는 하나/전체를 분명히 쓰기", "선택지 이름과 씬 이름을 맞추기"],
      },
      {
        id: "author-notice-review",
        title: "공지, 댓글, 리뷰 보기",
        excerpt: "독자에게 보여줄 소식과 독자 반응을 구분합니다.",
        sections: [
          ["공지는 짧게", "작품홈에는 중요한 공지만 짧게 보여줍니다. 긴 공지 내용은 목록에서 바로 펼치지 않습니다."],
          ["댓글과 리뷰 차이", "댓글은 한 회차를 읽고 남기는 말입니다. 리뷰는 작품 전체를 보고 남기는 말입니다."],
          ["스포일러 조심", "중요한 내용이 미리 보이면 독자의 재미가 줄어듭니다. 스포일러가 있으면 스포일러라고 표시해 주세요."],
        ],
        checklist: ["작품홈 공지는 중요한 것만 고르기", "댓글과 리뷰를 구분하기", "스포일러가 있으면 표시하기"],
      },
      {
        id: "author-money-policy",
        title: "숲결과 유료 회차 알기",
        excerpt: "지금 숲결은 실제 돈이 아니라 테스트용 포인트입니다.",
        sections: [
          ["가장 중요", "지금 테스트 기간의 숲결은 실제 돈이 아닙니다. 기능을 시험해 보기 위한 포인트입니다."],
          ["유료 회차", "작품 전체가 유료일 수도 있고, 특정 회차만 유료일 수도 있습니다. 지금은 실제 결제 대신 테스트 숲결로 흐름만 확인합니다."],
          ["절대 하지 않을 것", "카드번호나 결제 비밀번호를 받지 않습니다. 실제로 돈을 내거나 작가에게 돈을 보내는 일도 아직 없습니다."],
        ],
        checklist: ["화면에는 숲결이라고 쓰기", "실제 결제 정보를 받지 않기", "테스트용 포인트라고 분명히 알리기"],
      },
    ],
  },
  reader: {
    label: "독자 가이드",
    summary: "작품을 찾고 읽고 보관하는 쉬운 사용법입니다.",
    lessons: [
      {
        id: "reader-home-search",
        title: "읽을 작품 찾기",
        excerpt: "홈에서 보고 싶은 작품을 찾는 가장 쉬운 방법입니다.",
        sections: [
          ["홈에서 하는 일", "홈은 읽을 작품을 고르는 곳입니다. 전체, 최근 갱신, 갈래글, 일반글 버튼으로 보고 싶은 작품만 볼 수 있습니다."],
          ["작품으로 들어가기", "읽고 싶은 작품 제목을 누르면 작품홈으로 갑니다. 작품홈에서 소개와 회차를 볼 수 있습니다."],
          ["조심할 점", "민감한 내용은 목록에서 바로 다 보여주지 않습니다. 작품홈에서 경고나 버튼으로 확인합니다."],
        ],
        checklist: ["홈에서 작품 제목 누르기", "갈래글과 일반글 필터 써보기", "민감한 내용은 작품홈에서 확인하기"],
      },
      {
        id: "reader-work-home",
        title: "작품홈에서 볼 것",
        excerpt: "작품홈은 작품 소개와 회차를 모아둔 화면입니다.",
        sections: [
          ["가장 먼저 보기", "작품홈에서는 표지, 제목, 작가 이름, 소개, 태그를 볼 수 있습니다. 이 작품이 내 취향인지 먼저 확인하세요."],
          ["회차 보기", "회차 탭에는 지금 읽을 수 있는 공개 회차만 보입니다. 아직 작가가 쓰는 중인 글은 보이지 않습니다."],
          ["소식과 댓글", "소식 탭에는 작가 공지가 있고, 댓글 탭에는 독자 반응이 있습니다. 둘은 다른 공간입니다."],
        ],
        checklist: ["작품 소개 읽기", "회차 탭에서 읽을 회차 고르기", "소식과 댓글 탭 구분하기"],
      },
      {
        id: "reader-reading-flow",
        title: "처음 보기와 이어보기",
        excerpt: "처음 읽을 때와 다시 읽을 때 쓰는 버튼입니다.",
        sections: [
          ["처음 볼 때", "처음 읽는 작품은 1화 무료보기 버튼으로 시작하면 됩니다. 공개된 첫 회차로 이동합니다."],
          ["다시 볼 때", "이어보기는 마지막으로 읽던 곳으로 돌아가는 버튼입니다. 기록이 없으면 처음 읽을 수 있는 회차로 갑니다."],
          ["선호작", "좋아하는 작품은 선호작품으로 저장하세요. 나중에 마이홈에서 다시 찾기 쉽습니다."],
        ],
        checklist: ["처음이면 1화 무료보기 누르기", "읽던 작품은 이어보기 누르기", "좋아하는 작품은 선호작으로 저장하기"],
      },
      {
        id: "reader-branch-play",
        title: "갈래글 읽는 법",
        excerpt: "갈래글은 내가 고른 선택에 따라 이야기가 달라집니다.",
        sections: [
          ["갈래글이란", "갈래글은 중간에 선택지가 나오는 이야기입니다. 내가 무엇을 고르느냐에 따라 다음 장면이 달라질 수 있습니다."],
          ["아이템", "어떤 선택은 아이템이 있어야 고를 수 있습니다. 어떤 장면에서는 새 아이템을 얻거나 잃을 수도 있습니다."],
          ["엔딩", "선택을 따라가다 보면 엔딩에 도착할 수 있습니다. 모은 엔딩은 마이홈에서 다시 볼 수 있습니다."],
        ],
        checklist: ["선택지를 읽고 하나 고르기", "필요한 아이템 확인하기", "도착한 엔딩은 마이홈에서 보기"],
      },
      {
        id: "reader-myhome",
        title: "마이홈에 보관하기",
        excerpt: "내가 읽은 작품과 모은 엔딩을 정리하는 곳입니다.",
        sections: [
          ["마이홈이 하는 일", "마이홈은 내 책장 같은 곳입니다. 읽는 작품, 좋아하는 작품, 모은 엔딩을 볼 수 있습니다."],
          ["개인 카테고리", "내가 보기 편하게 작품을 묶는 이름표입니다. 다른 사람에게 보이는 공식 태그가 아닙니다."],
          ["엔딩 모음", "갈래글에서 모은 엔딩을 다시 볼 수 있습니다. 어떤 선택으로 갔는지도 확인할 수 있습니다."],
        ],
        checklist: ["읽는 작품 목록 확인하기", "개인 카테고리로 정리하기", "엔딩 모음에서 결과 다시 보기"],
      },
      {
        id: "reader-comments-reviews",
        title: "댓글과 리뷰 남기기",
        excerpt: "회차 감상은 댓글, 작품 전체 감상은 리뷰에 가깝습니다.",
        sections: [
          ["댓글", "특정 회차를 읽고 바로 남기는 말입니다. 방금 본 장면에 대한 감상을 적을 때 좋습니다."],
          ["리뷰", "작품 전체가 어땠는지 남기는 긴 감상입니다. 다른 독자가 작품을 고를 때 도움이 됩니다."],
          ["스포일러", "중요한 반전이나 결말을 말할 때는 먼저 스포일러라고 써주세요. 다른 독자의 재미를 지켜주는 약속입니다."],
        ],
        checklist: ["회차 감상은 댓글로 쓰기", "작품 전체 감상은 리뷰로 쓰기", "스포일러는 숨기기"],
      },
      {
        id: "reader-sensitive-safety",
        title: "민감한 내용 확인하기",
        excerpt: "트리거워닝처럼 미리 알고 싶은 내용을 확인합니다.",
        sections: [
          ["민감태그란", "민감태그에는 트리거워닝처럼 읽기 전에 알고 싶은 내용이 들어갑니다. 검색에 걸릴 수 있는 말도 있으니, 보기 전에 직접 확인하세요."],
          ["19금 표시", "어른만 볼 수 있는 작품은 따로 표시합니다. 이 표시는 장르나 재미를 설명하는 태그가 아닙니다."],
          ["신고", "문제가 있는 글이나 댓글을 보면 신고할 수 있습니다. 신고는 운영자가 확인하기 위한 기능입니다."],
        ],
        checklist: ["민감태그 내용을 먼저 확인하기", "19금 표시를 주의해서 보기", "문제가 있으면 신고하기"],
      },
      {
        id: "reader-gold-support",
        title: "숲결과 구매 이해하기",
        excerpt: "지금 숲결은 테스트용입니다. 실제 결제가 아닙니다.",
        sections: [
          ["숲결이란", "숲결은 사이트 안에서 쓰는 포인트입니다. 지금 테스트 기간에는 실제 돈이 아니라 기능 확인용으로 씁니다."],
          ["유료 회차", "어떤 회차는 숲결이 필요할 수 있습니다. 하지만 지금은 실제 결제하지 않고 테스트 흐름만 확인합니다."],
          ["다음화 기다리기", "다음화를 보고 싶을 때 기본 숲결이나 응원 숲결을 보낼 수 있습니다. 응원 숲결을 보낼 때만 익명 선택을 할 수 있습니다."],
        ],
        checklist: ["숲결은 테스트용이라는 점 기억하기", "결제 정보를 입력하지 않기", "응원 숲결과 익명 선택을 구분하기"],
      },
    ],
  },
};

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
  return normalizeWalletSession(readJson(SESSION_KEY, { user: null }));
}

function writeSession(session) {
  writeJson(SESSION_KEY, normalizeWalletSession(session));
  window.dispatchEvent(new CustomEvent("supgeul:shell-session-change", { detail: { source: "help-guide" } }));
}

function isObjectRecord(value) {
  return value && typeof value === "object" && !Array.isArray(value);
}

function rewardAccountKey(session = readSession()) {
  const user = session.user;
  if (!user) return "";
  const directId = user.id || user.userId || user.accountId;
  if (directId) return String(directId);
  return `${user.provider || "local"}:${user.name || user.displayName || "테스트계정"}`;
}

function readProgress() {
  const progress = readJson(PROGRESS_KEY, { completed: {}, completedByAccount: {}, legacyMigratedTo: "" });
  if (!isObjectRecord(progress)) return { completed: {}, completedByAccount: {}, legacyMigratedTo: "" };
  if (!isObjectRecord(progress.completed)) progress.completed = {};
  if (!isObjectRecord(progress.completedByAccount)) progress.completedByAccount = {};
  progress.legacyMigratedTo ||= "";
  return progress;
}

function writeProgress(progress) {
  writeJson(PROGRESS_KEY, progress);
}

function ensureAccountCompleted(progress, accountKey) {
  if (!accountKey) return {};
  const currentCompleted = isObjectRecord(progress.completedByAccount[accountKey]) ? progress.completedByAccount[accountKey] : {};
  if (!progress.legacyMigratedTo && Object.keys(progress.completed).length) {
    progress.completedByAccount[accountKey] = { ...progress.completed, ...currentCompleted };
    progress.legacyMigratedTo = accountKey;
    return progress.completedByAccount[accountKey];
  }
  progress.completedByAccount[accountKey] = currentCompleted;
  return currentCompleted;
}

function allLessons() {
  return [...guideData.author.lessons, ...guideData.reader.lessons];
}

function activeGuide() {
  return guideData[activeRole];
}

function activeLesson() {
  return allLessons().find((lesson) => lesson.id === activeLessonId) || activeGuide().lessons[0];
}

function completedMap(session = readSession()) {
  const accountKey = rewardAccountKey(session);
  if (!accountKey) return {};
  const progress = readProgress();
  const beforeLegacyAccount = progress.legacyMigratedTo;
  const completed = ensureAccountCompleted(progress, accountKey);
  if (progress.legacyMigratedTo !== beforeLegacyAccount) writeProgress(progress);
  return completed;
}

function isCompleted(lessonId, session = readSession()) {
  return Boolean(completedMap(session)[lessonId]);
}

function formatGold(value) {
  return Number(value || 0).toLocaleString("ko-KR");
}

function showGuideToast(title, detail = "") {
  const toast = $("#guideToast");
  if (!toast) return;
  toast.innerHTML = `<strong>${esc(title)}</strong>${detail ? `<span>${esc(detail)}</span>` : ""}`;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2100);
}

function rewardChipText(done, loggedIn) {
  if (done) return "받음";
  return loggedIn ? `+${REWARD_GOLD}` : "로그인";
}

function rewardStatusText(done, loggedIn) {
  if (done) return "이미 받음";
  return loggedIn ? `끝까지 읽으면 ${REWARD_GOLD}숲결` : `로그인하면 ${REWARD_GOLD}숲결`;
}

function rewardFinishText(done, loggedIn) {
  if (done) return "이 계정에서 이 제목의 보상은 이미 받았습니다.";
  return loggedIn ? `여기까지 읽으면 이 계정에 ${REWARD_GOLD}숲결이 들어갑니다.` : `로그인한 뒤 끝까지 읽으면 이 계정에 ${REWARD_GOLD}숲결이 들어갑니다.`;
}

function visibleAccountGold(session) {
  return rewardAccountKey(session) ? formatWalletGold(session) : "0숲결";
}

function claimReward(lesson) {
  const session = readSession();
  const accountKey = rewardAccountKey(session);
  if (!accountKey) {
    updateRewardUi(lesson.id);
    showGuideToast(`로그인하면 ${REWARD_GOLD}숲결을 받을 수 있어요.`, "보상은 계정에 저장됩니다.");
    return false;
  }

  const progress = readProgress();
  const accountCompleted = ensureAccountCompleted(progress, accountKey);
  if (accountCompleted[lesson.id]) return false;
  accountCompleted[lesson.id] = {
    rewardGold: REWARD_GOLD,
    completedAt: new Date().toISOString(),
    accountKey,
  };
  writeProgress(progress);

  writeSession(addFreeGold(session, REWARD_GOLD));
  updateRewardUi(lesson.id);
  showGuideToast(`${REWARD_GOLD}숲결을 받았습니다.`, "이 계정에서 같은 제목은 한 번만 받을 수 있어요.");
  return true;
}

function updateRewardUi(lessonId) {
  const session = readSession();
  const loggedIn = Boolean(rewardAccountKey(session));
  const completed = completedMap(session);
  $("#guideGoldBalance").textContent = visibleAccountGold(session);
  const rewardScope = $("#guideRewardScope");
  if (rewardScope) rewardScope.textContent = loggedIn ? "이 계정 기준 보상입니다" : "로그인 후 계정에 저장됩니다";
  $$(".guide-lesson-card").forEach((card) => {
    const done = Boolean(completed[card.dataset.lessonId]);
    card.querySelector(".guide-reward-chip").textContent = rewardChipText(done, loggedIn);
    card.querySelector(".guide-reward-chip").classList.toggle("done", done);
  });
  const status = $("#guideStatus");
  if (status && lessonId === activeLesson().id) {
    status.textContent = rewardStatusText(Boolean(completed[lessonId]), loggedIn);
    status.classList.toggle("done", Boolean(completed[lessonId]));
  }
  const finish = $("#guideFinishState");
  if (finish && lessonId === activeLesson().id) {
    finish.textContent = rewardFinishText(Boolean(completed[lessonId]), loggedIn);
  }
}

function lessonListTemplate() {
  const session = readSession();
  const loggedIn = Boolean(rewardAccountKey(session));
  const completed = completedMap(session);
  return activeGuide()
    .lessons.map(
      (lesson) => `<button class="guide-lesson-card ${lesson.id === activeLessonId ? "active" : ""}" type="button" data-lesson-id="${esc(lesson.id)}">
        <span>
          <strong>${esc(lesson.title)}</strong>
          <span>${esc(lesson.excerpt)}</span>
        </span>
        <b class="guide-reward-chip ${completed[lesson.id] ? "done" : ""}">${rewardChipText(Boolean(completed[lesson.id]), loggedIn)}</b>
      </button>`,
    )
    .join("");
}

function guideSectionTemplate(section, index) {
  const labels = ["꼭 기억", "하는 방법", "조심"];
  const tones = ["important", "method", "caution"];
  const [title, body] = section;
  return `<section class="guide-section guide-section-${tones[index] || "method"}">
    <span class="guide-section-tag">${labels[index] || "알아두기"}</span>
    <h3>${esc(title)}</h3>
    <p>${esc(body)}</p>
  </section>`;
}

function lessonDetailTemplate(lesson) {
  const session = readSession();
  const loggedIn = Boolean(rewardAccountKey(session));
  const done = isCompleted(lesson.id, session);
  return `<section class="guide-detail-panel">
    <header class="guide-detail-head">
      <div>
        <div class="guide-meta">
          <span>${esc(activeGuide().label)}</span>
          <span>읽기 보상 ${REWARD_GOLD}숲결</span>
        </div>
        <h2>${esc(lesson.title)}</h2>
        <p>${esc(lesson.excerpt)}</p>
      </div>
      <strong class="guide-status ${done ? "done" : ""}" id="guideStatus">${rewardStatusText(done, loggedIn)}</strong>
    </header>
    <div class="guide-reader" id="guideReader" tabindex="0">
      <article>
        ${lesson.sections
          .map(guideSectionTemplate)
          .join("")}
        <section class="guide-section guide-section-check">
          <span class="guide-section-tag">마지막 확인</span>
          <h3>이것만 해보세요</h3>
          <ul>${lesson.checklist.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>
        </section>
        <div class="guide-finish-box">
          <strong>읽기 완료 지점</strong>
          <span id="guideFinishState">${rewardFinishText(done, loggedIn)}</span>
        </div>
      </article>
    </div>
  </section>`;
}

function renderGuide() {
  const guide = activeGuide();
  if (!activeLessonId || !guide.lessons.some((lesson) => lesson.id === activeLessonId)) {
    activeLessonId = guide.lessons[0].id;
  }
  const session = readSession();
  const loggedIn = Boolean(rewardAccountKey(session));
  $("#guideApp").innerHTML = `<section class="guide-hero">
      <div>
        <p class="guide-kicker">숲글 도움말</p>
        <h1>숲글을 처음 써도 바로 알 수 있게</h1>
        <p>작가와 독자가 자주 쓰는 기능만 쉬운 말로 모았습니다. 로그인한 계정 기준으로 제목 하나를 끝까지 읽으면 한 번만 ${REWARD_GOLD}숲결을 받을 수 있습니다.</p>
      </div>
      <aside class="guide-wallet" aria-label="도움말 보상 지갑">
        <span>현재 보유 숲결</span>
        <strong id="guideGoldBalance">${visibleAccountGold(session)}</strong>
        <span id="guideRewardScope">${loggedIn ? "이 계정 기준 보상입니다" : "로그인 후 계정에 저장됩니다"}</span>
      </aside>
    </section>
    <nav class="guide-mode-row" aria-label="가이드 유형">
      <button type="button" class="${activeRole === "author" ? "active" : ""}" data-guide-role="author">
        <strong>작가 가이드</strong>
        <span>${esc(guideData.author.summary)}</span>
      </button>
      <button type="button" class="${activeRole === "reader" ? "active" : ""}" data-guide-role="reader">
        <strong>독자 가이드</strong>
        <span>${esc(guideData.reader.summary)}</span>
      </button>
    </nav>
    <section class="guide-board">
      <aside class="guide-list-panel">
        <div class="guide-list-head">
          <strong>${esc(guide.label)} 제목 목록</strong>
          <span>${loggedIn ? `제목을 끝까지 읽으면 이 계정에 ${REWARD_GOLD}숲결이 들어갑니다.` : `로그인한 뒤 끝까지 읽으면 이 계정에 ${REWARD_GOLD}숲결이 들어갑니다.`}</span>
        </div>
        <div class="guide-lesson-list">${lessonListTemplate()}</div>
      </aside>
      ${lessonDetailTemplate(activeLesson())}
    </section>
    <div class="guide-toast-anchor" id="guideToast" role="status" aria-live="polite"></div>`;
  bindGuideEvents();
  bindReadingReward(activeLesson());
}

function bindGuideEvents() {
  $$("[data-guide-role]").forEach((button) =>
    button.addEventListener("click", () => {
      activeRole = button.dataset.guideRole;
      activeLessonId = guideData[activeRole].lessons[0].id;
      history.replaceState(null, "", `./site_help_guides.html?role=${activeRole}`);
      renderGuide();
    }),
  );
  $$("[data-lesson-id]").forEach((button) =>
    button.addEventListener("click", () => {
      activeLessonId = button.dataset.lessonId;
      renderGuide();
    }),
  );
}

function bindReadingReward(lesson) {
  if (stopReadingReward) stopReadingReward();
  const reader = $("#guideReader");
  stopReadingReward = null;
  if (!reader || isCompleted(lesson.id)) return;
  let loginPromptShown = false;
  const checkEnd = () => {
    if (isCompleted(lesson.id)) return;
    const style = getComputedStyle(reader);
    const readerScrolls = style.overflowY !== "visible" && reader.scrollHeight > reader.clientHeight + 12;
    const bottomNav = $(".mobile-bottom-nav");
    const bottomNavHeight = bottomNav && getComputedStyle(bottomNav).display !== "none" ? bottomNav.getBoundingClientRect().height : 0;
    const visibleBottom = window.innerHeight - bottomNavHeight + 12;
    const reachedEnd = readerScrolls
      ? reader.scrollTop + reader.clientHeight >= reader.scrollHeight - 12
      : reader.getBoundingClientRect().bottom <= visibleBottom;
    if (!reachedEnd) return;
    const accountKey = rewardAccountKey(readSession());
    if (!accountKey && loginPromptShown) return;
    loginPromptShown = !accountKey;
    claimReward(lesson);
  };
  reader.addEventListener("scroll", checkEnd, { passive: true });
  reader.addEventListener("keydown", () => setTimeout(checkEnd, 0));
  window.addEventListener("scroll", checkEnd, { passive: true });
  window.addEventListener("resize", checkEnd, { passive: true });
  stopReadingReward = () => {
    reader.removeEventListener("scroll", checkEnd);
    window.removeEventListener("scroll", checkEnd);
    window.removeEventListener("resize", checkEnd);
  };
  setTimeout(checkEnd, 350);
}

window.addEventListener("supgeul:shell-session-change", (event) => {
  if (event.detail?.source === "help-guide") return;
  renderGuide();
});

renderGuide();

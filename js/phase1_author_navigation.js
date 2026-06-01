export const navItems = [
  ["dashboard", "내 작품 목록"],
  ["register", "새 작품 등록"],
  ["worlds", "세계관 관리"],
  ["queue", "대기열 관리"],
  ["notices", "공지 관리"],
  ["settings", "작가 작업실 설정"],
];

export const pageLinks = {
  dashboard: "author_work_list.html",
  register: "author_work_register.html",
  worlds: "author_worlds.html",
  queue: "author_queue.html",
  notices: "author_notices.html",
  settings: "author_settings.html",
  editor: "phase1_episode_writer_focus.html",
};

export function readInitialRoute(defaultPage = "dashboard") {
  const params = new URLSearchParams(window.location.search);
  const page = params.get("page") || defaultPage;
  const route = { page };
  params.forEach((value, key) => {
    if (key !== "page") route[key] = value;
  });
  return route;
}

export function linkForPage(page, params = {}) {
  const href = pageLinks[page];
  if (!href) return "";
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") search.set(key, value);
  });
  const query = search.toString();
  return query ? `${href}?${query}` : href;
}

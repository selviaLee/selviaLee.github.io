export const $ = (selector, root = document) => root.querySelector(selector);
export const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

export function esc(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function formData(form) {
  return Object.fromEntries(new FormData(form).entries());
}

export function splitList(value = "") {
  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => (item === item.toLowerCase() ? item.toUpperCase() : item));
}

export function formatDate(value) {
  if (!value) return "없음";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function showModal({ title = "안내", body = "", actions = [] }) {
  const modal = $("#modal");
  $("#modalTitle").textContent = title;
  $("#modalBody").innerHTML = body;
  const actionBox = $("#modalActions");
  actionBox.innerHTML = "";
  const close = () => modal.classList.add("hidden");
  const finalActions = actions.length ? actions : [{ label: "확인", kind: "primary", onClick: close }];

  finalActions.forEach((action) => {
    const button = document.createElement("button");
    button.className = action.kind === "danger" ? "danger-btn" : action.kind === "primary" ? "primary-btn" : "secondary-btn";
    button.textContent = action.label;
    button.addEventListener("click", () => {
      close();
      action.onClick?.();
    });
    actionBox.append(button);
  });
  modal.classList.remove("hidden");
}

export function bindModal() {
  $("#modalClose").addEventListener("click", () => $("#modal").classList.add("hidden"));
  $("#modal").addEventListener("click", (event) => {
    if (event.target.id === "modal") $("#modal").classList.add("hidden");
  });
}

export const statusText = (status) =>
  ({ draft: "습작", serializing: "연재", completed: "완결", queued: "대기열", confirmed: "연재확정", reserved: "연재확정", published: "공개됨" }[status] || status || "없음");

export const typeText = (type) => (type === "interactive" ? "인터랙티브" : "일반");

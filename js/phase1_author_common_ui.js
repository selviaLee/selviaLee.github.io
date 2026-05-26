export function shell(eyebrow, title, actions = "") {
  return `<div class="topbar"><div><p class="eyebrow">${eyebrow}</p><h1>${title}</h1></div><div class="toolbar-right">${actions}</div></div>`;
}

export function statusCounts(works) {
  return {
    serializing: works.filter((work) => work.status === "serializing").length,
    completed: works.filter((work) => work.status === "completed").length,
    draft: works.filter((work) => work.status === "draft").length,
  };
}

export function statusFilterBar(activeStatus, counts, actionName = "status-filter") {
  return `<div class="status-filter-wrap"><div class="status-filter" role="tablist" aria-label="연재 상태 필터">
      ${[
        ["serializing", "연재중"],
        ["completed", "완결"],
        ["draft", "습작"],
      ]
        .map(([value, label]) => `<button type="button" class="${activeStatus === value ? "active" : ""}" data-${actionName}="${value}">${label}(${counts[value]}개)</button>`)
        .join("")}
    </div></div>`;
}

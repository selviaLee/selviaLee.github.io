import { $, $$, esc, showModal, splitList } from "./phase1_ui_helpers.js";

export function bindChoiceCards(root = document) {
  $$(".choice-card", root).forEach((card) => {
    card.addEventListener("click", () => {
      const input = $("input", card);
      if (!input) return;
      input.checked = true;
      $$(`input[name="${input.name}"]`, root).forEach((item) => item.closest(".choice-card")?.classList.toggle("active", item.checked));
    });
  });
}

export function bindHelpDots(root = document) {
  $$("[data-help]", root).forEach((dot) => {
    dot.addEventListener("click", (event) => {
      event.preventDefault();
      showModal({ title: "안내", body: esc(dot.dataset.help) });
    });
  });
}

export function preventEnterSubmit(form) {
  bindTagInputs(form);
  form.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    if (event.target.matches("textarea")) return;
    if (event.target.matches("[data-tag-input]")) {
      event.preventDefault();
      commitTagInput(event.target);
      return;
    }
    if (event.target.matches("input")) event.preventDefault();
  });
}

export function syncCommittedTags(root = document) {
  $$("[data-tag-input]", root).forEach((input) => {
    input.value = currentTagList(input).join(", ");
  });
}

export function bindWorkFieldControls(form) {
  const officialCheckbox = $('input[name="useOfficialNickname"]', form);
  const tempInput = $("[data-temp-nickname]", form);
  const syncNickname = () => {
    if (!officialCheckbox || !tempInput) return;
    tempInput.disabled = officialCheckbox.checked;
    if (officialCheckbox.checked) tempInput.value = "";
  };
  officialCheckbox?.addEventListener("change", syncNickname);
  syncNickname();

  const syncSchedule = () => {
    const method = $('input[name="method"]:checked', form)?.value || "irregular";
    const schedule = $("[data-schedule-row]", form);
    if (schedule) schedule.hidden = method !== "regular";
  };
  $$('input[name="method"]', form).forEach((input) => input.addEventListener("change", syncSchedule));
  syncSchedule();
}

export function bindWorldModeControls(form) {
  const existingRow = $("[data-existing-world-row]", form);
  const worldSelect = $('select[name="worldId"]', form);
  const syncWorldMode = () => {
    const mode = $('input[name="worldMode"]:checked', form)?.value || "new";
    const showExisting = mode === "existing";
    if (existingRow) {
      existingRow.hidden = !showExisting;
      existingRow.classList.toggle("is-gone", !showExisting);
    }
    if (worldSelect) {
      worldSelect.disabled = !showExisting;
      worldSelect.required = showExisting;
    }
  };
  $$('input[name="worldMode"]', form).forEach((input) => input.addEventListener("change", syncWorldMode));
  syncWorldMode();
}

export function bindCoverControls(form) {
  const preview = $("[data-cover-live-preview]", form);
  const titleInput = $('input[name="title"]', form);
  const showTitle = $('input[name="showTitle"]', form);
  const colorInput = $('input[name="coverColor"]', form);
  const colorChoice = $('input[name="coverChoice"][value="custom"]', form);
  const colorSwatch = $("[data-custom-cover-swatch]", form);
  const colorButton = $("[data-cover-color-button]", form);
  const uploadInput = $('input[name="coverUploadFile"]', form);
  const uploadChoice = $('input[name="coverChoice"][value="upload"]', form);
  const imageDataInput = $('input[name="coverImageData"]', form);
  const imageNameInput = $('input[name="coverImageName"]', form);
  const uploadSwatch = $("[data-upload-cover-swatch]", form);
  const readSelectedColor = (checked) => {
    if (checked?.value === "custom") return colorInput?.value || "#47645e";
    return checked?.dataset.color || "#47645e";
  };
  const syncCover = () => {
    const checked = $('input[name="coverChoice"]:checked', form);
    if (colorChoice && colorInput) colorChoice.dataset.color = colorInput.value || "#47645e";
    const color = readSelectedColor(checked);
    const imageData = imageDataInput?.value || "";
    if (preview) {
      preview.style.backgroundColor = color;
      preview.style.backgroundImage = checked?.value === "upload" && imageData ? `url("${imageData}")` : "";
      preview.classList.toggle("no-title", !showTitle?.checked);
      const fallbackTitle = preview.dataset.fallbackTitle || "표지 제목";
      preview.innerHTML = showTitle?.checked ? `<span>${esc(titleInput?.value || fallbackTitle)}</span>` : "";
    }
    if (colorSwatch) colorSwatch.style.background = colorInput?.value || "#47645e";
    if (uploadSwatch) {
      uploadSwatch.style.backgroundImage = imageData ? `url("${imageData}")` : "";
      uploadSwatch.classList.toggle("has-upload", Boolean(imageData));
      uploadSwatch.innerHTML = imageData ? "" : `<span class="plus-mark">+</span>`;
      uploadSwatch.title = imageNameInput?.value || "업로드 이미지";
    }
  };
  $$('input[name="coverChoice"]', form).forEach((input) => input.addEventListener("change", syncCover));
  titleInput?.addEventListener("input", syncCover);
  showTitle?.addEventListener("change", syncCover);
  const applyPickedColor = () => {
    if (colorChoice) colorChoice.checked = true;
    if (colorChoice && colorInput) colorChoice.dataset.color = colorInput.value || "#47645e";
    syncCover();
  };
  colorInput?.addEventListener("input", applyPickedColor);
  colorInput?.addEventListener("change", applyPickedColor);
  colorButton?.addEventListener("click", () => {
    colorChoice.checked = true;
    colorInput?.click();
    syncCover();
  });
  $("[data-cover-upload]", form)?.addEventListener("click", () => uploadInput?.click());
  uploadInput?.addEventListener("change", () => {
    const file = uploadInput.files?.[0];
    uploadChoice.checked = true;
    if (!file) {
      syncCover();
      return;
    }
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      imageDataInput.value = String(reader.result || "");
      imageNameInput.value = file.name;
      syncCover();
    });
    reader.readAsDataURL(file);
  });
  syncCover();
}

function commitTagInput(input) {
  const draft = input.value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  input.dataset.tags = JSON.stringify(splitList([...(currentTagList(input)), ...draft].join(", ")));
  input.value = "";
  renderTagPreview(input);
}

function bindTagInputs(root = document) {
  $$("[data-tag-input]", root).forEach((input) => {
    if (!input.dataset.tags) input.dataset.tags = JSON.stringify(splitList(input.value));
    input.value = "";
    let preview = input.nextElementSibling?.classList?.contains("tag-preview") ? input.nextElementSibling : null;
    if (!preview) {
      preview = document.createElement("div");
      preview.className = "tag-preview tag-row";
      input.insertAdjacentElement("afterend", preview);
    }
    preview.addEventListener("click", (event) => {
      const button = event.target.closest("[data-remove-tag]");
      if (!button) return;
      const removeTag = button.dataset.removeTag;
      input.dataset.tags = JSON.stringify(currentTagList(input).filter((tag) => tag !== removeTag));
      renderTagPreview(input);
    });
    renderTagPreview(input);
  });
}

function renderTagPreview(input) {
  const preview = input.nextElementSibling?.classList?.contains("tag-preview") ? input.nextElementSibling : null;
  if (!preview) return;
  const tags = currentTagList(input);
  preview.innerHTML = tags.map((tag) => `<span class="tag tag-edit-chip">${esc(tag)}<button type="button" aria-label="${esc(tag)} 삭제" data-remove-tag="${esc(tag)}">x</button></span>`).join("");
  input.dataset.committedValue = tags.join(", ");
}

function currentTagList(input) {
  try {
    const tags = JSON.parse(input.dataset.tags || "[]");
    return Array.isArray(tags) ? tags : [];
  } catch {
    return [];
  }
}

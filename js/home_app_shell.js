const SHELL_SESSION_KEY = "supgeul_phase2_alpha_session";

function readShellSession() {
  try {
    return JSON.parse(localStorage.getItem(SHELL_SESSION_KEY)) || { user: null, gold: 0 };
  } catch {
    return { user: null, gold: 0 };
  }
}

function writeShellSession(session) {
  localStorage.setItem(SHELL_SESSION_KEY, JSON.stringify(session));
}

function shellIcon(name) {
  const icons = {
    menu: "menu_branch.svg",
    home: "home_grove.svg",
    paid: "paid_seed.svg",
    free: "free_sprout.svg",
    shop: "shop_basket_leaf.svg",
    library: "book_leaf.svg",
    tag: "tag_leaf.svg",
    ending: "ending_branch.svg",
    studio: "studio_quill_leaf.svg",
    gift: "gift_acorn.svg",
    bell: "bell_flower.svg",
    mail: "mail_bark.svg",
    search: "search_leaf.svg",
  };
  const fileName = icons[name] || icons.home;
  return `<img class="shell-icon-img" src="./assets/icons/forest/${fileName}" alt="" aria-hidden="true" />`;
}

function navItem(href, icon, label, page, activePage) {
  return `<a class="${page === activePage ? "active" : ""}" href="${href}"><span>${shellIcon(icon)}</span>${label}</a>`;
}

function renderMyhomeSidebar() {
  return `<aside class="pc-sidebar myhome-sidebar">
    <nav class="myhome-shortcut-list" aria-label="마이홈 메뉴">
      <a class="myhome-root active" href="#myhome" data-myhome-route="home"><span>${shellIcon("home")}</span>마이홈</a>
      <a class="myhome-sub" href="#reading" data-myhome-route="reading"><span>${shellIcon("library")}</span>읽는 작품</a>
      <a class="myhome-sub" href="#categories" data-myhome-route="categories"><span>${shellIcon("tag")}</span>개인 카테고리</a>
      <a class="myhome-sub" href="#endings" data-myhome-route="endings"><span>${shellIcon("ending")}</span>엔딩 모음</a>
      <a class="myhome-studio-link" href="./author_work_list.html"><span>${shellIcon("studio")}</span>작가작업실 이동</a>
    </nav>
    <button class="left-extension-card" type="button" data-empty-action="테스트 숲결 안내">
      <strong>테스트 숲결</strong>
      <span>가상 재화로 구매 흐름 확인</span>
    </button>
  </aside>`;
}

function renderSidebar(page, navMode) {
  if (navMode === "myhome") return renderMyhomeSidebar();
  return `<aside class="pc-sidebar">
    <nav class="user-shortcut-list" aria-label="홈 바로가기">
      ${navItem("./phase2_alpha_front_home.html", "home", "홈", "home", page)}
      <a id="paidBestShortcut" class="${page === "paidBest" ? "active" : ""}" href="./phase2_best_rankings.html?tab=paid"><span>${shellIcon("paid")}</span>유료 베스트</a>
      <a id="freeBestShortcut" class="${page === "freeBest" ? "active" : ""}" href="./phase2_best_rankings.html?tab=free"><span>${shellIcon("free")}</span>무료 베스트</a>
      ${navItem("./phase7_gold_shop_charge.html", "shop", "숲상점", "shop", page)}
      <span class="nav-divider" aria-hidden="true"></span>
      ${navItem("./phase6_myhome_home.html", "library", "보관함", "library", page)}
      ${navItem("./phase6_myhome_home.html", "library", "마이홈", "myhome", page)}
      ${navItem("./author_work_list.html", "studio", "작가작업실", "studio", page)}
    </nav>
    <button class="left-extension-card" type="button" data-empty-action="왼쪽 확장 슬롯">
      <strong>테스트 숲결</strong>
      <span>가상 재화로 구매 흐름 확인</span>
    </button>
  </aside>`;
}

function renderRightbar(mode) {
  if (mode !== "home") return "";
  return `<aside class="pc-rightbar" aria-label="개인 목록">
    <section class="wallet-card" id="walletCard" aria-label="보유 숲결">
      <div class="wallet-info">
        <span id="walletUserName">로그인이 필요합니다</span>
        <strong id="goldBalance">0숲결</strong>
      </div>
      <button type="button" id="walletChargeButton">충전</button>
    </section>
    <section class="right-section">
      <div class="section-title">최근 본 작품</div>
      <div class="right-work-list" id="recentList"></div>
    </section>
    <section class="right-section">
      <div class="section-title">최근 연재된 내 선호 작품</div>
      <div class="right-work-list" id="favoriteUpdateList"></div>
    </section>
  </aside>`;
}

function shellTemplate({ page, rightMode, navMode }) {
  return `<header class="header">
    <div class="header-left">
      <button class="menu-button" type="button" data-empty-action="전체 메뉴" aria-label="전체 메뉴">${shellIcon("menu")}</button>
      <a class="logo" href="./phase2_alpha_front_home.html">숲글:숲갈래글 (알파테스트:0.0.6)</a>
      <label class="search-wrap">
        <span aria-hidden="true">${shellIcon("search")}</span>
        <input class="search-bar" type="search" placeholder="검색어를 입력하세요." />
      </label>
    </div>
    <div class="header-right">
      <a class="btn-create" id="createWorkButton" href="./author_work_register.html">+ 작품생성</a>
      <div class="icon-group" aria-label="상단 빠른 기능">
        <button type="button" id="chargeGold" aria-label="충전하기">${shellIcon("gift")}</button>
        <button class="notice-icon" type="button" data-empty-action="알림" aria-label="알림">${shellIcon("bell")}<span>4</span></button>
        <button type="button" data-empty-action="쪽지" aria-label="쪽지">${shellIcon("mail")}</button>
      </div>
      <button class="profile-circle" type="button" id="profileEntry" aria-label="로그인 또는 마이 메뉴">로그인</button>
      <div class="profile-menu hidden" id="profileMenu" aria-label="프로필 메뉴">
        <a href="./phase6_myhome_home.html">마이홈</a>
        <a href="./author_work_list.html">작가작업실</a>
        <button type="button" id="logoutUser">로그아웃</button>
      </div>
    </div>
  </header>
  <div class="main-container">
    ${renderSidebar(page, navMode)}
    <main class="content-area" id="shellContent"></main>
    ${renderRightbar(rightMode)}
  </div>
  <nav class="mobile-bottom-nav" aria-label="모바일 메뉴">
    <a class="nav-item ${page === "home" ? "active" : ""}" href="./phase2_alpha_front_home.html"><span class="icon">${shellIcon("home")}</span><span>홈</span></a>
    <a class="nav-item ${page === "paidBest" || page === "freeBest" ? "active" : ""}" href="./phase2_best_rankings.html?tab=paid"><span class="icon">${shellIcon("paid")}</span><span>베스트</span></a>
    <a class="nav-item ${page === "shop" ? "active" : ""}" href="./phase7_gold_shop_charge.html"><span class="icon">${shellIcon("shop")}</span><span>숲상점</span></a>
    <a class="nav-item ${page === "library" || page === "myhome" ? "active" : ""}" href="./phase6_myhome_home.html"><span class="icon">${shellIcon("library")}</span><span>보관함</span></a>
    <button class="nav-item" type="button" id="mobileMyMenu"><span class="nav-profile-circle"></span><span>마이 메뉴</span></button>
  </nav>
  <div class="toast" id="toast" role="status" aria-live="polite"></div>`;
}

function updateShellAccount() {
  const session = readShellSession();
  const loggedIn = Boolean(session.user);
  const profileEntry = document.querySelector("#profileEntry");

  profileEntry?.classList.toggle("logged-in", loggedIn);
  if (profileEntry) {
    profileEntry.textContent = loggedIn ? "" : "로그인";
    profileEntry.setAttribute("aria-label", loggedIn ? "마이 메뉴" : "로그인 또는 회원가입");
  }
  document.querySelector("#createWorkButton")?.classList.toggle("hidden", !loggedIn);
  document.querySelector("#walletCard")?.classList.toggle("is-ghost", !loggedIn);
  if (document.querySelector("#walletUserName")) document.querySelector("#walletUserName").textContent = session.user?.name || "테스트계정";
  if (document.querySelector("#goldBalance")) document.querySelector("#goldBalance").textContent = `${Number(session.gold || 0).toLocaleString("ko-KR")}숲결`;
}

function authNextPath() {
  return encodeURIComponent(location.pathname.split("/").pop() || "phase2_alpha_front_home.html");
}

function bindShellEvents(page) {
  if (page === "home") return;
  document.querySelector("#chargeGold")?.addEventListener("click", () => {
    if (!readShellSession().user) {
      location.href = `./phase2_auth_entry.html?next=${authNextPath()}`;
      return;
    }
    location.href = "./phase7_gold_shop_charge.html";
  });
  document.querySelector("#walletChargeButton")?.addEventListener("click", () => {
    location.href = "./phase7_gold_shop_charge.html";
  });
  document.querySelector("#profileEntry")?.addEventListener("click", () => {
    if (!readShellSession().user) {
      location.href = `./phase2_auth_entry.html?next=${authNextPath()}`;
      return;
    }
    document.querySelector("#profileMenu")?.classList.toggle("hidden");
  });
  document.querySelector("#mobileMyMenu")?.addEventListener("click", () => {
    if (!readShellSession().user) {
      location.href = `./phase2_auth_entry.html?next=${authNextPath()}`;
      return;
    }
    location.href = "./phase6_myhome_home.html";
  });
  document.querySelector("#logoutUser")?.addEventListener("click", () => {
    writeShellSession({ user: null, gold: 0 });
    updateShellAccount();
    document.querySelector("#profileMenu")?.classList.add("hidden");
    window.dispatchEvent(new CustomEvent("supgeul:shell-session-change", { detail: { page } }));
  });
}

function mountHomeShell() {
  const source = document.querySelector("[data-shell-content]");
  if (!source) return;
  const page = document.body.dataset.shellPage || "home";
  const rightMode = document.body.dataset.shellRight || "home";
  const navMode = document.body.dataset.shellNav || "default";
  const fragment = document.createDocumentFragment();
  [...source.childNodes].forEach((node) => fragment.append(node));
  document.body.insertAdjacentHTML("afterbegin", shellTemplate({ page, rightMode, navMode }));
  document.querySelector("#shellContent").append(fragment);
  source.remove();
  updateShellAccount();
  bindShellEvents(page);
}

mountHomeShell();

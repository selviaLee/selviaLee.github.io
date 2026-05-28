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
    menu: `<svg viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></svg>`,
    home: `<svg viewBox="0 0 24 24"><path d="m4 11 8-7 8 7"/><path d="M6.5 10.5V20h11v-9.5"/></svg>`,
    paid: `<svg viewBox="0 0 24 24"><path d="M12 3 5 21h14z"/><path d="M12 9v5"/><path d="M12 17h.01"/></svg>`,
    free: `<svg viewBox="0 0 24 24"><path d="m5 19 14-14"/><path d="M7 5h5v5"/><path d="M12 14h5v5"/></svg>`,
    shop: `<svg viewBox="0 0 24 24"><path d="M5 9h14l-1 11H6z"/><path d="M8 9V6a4 4 0 0 1 8 0v3"/></svg>`,
    library: `<svg viewBox="0 0 24 24"><path d="M5 5h14v15H5z"/><path d="M8 9h8"/><path d="M8 13h8"/></svg>`,
    tag: `<svg viewBox="0 0 24 24"><path d="M4 5v6.5L13.5 21 21 13.5 11.5 4H5a1 1 0 0 0-1 1Z"/><circle cx="8.5" cy="8.5" r="1.2"/></svg>`,
    ending: `<svg viewBox="0 0 24 24"><path d="M7 4h10v6a5 5 0 0 1-10 0z"/><path d="M5 6H3v2a4 4 0 0 0 4 4"/><path d="M19 6h2v2a4 4 0 0 1-4 4"/><path d="M12 15v4"/><path d="M8 21h8"/></svg>`,
    studio: `<svg viewBox="0 0 24 24"><path d="M5 4h14v16H5z"/><path d="M8 8h8"/><path d="M8 12h5"/></svg>`,
    gift: `<svg viewBox="0 0 24 24"><path d="M4 10h16v10H4z"/><path d="M3 6h18v4H3z"/><path d="M12 6v14"/><path d="M12 6c-2-3-6-2.5-5 0 1 2 5 0 5 0Z"/><path d="M12 6c2-3 6-2.5 5 0-1 2-5 0-5 0Z"/></svg>`,
    bell: `<svg viewBox="0 0 24 24"><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg>`,
    mail: `<svg viewBox="0 0 24 24"><path d="M4 6h16v12H4z"/><path d="m4 7 8 6 8-6"/></svg>`,
    search: `<svg viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/></svg>`,
  };
  return icons[name] || icons.home;
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
    <button class="left-extension-card" type="button" data-empty-action="테스트 골드 안내">
      <strong>테스트 골드</strong>
      <span>가상 재화로 구매 흐름 확인</span>
    </button>
  </aside>`;
}

function renderSidebar(page, navMode) {
  if (navMode === "myhome") return renderMyhomeSidebar();
  return `<aside class="pc-sidebar">
    <nav class="user-shortcut-list" aria-label="홈 바로가기">
      ${navItem("./phase2_alpha_front_home.html", "home", "홈", "home", page)}
      ${navItem("./phase2_best_rankings.html?tab=paid", "paid", "유료 베스트", "paidBest", page)}
      ${navItem("./phase2_best_rankings.html?tab=free", "free", "무료 베스트", "freeBest", page)}
      ${navItem("./phase7_gold_shop_charge.html", "shop", "상점", "shop", page)}
      ${navItem("./phase6_myhome_home.html", "library", "보관함", "library", page)}
      ${navItem("./phase6_myhome_home.html", "library", "마이홈", "myhome", page)}
      ${navItem("./author_work_list.html", "studio", "작가작업실", "studio", page)}
    </nav>
    <button class="left-extension-card" type="button" data-empty-action="왼쪽 확장 슬롯">
      <strong>테스트 골드</strong>
      <span>가상 재화로 구매 흐름 확인</span>
    </button>
  </aside>`;
}

function renderRightbar(mode) {
  if (mode !== "home") return "";
  return `<aside class="pc-rightbar" aria-label="개인 목록">
    <section class="wallet-card" id="walletCard" aria-label="보유 골드">
      <div class="wallet-info">
        <span id="walletUserName">로그인이 필요합니다</span>
        <strong id="goldBalance">0골드</strong>
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
    <a class="nav-item ${page === "shop" ? "active" : ""}" href="./phase7_gold_shop_charge.html"><span class="icon">${shellIcon("shop")}</span><span>상점</span></a>
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
  if (document.querySelector("#goldBalance")) document.querySelector("#goldBalance").textContent = `${Number(session.gold || 0).toLocaleString("ko-KR")}골드`;
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

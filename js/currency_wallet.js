export const DISPLAY_GOLD_NAME = "숲결";
export const PAID_GOLD_NAME = "숲결";
export const FREE_GOLD_NAME = "숲결포인트";

const WALLET_VERSION = 2;

function safeObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function safeAmount(value) {
  return Math.max(0, Math.floor(Number(value) || 0));
}

function hasSplitWallet(session) {
  return "paidGold" in session || "freeGold" in session || Number(session.walletVersion || 0) >= WALLET_VERSION;
}

function syncTotal(session) {
  session.gold = safeAmount(session.paidGold) + safeAmount(session.freeGold);
  session.walletVersion = WALLET_VERSION;
  return session;
}

export function normalizeWalletSession(value = {}) {
  const session = { ...safeObject(value) };
  if (hasSplitWallet(session)) {
    session.paidGold = safeAmount(session.paidGold);
    session.freeGold = safeAmount(session.freeGold);
  } else {
    session.paidGold = 0;
    session.freeGold = safeAmount(session.gold);
  }
  session.user ||= null;
  return syncTotal(session);
}

export function formatGoldAmount(value) {
  return safeAmount(value).toLocaleString("ko-KR");
}

export function formatWalletGold(session) {
  return `${formatGoldAmount(normalizeWalletSession(session).gold)}${DISPLAY_GOLD_NAME}`;
}

export function addPaidGold(session, amount) {
  const wallet = normalizeWalletSession(session);
  wallet.paidGold += safeAmount(amount);
  return syncTotal(wallet);
}

export function addFreeGold(session, amount) {
  const wallet = normalizeWalletSession(session);
  wallet.freeGold += safeAmount(amount);
  return syncTotal(wallet);
}

export function spendWalletGold(session, amount) {
  const wallet = normalizeWalletSession(session);
  const cost = safeAmount(amount);
  if (cost <= 0) return { ok: true, session: wallet, usedFreeGold: 0, usedPaidGold: 0 };
  if (wallet.gold < cost) return { ok: false, session: wallet, usedFreeGold: 0, usedPaidGold: 0 };

  const usedFreeGold = Math.min(wallet.freeGold, cost);
  const usedPaidGold = cost - usedFreeGold;
  wallet.freeGold -= usedFreeGold;
  wallet.paidGold -= usedPaidGold;
  return { ok: true, session: syncTotal(wallet), usedFreeGold, usedPaidGold };
}

export function refundPaidGold(session, amount) {
  const wallet = normalizeWalletSession(session);
  const refundAmount = safeAmount(amount);
  if (refundAmount <= 0) return { ok: true, session: wallet, refundedPaidGold: 0 };
  if (wallet.paidGold < refundAmount) return { ok: false, session: wallet, refundedPaidGold: 0 };

  wallet.paidGold -= refundAmount;
  return { ok: true, session: syncTotal(wallet), refundedPaidGold: refundAmount };
}

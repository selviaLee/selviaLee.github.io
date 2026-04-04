
import { auth, db, ensureAnonymousAuth } from "./firebase-config.js";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const params = new URLSearchParams(location.search);
const roomCode = (params.get("code") || localStorage.getItem("mg_room_code") || "").toUpperCase();

const roomCodeText = document.getElementById("roomCodeText");
const copyCodeBtn = document.getElementById("copyCodeBtn");
const myNicknameEl = document.getElementById("myNickname");
const gmNicknameEl = document.getElementById("gmNickname");
const roomStatusEl = document.getElementById("roomStatus");
const participantCountEl = document.getElementById("participantCount");
const participantsList = document.getElementById("participantsList");

const textListInput = document.getElementById("textListInput");
const saveTextsBtn = document.getElementById("saveTextsBtn");
const savedTextsList = document.getElementById("savedTextsList");
const textCountLabel = document.getElementById("textCountLabel");

const gmPanel = document.getElementById("gmPanel");
const startBtn = document.getElementById("startBtn");
const transferBtn = document.getElementById("transferBtn");
const revealBtn = document.getElementById("revealBtn");
const newGameBtn = document.getElementById("newGameBtn");
const destroyBtn = document.getElementById("destroyBtn");

const myTextBox = document.getElementById("myTextBox");
const myRevealState = document.getElementById("myRevealState");
const viewMineBtn = document.getElementById("viewMineBtn");

const revealBadge = document.getElementById("revealBadge");
const revealList = document.getElementById("revealList");

let currentUser = null;
let myNickname = localStorage.getItem("mg_nickname") || "";
let roomData = null;
let participantsCache = [];
let textsCache = [];
let assignmentsCache = [];
let isGM = false;

if (!roomCode) {
  alert("방 코드가 없습니다.");
  location.href = "index.html";
}

roomCodeText.textContent = roomCode;

copyCodeBtn.addEventListener("click", async () => {
  await navigator.clipboard.writeText(roomCode);
  alert("초대코드가 복사되었습니다.");
});

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function statusText(status) {
  if (status === "waiting") return "대기 중";
  if (status === "started") return "진행 중";
  if (status === "revealed") return "전체 공개";
  return "-";
}

function renderParticipants() {
  participantsList.innerHTML = "";
  participantCountEl.textContent = `${participantsCache.length}명`;

  participantsCache.forEach(p => {
    const li = document.createElement("li");
    li.textContent = p.nickname + (p.uid === roomData?.gmUid ? " (방장)" : "");
    participantsList.appendChild(li);
  });
}

function renderTexts() {
  savedTextsList.innerHTML = "";
  textCountLabel.textContent = `${textsCache.length}개 저장됨`;

  textsCache.forEach((t, idx) => {
    const li = document.createElement("li");
    li.textContent = `${idx + 1}. ${t.value}`;
    savedTextsList.appendChild(li);
  });
}

function renderRoomInfo() {
  if (!roomData) return;

  gmNicknameEl.textContent = roomData.gmNickname || "-";
  roomStatusEl.textContent = statusText(roomData.status);

  isGM = currentUser && roomData.gmUid === currentUser.uid;
  gmPanel.classList.toggle("hidden", !isGM);

  if (roomData.revealed) {
    revealBadge.textContent = "공개됨";
    revealBadge.classList.remove("gray");
  } else {
    revealBadge.textContent = "비공개";
    revealBadge.classList.add("gray");
  }
}

function renderRevealList() {
  revealList.innerHTML = "";

  if (!roomData?.revealed) {
    const li = document.createElement("li");
    li.textContent = "아직 전체 공개되지 않았습니다.";
    revealList.appendChild(li);
    return;
  }

  assignmentsCache.forEach((a, idx) => {
    const li = document.createElement("li");
    li.textContent = `${idx + 1}. ${a.nickname} : ${a.text}`;
    revealList.appendChild(li);
  });
}

function renderMyAssignment(showActual = false) {
  const mine = assignmentsCache.find(a => a.uid === currentUser?.uid);
  if (!mine) {
    if (roomData?.status === "waiting") {
      myTextBox.textContent = "아직 시작되지 않았습니다.";
    } else {
      myTextBox.textContent = "내 배정 결과가 없습니다.";
    }
    return;
  }

  if (showActual || roomData?.revealed) {
    myTextBox.textContent = mine.text;
    myRevealState.textContent = "확인 완료";
  } else {
    myTextBox.textContent = "버튼을 눌러 확인하세요.";
  }
}

async function ensureRoomExists() {
  const snap = await getDoc(doc(db, "rooms", roomCode));
  if (!snap.exists()) {
    alert("존재하지 않는 방입니다.");
    location.href = "index.html";
    return false;
  }
  return true;
}

async function markConnected(value) {
  if (!currentUser) return;
  await setDoc(doc(db, "rooms", roomCode, "participants", currentUser.uid), {
    uid: currentUser.uid,
    nickname: myNickname,
    connected: value,
    updatedAt: serverTimestamp()
  }, { merge: true });
}

async function maybeAutoDestroyRoom() {
  const roomRef = doc(db, "rooms", roomCode);
  const roomSnap = await getDoc(roomRef);
  if (!roomSnap.exists()) return;

  const room = roomSnap.data();
  if (room.status !== "revealed") return;

  const partsSnap = await getDocs(collection(db, "rooms", roomCode, "participants"));
  const connectedCount = partsSnap.docs.filter(d => d.data().connected === true).length;

  if (connectedCount === 0) {
    await destroyRoomCompletely(false);
  }
}

async function destroyCollectionDocs(colPath) {
  const snap = await getDocs(collection(db, ...colPath));
  for (const d of snap.docs) {
    await deleteDoc(d.ref);
  }
}

async function destroyRoomCompletely(confirmFirst = true) {
  if (confirmFirst) {
    if (!confirm("정말 방을 폭파하시겠습니까?")) return;
  }

  await destroyCollectionDocs(["rooms", roomCode, "assignments"]);
  await destroyCollectionDocs(["rooms", roomCode, "texts"]);
  await destroyCollectionDocs(["rooms", roomCode, "participants"]);
  await deleteDoc(doc(db, "rooms", roomCode));

  localStorage.removeItem("mg_room_code");
  localStorage.removeItem("mg_nickname");
  alert("방이 삭제되었습니다.");
  location.href = "index.html";
}

async function init() {
  await ensureAnonymousAuth();
  currentUser = auth.currentUser;

  if (!myNickname) {
    myNickname = prompt("닉네임 정보가 없어 다시 입력합니다.");
    if (!myNickname) {
      location.href = "index.html";
      return;
    }
    localStorage.setItem("mg_nickname", myNickname);
  }

  const exists = await ensureRoomExists();
  if (!exists) return;

  myNicknameEl.textContent = myNickname;

  await setDoc(doc(db, "rooms", roomCode, "participants", currentUser.uid), {
    uid: currentUser.uid,
    nickname: myNickname,
    connected: true,
    revealedMine: false,
    joinedAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }, { merge: true });

  const roomRef = doc(db, "rooms", roomCode);

  onSnapshot(roomRef, (snap) => {
    if (!snap.exists()) {
      alert("방이 삭제되었습니다.");
      location.href = "index.html";
      return;
    }
    roomData = snap.data();
    renderRoomInfo();
    renderRevealList();
    renderMyAssignment(false);
  });

  onSnapshot(
    query(collection(db, "rooms", roomCode, "participants"), orderBy("joinedAt")),
    (snap) => {
      participantsCache = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      renderParticipants();
    }
  );

  onSnapshot(
    collection(db, "rooms", roomCode, "texts"),
    (snap) => {
      textsCache = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      textsCache.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      renderTexts();
    }
  );

  onSnapshot(
    collection(db, "rooms", roomCode, "assignments"),
    (snap) => {
      assignmentsCache = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      renderRevealList();
      renderMyAssignment(false);
    }
  );

  window.addEventListener("beforeunload", async () => {
    try {
      await markConnected(false);
      await maybeAutoDestroyRoom();
    } catch (e) {
      console.error(e);
    }
  });
}

saveTextsBtn.addEventListener("click", async () => {
  const lines = textListInput.value
    .split("\n")
    .map(v => v.trim())
    .filter(Boolean);

  if (!lines.length) {
    alert("텍스트를 입력하세요.");
    return;
  }

  await destroyCollectionDocs(["rooms", roomCode, "texts"]);

  for (let i = 0; i < lines.length; i++) {
    await setDoc(doc(collection(db, "rooms", roomCode, "texts")), {
      value: lines[i],
      order: i,
      createdBy: currentUser.uid,
      createdByNickname: myNickname,
      createdAt: serverTimestamp()
    });
  }

  textListInput.value = "";
  await updateDoc(doc(db, "rooms", roomCode), {
    updatedAt: serverTimestamp()
  });

  alert("텍스트가 저장되었습니다.");
});

startBtn.addEventListener("click", async () => {
  if (!isGM) return;

  const partsSnap = await getDocs(collection(db, "rooms", roomCode, "participants"));
  const participants = partsSnap.docs.map(d => d.data());

  const textsSnap = await getDocs(collection(db, "rooms", roomCode, "texts"));
  const texts = textsSnap.docs
    .map(d => d.data())
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  if (participants.length === 0) {
    alert("참가자가 없습니다.");
    return;
  }

  if (participants.length !== texts.length) {
    alert("참가자 수와 텍스트 수가 같아야 합니다.");
    return;
  }

  await destroyCollectionDocs(["rooms", roomCode, "assignments"]);

  const shuffledTexts = shuffle(texts.map(t => t.value));
  const shuffledParticipants = [...participants];

  for (let i = 0; i < shuffledParticipants.length; i++) {
    const p = shuffledParticipants[i];
    await setDoc(doc(db, "rooms", roomCode, "assignments", p.uid), {
      uid: p.uid,
      nickname: p.nickname,
      text: shuffledTexts[i],
      opened: false
    });
  }

  await updateDoc(doc(db, "rooms", roomCode), {
    status: "started",
    revealed: false,
    updatedAt: serverTimestamp()
  });

  alert("텍스트 배정이 완료되었습니다.");
});

viewMineBtn.addEventListener("click", async () => {
  const mine = assignmentsCache.find(a => a.uid === currentUser.uid);
  if (!mine) {
    alert("아직 시작되지 않았거나 배정 결과가 없습니다.");
    return;
  }

  myTextBox.textContent = mine.text;
  myRevealState.textContent = "확인 완료";

  await setDoc(doc(db, "rooms", roomCode, "participants", currentUser.uid), {
    revealedMine: true
  }, { merge: true });

  await setDoc(doc(db, "rooms", roomCode, "assignments", currentUser.uid), {
    opened: true
  }, { merge: true });
});

revealBtn.addEventListener("click", async () => {
  if (!isGM) return;

  await updateDoc(doc(db, "rooms", roomCode), {
    status: "revealed",
    revealed: true,
    updatedAt: serverTimestamp()
  });
});

newGameBtn.addEventListener("click", async () => {
  if (!isGM) return;

  if (!confirm("새 게임을 시작하면 기존 텍스트/배정 결과가 삭제됩니다.")) return;

  await destroyCollectionDocs(["rooms", roomCode, "assignments"]);
  await destroyCollectionDocs(["rooms", roomCode, "texts"]);

  const partsSnap = await getDocs(collection(db, "rooms", roomCode, "participants"));
  for (const p of partsSnap.docs) {
    await setDoc(p.ref, { revealedMine: false }, { merge: true });
  }

  await updateDoc(doc(db, "rooms", roomCode), {
    status: "waiting",
    revealed: false,
    updatedAt: serverTimestamp()
  });

  myTextBox.textContent = "새 게임 준비 중입니다.";
  myRevealState.textContent = "아직 확인 안 함";
  alert("새 게임 상태로 초기화되었습니다.");
});

destroyBtn.addEventListener("click", async () => {
  if (!isGM) return;
  await destroyRoomCompletely(true);
});

transferBtn.addEventListener("click", async () => {
  if (!isGM) return;

  const names = participantsCache
    .filter(p => p.uid !== currentUser.uid)
    .map(p => p.nickname);

  if (!names.length) {
    alert("양도할 참가자가 없습니다.");
    return;
  }

  const targetName = prompt(`방장을 양도할 닉네임을 입력하세요:\n${names.join(", ")}`);
  if (!targetName) return;

  const target = participantsCache.find(p => p.nickname === targetName.trim());
  if (!target) {
    alert("해당 닉네임의 참가자를 찾을 수 없습니다.");
    return;
  }

  await updateDoc(doc(db, "rooms", roomCode), {
    gmUid: target.uid,
    gmNickname: target.nickname,
    updatedAt: serverTimestamp()
  });

  alert("방장이 양도되었습니다.");
});

init();

import { auth, db, ensureAnonymousAuth } from "./firebase-config.js";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const params = new URLSearchParams(location.search);
const mode = params.get("mode") || "join";

const modeLabel = document.getElementById("modeLabel");
const stepDescription = document.getElementById("stepDescription");
const nicknameForm = document.getElementById("nicknameForm");
const nicknameInput = document.getElementById("nicknameInput");
const roomCodeInput = document.getElementById("roomCodeInput");
const codeStep = document.getElementById("codeStep");
const nicknameStep = document.getElementById("nicknameStep");
const submitBtn = document.getElementById("submitBtn");
const checkCodeBtn = document.getElementById("checkCodeBtn");
const goBackBtn = document.getElementById("goBackBtn");

let verifiedJoinCode = "";

function randomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

async function createUniqueRoomCode() {
  for (let i = 0; i < 30; i++) {
    const code = randomCode();
    const snap = await getDoc(doc(db, "rooms", code));
    if (!snap.exists()) return code;
  }
  throw new Error("코드 생성 실패");
}

function setCreateMode() {
  modeLabel.textContent = "새 방 만들기";
  stepDescription.textContent = "닉네임을 입력하고 바로 방을 만듭니다.";
  codeStep.style.display = "none";
  nicknameStep.style.display = "block";
  submitBtn.textContent = "방 만들기";
}

function setJoinModeInitial() {
  modeLabel.textContent = "기존 방 참여하기";
  stepDescription.textContent = "먼저 초대코드를 입력하세요.";
  codeStep.style.display = "block";
  nicknameStep.style.display = "none";
}

function setJoinModeNickname() {
  stepDescription.textContent = "확인된 방입니다. 사용할 닉네임을 입력하세요.";
  codeStep.style.display = "block";
  nicknameStep.style.display = "block";
  submitBtn.textContent = "방 참여하기";
}

if (mode === "create") {
  setCreateMode();
} else {
  setJoinModeInitial();
}

goBackBtn.addEventListener("click", () => {
  location.href = "index.html";
});

checkCodeBtn?.addEventListener("click", async () => {
  const code = roomCodeInput.value.trim().toUpperCase();
  if (!code) {
    alert("초대코드를 입력하세요.");
    return;
  }

  try {
    const roomRef = doc(db, "rooms", code);
    const roomSnap = await getDoc(roomRef);

    if (!roomSnap.exists()) {
      alert("존재하지 않는 방입니다.");
      return;
    }

    verifiedJoinCode = code;
    roomCodeInput.value = code;
    roomCodeInput.readOnly = true;
    setJoinModeNickname();
    nicknameInput.focus();
  } catch (err) {
    console.error(err);
    alert("방 확인 중 오류가 발생했습니다.");
  }
});

nicknameForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const nickname = nicknameInput.value.trim();
  if (!nickname) {
    alert("닉네임을 입력하세요.");
    return;
  }

  try {
    await ensureAnonymousAuth();
    const user = auth.currentUser;

    if (mode === "create") {
      const code = await createUniqueRoomCode();

      await setDoc(doc(db, "rooms", code), {
        code,
        status: "waiting",
        gmUid: user.uid,
        gmNickname: nickname,
        revealed: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      await setDoc(doc(db, "rooms", code, "participants", user.uid), {
        uid: user.uid,
        nickname,
        joinedAt: serverTimestamp(),
        revealedMine: false
      });

      localStorage.setItem("mg_room_code", code);
      localStorage.setItem("mg_nickname", nickname);
      location.href = `room.html?code=${encodeURIComponent(code)}`;
      return;
    }

    if (!verifiedJoinCode) {
      alert("먼저 초대코드를 확인하세요.");
      return;
    }

    const roomRef = doc(db, "rooms", verifiedJoinCode);
    const roomSnap = await getDoc(roomRef);

    if (!roomSnap.exists()) {
      alert("방이 존재하지 않습니다.");
      return;
    }

    const dupQuery = query(
      collection(db, "rooms", verifiedJoinCode, "participants"),
      where("nickname", "==", nickname)
    );
    const dupSnap = await getDocs(dupQuery);

    if (!dupSnap.empty && !dupSnap.docs.some(d => d.id === user.uid)) {
      alert("이미 사용 중인 닉네임입니다.");
      return;
    }

    await setDoc(doc(db, "rooms", verifiedJoinCode, "participants", user.uid), {
      uid: user.uid,
      nickname,
      joinedAt: serverTimestamp(),
      revealedMine: false
    }, { merge: true });

    localStorage.setItem("mg_room_code", verifiedJoinCode);
    localStorage.setItem("mg_nickname", nickname);
    location.href = `room.html?code=${encodeURIComponent(verifiedJoinCode)}`;
  } catch (err) {
    console.error(err);
    alert("처리 중 오류가 발생했습니다.");
  }
});

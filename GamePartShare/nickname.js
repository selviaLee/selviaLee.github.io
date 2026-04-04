
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
const codeArea = document.getElementById("codeArea");
const roomCodeInput = document.getElementById("roomCodeInput");
const nicknameInput = document.getElementById("nicknameInput");
const submitBtn = document.getElementById("submitBtn");

if (mode === "create") {
  modeLabel.textContent = "새 방 만들기";
  codeArea.style.display = "none";
  submitBtn.textContent = "방 만들기";
} else {
  modeLabel.textContent = "기존 방 참여하기";
  codeArea.style.display = "block";
  submitBtn.textContent = "방 참여하기";
}

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

document.getElementById("goBackBtn").addEventListener("click", () => {
  history.back();
});

document.getElementById("nicknameForm").addEventListener("submit", async (e) => {
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
        connected: true,
        revealedMine: false
      });

      localStorage.setItem("mg_room_code", code);
      localStorage.setItem("mg_nickname", nickname);
      location.href = `room.html?code=${encodeURIComponent(code)}`;
      return;
    }

    const code = roomCodeInput.value.trim().toUpperCase();
    if (!code) {
      alert("초대코드를 입력하세요.");
      return;
    }

    const roomRef = doc(db, "rooms", code);
    const roomSnap = await getDoc(roomRef);

    if (!roomSnap.exists()) {
      alert("존재하지 않는 방입니다.");
      return;
    }

    const dupQuery = query(
      collection(db, "rooms", code, "participants"),
      where("nickname", "==", nickname)
    );
    const dupSnap = await getDocs(dupQuery);

    if (!dupSnap.empty && !dupSnap.docs.some(d => d.id === user.uid)) {
      alert("이미 사용 중인 닉네임입니다.");
      return;
    }

    await setDoc(doc(db, "rooms", code, "participants", user.uid), {
      uid: user.uid,
      nickname,
      joinedAt: serverTimestamp(),
      connected: true,
      revealedMine: false
    }, { merge: true });

    localStorage.setItem("mg_room_code", code);
    localStorage.setItem("mg_nickname", nickname);
    location.href = `room.html?code=${encodeURIComponent(code)}`;
  } catch (err) {
    console.error(err);
    alert("처리 중 오류가 발생했습니다.");
  }
});

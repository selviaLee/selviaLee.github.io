import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, doc, setDoc, getDoc, addDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCgCIp8nWIysZDnR1AaJkiWyHRfKL3P9Zs",
  authDomain: "minigame-3e556.firebaseapp.com",
  projectId: "minigame-3e556",
  storageBucket: "minigame-3e556.firebasestorage.app",
  messagingSenderId: "1031382989950",
  appId: "1:1031382989950:web:096f4c0b9f05e147fbac2f"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let currentRoom = null;
let nickname = null;

function randomCode(){
  return Math.random().toString(36).substring(2,8).toUpperCase();
}

document.getElementById("createRoom").onclick = async () => {

  nickname = prompt("닉네임");

  const code = randomCode();

  await setDoc(doc(db,"rooms",code),{
    status:"waiting",
    gm:nickname
  });

  currentRoom = code;

  enterRoom(code);
};

document.getElementById("joinRoom").onclick = () =>{

  nickname = prompt("닉네임");
  const code = prompt("초대코드");

  currentRoom = code;

  enterRoom(code);
};

function enterRoom(code){

  document.getElementById("home").classList.add("hidden");
  document.getElementById("room").classList.remove("hidden");

  document.getElementById("roomCode").innerText = code;

}

document.getElementById("copyCode").onclick = () =>{
  navigator.clipboard.writeText(currentRoom);
  alert("복사됨");
};

document.getElementById("startGame").onclick = ()=>{
  alert("랜덤 배정 로직은 여기서 구현");
};

document.getElementById("viewMine").onclick = ()=>{
  alert("내 텍스트 보기 로직");
};

document.getElementById("revealAll").onclick = ()=>{
  alert("전체 공개");
};

document.getElementById("newGame").onclick = ()=>{
  alert("게임 초기화");
};

document.getElementById("destroyRoom").onclick = ()=>{
  alert("방 삭제");
};

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc, deleteDoc, collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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

let roomId=null;
let nickname=null;

function randomCode(){
 return Math.random().toString(36).substring(2,8).toUpperCase();
}

document.getElementById("createRoom").onclick=async()=>{

 nickname=prompt("닉네임");

 const code=randomCode();

 await setDoc(doc(db,"rooms",code),{
   status:"waiting",
   gm:nickname
 });

 roomId=code;
 enterRoom();
};

document.getElementById("joinRoom").onclick=async()=>{

 nickname=prompt("닉네임");
 const code=prompt("초대코드");

 const ref=doc(db,"rooms",code);
 const snap=await getDoc(ref);

 if(!snap.exists()){
   alert("방 없음");
   return;
 }

 roomId=code;
 enterRoom();
};

function enterRoom(){

 document.getElementById("home").classList.add("hidden");
 document.getElementById("room").classList.remove("hidden");

 document.getElementById("roomCode").innerText=roomId;

 addParticipant();
 loadParticipants();
}

async function addParticipant(){

 await addDoc(collection(db,"rooms",roomId,"participants"),{
   name:nickname
 });

}

async function loadParticipants(){

 const list=document.getElementById("participants");
 list.innerHTML="";

 const snap=await getDocs(collection(db,"rooms",roomId,"participants"));

 snap.forEach(doc=>{
   const li=document.createElement("li");
   li.innerText=doc.data().name;
   list.appendChild(li);
 });

}

document.getElementById("copyCode").onclick=()=>{
 navigator.clipboard.writeText(roomId);
 alert("복사됨");
};

document.getElementById("startGame").onclick=async()=>{

 const texts=document.getElementById("textList").value.split("\n").filter(t=>t.trim()!="");

 const parts=await getDocs(collection(db,"rooms",roomId,"participants"));

 let players=[];
 parts.forEach(p=>players.push(p.data().name));

 if(texts.length!==players.length){
   alert("텍스트 수와 참가자 수가 같아야 합니다");
   return;
 }

 texts.sort(()=>Math.random()-0.5);

 for(let i=0;i<players.length;i++){
   await addDoc(collection(db,"rooms",roomId,"assignments"),{
     player:players[i],
     text:texts[i]
   });
 }

 alert("배정 완료");

};

document.getElementById("viewMine").onclick=async()=>{

 const snap=await getDocs(collection(db,"rooms",roomId,"assignments"));

 snap.forEach(d=>{
   if(d.data().player===nickname){
     document.getElementById("myText").innerText=d.data().text;
   }
 });

};

document.getElementById("revealAll").onclick=async()=>{

 const snap=await getDocs(collection(db,"rooms",roomId,"assignments"));

 let result="";

 snap.forEach(d=>{
   result+=d.data().player+" : "+d.data().text+"\n";
 });

 alert(result);

};

document.getElementById("newGame").onclick=()=>{
 location.reload();
};

document.getElementById("destroyRoom").onclick=async()=>{

 if(confirm("방 삭제?")){
   await deleteDoc(doc(db,"rooms",roomId));
   alert("삭제됨");
   location.reload();
 }

};

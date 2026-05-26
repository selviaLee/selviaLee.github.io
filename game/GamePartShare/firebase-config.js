
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCgCIp8nWIysZDnR1AaJkiWyHRfKL3P9Zs",
  authDomain: "minigame-3e556.firebaseapp.com",
  projectId: "minigame-3e556",
  storageBucket: "minigame-3e556.firebasestorage.app",
  messagingSenderId: "1031382989950",
  appId: "1:1031382989950:web:096f4c0b9f05e147fbac2f"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export async function ensureAnonymousAuth() {
  if (!auth.currentUser) {
    await signInAnonymously(auth);
  }
  return auth.currentUser;
}

// src/firebase/index.ts
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCWgloOjRRKpTtKLaXQWIQwU7YX5tMvXYg",
  authDomain: "signai-79a08.firebaseapp.com",
  projectId: "signai-79a08",
  storageBucket: "signai-79a08.firebasestorage.app",
  messagingSenderId: "819188208664",
  appId: "1:819188208664:web:c9c96c2084e037b5c51f6d",
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const auth = getAuth(app);

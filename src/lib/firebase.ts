// Firebase инициализациясы тек Auth пен Firestore үшін
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDp7kGX_fL63G7h016Ws4wnLeW0XztuMEc",
  authDomain: "historyofkz-e3d27.firebaseapp.com",
  projectId: "historyofkz-e3d27",
  storageBucket: "historyofkz-e3d27.firebasestorage.app",
  messagingSenderId: "462144477905",
  appId: "1:462144477905:web:4fe030adea014aa99783f0",
  measurementId: "G-TWQJY20G5L"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCjUSz2UqgWHJ2ATM1EbCHm9QSPQygbD6k",
  authDomain: "cityfind-735e6.firebaseapp.com",
  projectId: "cityfind-735e6",
  // Firebase Storage bucket should be the appspot.com bucket for web SDK usage.
  // If this is wrong, product image uploads will fail.
  storageBucket: "cityfind-735e6.appspot.com",
  messagingSenderId: "367959994273",
  appId: "1:367959994273:web:907180cf39b4fefd2fa5e0",
  measurementId: "G-QZQ4ME0V1F"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

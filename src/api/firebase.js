// Import the functions you need from the SDKs you need
import { getApp, getApps, initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAOZGdFiN1gRfCvWxQbPs-Re2giQ7gDHNA",
  authDomain: "miapp-af184.firebaseapp.com",
  projectId: "miapp-af184",
  storageBucket: "miapp-af184.firebasestorage.app",
  messagingSenderId: "410909323897",
  appId: "1:410909323897:web:df2d35bcdd4f9fa55d1aa8"
};

// Initialize Firebase
//const app = initializeApp(firebaseConfig);
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
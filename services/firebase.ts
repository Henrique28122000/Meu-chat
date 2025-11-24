import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getMessaging, isSupported } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyBOGkmIfZdRApC2DoO9gL1oA59-4Re3IPY",
  authDomain: "phchat-4122d.firebaseapp.com",
  projectId: "phchat-4122d",
  storageBucket: "phchat-4122d.firebasestorage.app",
  messagingSenderId: "555296879685",
  appId: "1:555296879685:web:74a94ff9642ee7d9291f2c"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const messaging = async () => {
  const supported = await isSupported();
  return supported ? getMessaging(app) : null;
};

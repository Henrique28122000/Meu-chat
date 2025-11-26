import * as firebaseApp from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getMessaging, isSupported, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyBOGkmIfZdRApC2DoO9gL1oA59-4Re3IPY",
  authDomain: "phchat-4122d.firebaseapp.com",
  projectId: "phchat-4122d",
  storageBucket: "phchat-4122d.firebasestorage.app",
  messagingSenderId: "555296879685",
  appId: "1:555296879685:web:74a94ff9642ee7d9291f2c"
};

const app = firebaseApp.initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const messaging = async () => {
  const supported = await isSupported();
  return supported ? getMessaging(app) : null;
};

export const requestForToken = async () => {
  try {
    const msg = await messaging();
    if (!msg) return null;
    
    // Solicita permissão (necessário em navegadores, em APK/Capacitor é tratado nativamente mas não faz mal aqui)
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
        const currentToken = await getToken(msg, {
            // VapidKey é opcional se configurado no manifesto, mas bom ter
            // vapidKey: 'SEU_VAPID_KEY' 
        });
        if (currentToken) {
            return currentToken;
        } else {
            console.log('No registration token available.');
        }
    } else {
        console.log('Permission denied');
    }
  } catch (err) {
    console.log('An error occurred while retrieving token. ', err);
  }
  return null;
};

export const onForegroundMessage = async (callback: (payload: any) => void) => {
    const msg = await messaging();
    if (msg) {
        onMessage(msg, (payload) => {
            callback(payload);
        });
    }
};
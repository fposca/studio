import { getApp, getApps, initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";
import { connectFunctionsEmulator, getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
export const functions = getFunctions(firebaseApp, "southamerica-east1");

const useFirebaseEmulators = import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATORS === "true";

if (useFirebaseEmulators) {
  const emulatorConnections = globalThis.__studioFirebaseEmulators ||= {};

  if (!emulatorConnections.auth) {
    connectAuthEmulator(auth, "http://127.0.0.1:9099");
    emulatorConnections.auth = true;
  }
  if (!emulatorConnections.firestore) {
    connectFirestoreEmulator(db, "127.0.0.1", 8080);
    emulatorConnections.firestore = true;
  }
  if (!emulatorConnections.functions) {
    connectFunctionsEmulator(functions, "127.0.0.1", 5001);
    emulatorConnections.functions = true;
  }
}

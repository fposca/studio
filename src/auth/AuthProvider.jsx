import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, sendPasswordResetEmail, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase.js";
import { USER_ROLES, VALID_USER_ROLES } from "./roles.js";

const AuthContext = createContext(null);

async function getUserRole(user) {
  const userRef = doc(db, "users", user.uid);
  let role = USER_ROLES.VIEWER;

  try {
    const snapshot = await getDoc(userRef);
    const storedRole = snapshot.data()?.role;
    role = VALID_USER_ROLES.has(storedRole) ? storedRole : USER_ROLES.VIEWER;
  } catch (error) {
    console.error("No se pudo obtener el rol del usuario.", error);
    return role;
  }

  try {
    await updateDoc(userRef, { email: user.email || "", lastLoginAt: serverTimestamp() });
  } catch (error) {
    console.warn("No se pudo sincronizar el perfil del usuario.", error);
  }

  return role;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(USER_ROLES.VIEWER);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      if (!active) return;
      setLoading(true);
      setUser(nextUser);
      const nextRole = nextUser ? await getUserRole(nextUser) : USER_ROLES.VIEWER;
      if (!active) return;
      setRole(nextRole);
      setLoading(false);
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const value = useMemo(() => ({
    user,
    role,
    loading,
    login: (email, password) => signInWithEmailAndPassword(auth, email.trim(), password),
    logout: () => signOut(auth),
    resetPassword: (email) => sendPasswordResetEmail(auth, email.trim())
  }), [loading, role, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth debe usarse dentro de AuthProvider.");
  return context;
}

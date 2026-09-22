import { randomBytes } from "node:crypto";
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";

initializeApp();

const db = getFirestore();
const VALID_ROLES = new Set(["viewer", "tester", "admin"]);

async function requireAdmin(request) {
  if (!request.auth) throw new HttpsError("unauthenticated", "Debes iniciar sesion.");
  const profile = await db.collection("users").doc(request.auth.uid).get();
  if (profile.data()?.role !== "admin") throw new HttpsError("permission-denied", "Solo los administradores pueden realizar esta accion.");
  return request.auth.uid;
}

function normalizeEmail(value) {
  const email = String(value || "").trim().toLowerCase();
  if (email.length < 5 || email.length > 254 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    throw new HttpsError("invalid-argument", "Email invalido.");
  }
  return email;
}

export const createManagedUser = onCall({ region: "southamerica-east1" }, async (request) => {
  const adminUid = await requireAdmin(request);
  const email = normalizeEmail(request.data?.email);
  const name = String(request.data?.name || "").trim();
  const role = String(request.data?.role || "tester");
  if (name.length < 2 || name.length > 100 || !VALID_ROLES.has(role)) {
    throw new HttpsError("invalid-argument", "Nombre o rol invalido.");
  }

  let account;
  try {
    account = await getAuth().createUser({
      displayName: name,
      email,
      emailVerified: false,
      password: randomBytes(32).toString("base64url")
    });
  } catch (error) {
    if (error.code === "auth/email-already-exists") throw new HttpsError("already-exists", "Ya existe una cuenta con ese email.");
    throw error;
  }

  try {
    await db.collection("users").doc(account.uid).set({
      createdAt: FieldValue.serverTimestamp(),
      createdBy: adminUid,
      email,
      name,
      role
    });
  } catch (error) {
    await getAuth().deleteUser(account.uid);
    throw error;
  }

  return { email, role, userId: account.uid };
});

export const setUserRole = onCall({ region: "southamerica-east1" }, async (request) => {
  const adminUid = await requireAdmin(request);
  const userId = String(request.data?.userId || "");
  const role = String(request.data?.role || "");
  if (!userId || !VALID_ROLES.has(role)) throw new HttpsError("invalid-argument", "Usuario o rol invalido.");
  if (userId === adminUid && role !== "admin") throw new HttpsError("failed-precondition", "No puedes quitar tu propio acceso de administrador.");
  const userRef = db.collection("users").doc(userId);
  if (!(await userRef.get()).exists) throw new HttpsError("not-found", "El perfil no existe.");
  await userRef.update({ role, updatedAt: FieldValue.serverTimestamp(), updatedBy: adminUid });
  return { role };
});

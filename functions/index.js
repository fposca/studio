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

function requestIdFrom(request) {
  const requestId = String(request.data?.requestId || "");
  if (!requestId || requestId.length > 128) throw new HttpsError("invalid-argument", "Solicitud invalida.");
  return requestId;
}

export const approveAccessRequest = onCall({ region: "southamerica-east1" }, async (request) => {
  const adminUid = await requireAdmin(request);
  const requestId = requestIdFrom(request);
  const requestRef = db.collection("accessRequests").doc(requestId);
  const snapshot = await requestRef.get();
  if (!snapshot.exists) throw new HttpsError("not-found", "La solicitud no existe.");

  const accessRequest = snapshot.data();
  if (accessRequest.status === "approved") return { status: "approved", email: accessRequest.email, alreadyProcessed: true };
  if (accessRequest.status !== "pending") throw new HttpsError("failed-precondition", "La solicitud ya fue rechazada.");

  let account;
  let created = false;
  try {
    account = await getAuth().createUser({
      displayName: accessRequest.name,
      email: accessRequest.email,
      emailVerified: false,
      password: randomBytes(24).toString("base64url")
    });
    created = true;
  } catch (error) {
    if (error.code !== "auth/email-already-exists") throw error;
    account = await getAuth().getUserByEmail(accessRequest.email);
  }

  const userRef = db.collection("users").doc(account.uid);
  const existingProfile = await userRef.get();
  if (existingProfile.exists && existingProfile.data()?.accessRequestId !== requestId) {
    throw new HttpsError("already-exists", "Este email ya pertenece a un usuario registrado.");
  }
  if (created || !existingProfile.exists) {
    await userRef.set({
      accessRequestId: requestId,
      company: accessRequest.company || "",
      createdAt: FieldValue.serverTimestamp(),
      email: accessRequest.email,
      name: accessRequest.name,
      role: "viewer"
    });
  }

  const approvedNow = await db.runTransaction(async (transaction) => {
    const latest = await transaction.get(requestRef);
    const status = latest.data()?.status;
    if (status === "approved") return false;
    if (status !== "pending") throw new HttpsError("failed-precondition", "La solicitud ya fue procesada.");
    transaction.update(requestRef, {
      authUid: account.uid,
      status: "approved",
      approvedAt: FieldValue.serverTimestamp(),
      approvedBy: adminUid
    });
    return true;
  });

  return { status: "approved", email: accessRequest.email, alreadyProcessed: !approvedNow };
});

export const rejectAccessRequest = onCall({ region: "southamerica-east1" }, async (request) => {
  const adminUid = await requireAdmin(request);
  const requestId = requestIdFrom(request);
  const requestRef = db.collection("accessRequests").doc(requestId);

  return db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(requestRef);
    if (!snapshot.exists) throw new HttpsError("not-found", "La solicitud no existe.");
    const status = snapshot.data()?.status;
    if (status === "rejected") return { status: "rejected", alreadyProcessed: true };
    if (status !== "pending") throw new HttpsError("failed-precondition", "La solicitud ya fue aprobada.");
    transaction.update(requestRef, {
      status: "rejected",
      rejectedAt: FieldValue.serverTimestamp(),
      rejectedBy: adminUid
    });
    return { status: "rejected" };
  });
});

export const setUserRole = onCall({ region: "southamerica-east1" }, async (request) => {
  const adminUid = await requireAdmin(request);
  const userId = String(request.data?.userId || "");
  const role = String(request.data?.role || "");
  if (!userId || !VALID_ROLES.has(role)) throw new HttpsError("invalid-argument", "Usuario o rol invalido.");
  if (userId === adminUid && role !== "admin") throw new HttpsError("failed-precondition", "No puedes quitar tu propio acceso de administrador.");
  await db.collection("users").doc(userId).update({ role, updatedAt: FieldValue.serverTimestamp() });
  return { role };
});

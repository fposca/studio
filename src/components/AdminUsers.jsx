import React, { useEffect, useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { collection, getDocs } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { Check, Loader2, Mail, RefreshCw, ShieldCheck, UserCheck, UserX, Users } from "lucide-react";
import { auth, db, functions } from "../lib/firebase.js";
import { USER_ROLES } from "../auth/roles.js";

const roleLabels = {
  [USER_ROLES.VIEWER]: "Viewer",
  [USER_ROLES.TESTER]: "Tester",
  [USER_ROLES.ADMIN]: "Admin"
};

export default function AdminUsers({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState("");
  const [savedId, setSavedId] = useState("");
  const pendingRequests = requests.filter((item) => item.status === "pending");
  const approvedRequests = requests.filter((item) => item.status === "approved");

  async function loadUsers() {
    setLoading(true);
    setError("");
    try {
      const [usersSnapshot, requestsSnapshot] = await Promise.all([
        getDocs(collection(db, "users")),
        getDocs(collection(db, "accessRequests"))
      ]);
      const nextUsers = usersSnapshot.docs
        .map((userDoc) => ({ id: userDoc.id, ...userDoc.data() }))
        .sort((first, second) => String(first.email || first.id).localeCompare(String(second.email || second.id)));
      setUsers(nextUsers);
      setRequests(requestsSnapshot.docs
        .map((requestDoc) => ({ id: requestDoc.id, ...requestDoc.data() }))
        .sort((first, second) => (second.createdAt?.seconds || 0) - (first.createdAt?.seconds || 0)));
    } catch (caught) {
      console.error("No se pudieron cargar los usuarios.", caught);
      setError("No se pudieron cargar los usuarios. Revisa las reglas de Firestore.");
    } finally {
      setLoading(false);
    }
  }

  async function approveRequest(accessRequest) {
    setSavingId(accessRequest.id);
    setError("");
    try {
      const approveAccessRequest = httpsCallable(functions, "approveAccessRequest");
      const result = await approveAccessRequest({ requestId: accessRequest.id });
      if (!result.data?.alreadyProcessed) await sendPasswordResetEmail(auth, accessRequest.email);
      setSavedId(accessRequest.id);
      await loadUsers();
    } catch (caught) {
      console.error("No se pudo aprobar la solicitud o enviar la invitacion.", caught);
      setError("No se pudo completar la aprobacion. Si la cuenta fue creada, usa Reenviar invitacion.");
    } finally {
      setSavingId("");
    }
  }

  async function rejectRequest(requestId) {
    setSavingId(requestId);
    setError("");
    try {
      const rejectAccessRequest = httpsCallable(functions, "rejectAccessRequest");
      await rejectAccessRequest({ requestId });
      await loadUsers();
    } catch (caught) {
      console.error("No se pudo revisar la solicitud.", caught);
      setError("No se pudo revisar la solicitud. Verifica que la funcion este desplegada.");
    } finally {
      setSavingId("");
    }
  }

  async function resendInvitation(email, id) {
    setSavingId(id);
    setError("");
    try {
      await sendPasswordResetEmail(auth, email);
      setSavedId(id);
      window.setTimeout(() => setSavedId((current) => current === id ? "" : current), 1800);
    } catch (caught) {
      console.error("No se pudo reenviar la invitacion.", caught);
      setError("No se pudo reenviar la invitacion.");
    } finally {
      setSavingId("");
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function changeRole(userId, role) {
    setSavingId(userId);
    setSavedId("");
    setError("");
    try {
      const setUserRole = httpsCallable(functions, "setUserRole");
      await setUserRole({ userId, role });
      setUsers((current) => current.map((item) => item.id === userId ? { ...item, role } : item));
      setSavedId(userId);
      window.setTimeout(() => setSavedId((current) => current === userId ? "" : current), 1800);
    } catch (caught) {
      console.error("No se pudo actualizar el rol.", caught);
      setError("No se pudo actualizar el rol. Revisa tus permisos de administrador.");
    } finally {
      setSavingId("");
    }
  }

  return (
    <section className="admin-users">
      <header className="admin-users-heading">
        <div>
          <span>ADMINISTRACION</span>
          <h1>Usuarios y accesos</h1>
          <p>Asigna el nivel de acceso de cada perfil registrado.</p>
        </div>
        <button className="secondary-button" disabled={loading} onClick={loadUsers} type="button">
          <RefreshCw className={loading ? "spin" : ""} size={17} /> Actualizar
        </button>
      </header>

      <div className="admin-role-summary">
        <article><Users size={21} /><strong>{users.length}</strong><span>Usuarios</span></article>
        <article><ShieldCheck size={21} /><strong>{users.filter((item) => item.role === USER_ROLES.ADMIN).length}</strong><span>Administradores</span></article>
        <article><UserCheck size={21} /><strong>{pendingRequests.length}</strong><span>Solicitudes pendientes</span></article>
      </div>

      {error && <p className="panel-error">{error}</p>}
      <section className="admin-requests">
        <div><h2>Solicitudes pendientes</h2><span>{pendingRequests.length} por revisar</span></div>
        {!loading && !pendingRequests.length && <p className="admin-users-empty">No hay solicitudes pendientes.</p>}
        {pendingRequests.map((accessRequest) => (
          <article key={accessRequest.id}>
            <div>
              <strong>{accessRequest.name}</strong>
              <span>{accessRequest.email}</span>
              <small>{accessRequest.company}</small>
            </div>
            <div className="admin-request-actions">
              <button className="secondary-button" disabled={Boolean(savingId)} onClick={() => rejectRequest(accessRequest.id)} type="button"><UserX size={17} /> Rechazar</button>
              <button className="primary-button" disabled={Boolean(savingId)} onClick={() => approveRequest(accessRequest)} type="button">
                {savingId === accessRequest.id ? <Loader2 className="spin" size={17} /> : <UserCheck size={17} />} Aprobar
              </button>
            </div>
          </article>
        ))}
      </section>

      <section className="admin-requests">
        <div><h2>Solicitudes aprobadas</h2><span>{approvedRequests.length} aprobadas</span></div>
        {!loading && !approvedRequests.length && <p className="admin-users-empty">Todavia no hay solicitudes aprobadas.</p>}
        {approvedRequests.map((accessRequest) => (
          <article key={accessRequest.id}>
            <div><strong>{accessRequest.name}</strong><span>{accessRequest.email}</span><small>{accessRequest.company}</small></div>
            <div className="admin-request-actions">
              <button className="secondary-button" disabled={Boolean(savingId)} onClick={() => resendInvitation(accessRequest.email, accessRequest.id)} type="button">
                {savingId === accessRequest.id ? <Loader2 className="spin" size={17} /> : <Mail size={17} />} {savedId === accessRequest.id ? "Enviada" : "Reenviar invitacion"}
              </button>
            </div>
          </article>
        ))}
      </section>

      <div className="admin-users-section-title"><h2>Usuarios habilitados</h2><span>{users.length} perfiles</span></div>
      <div className="admin-users-table-wrap">
        <table className="admin-users-table">
          <thead><tr><th>Usuario</th><th>UID</th><th>Rol</th><th>Estado</th></tr></thead>
          <tbody>
            {loading && <tr><td className="admin-users-empty" colSpan="4"><Loader2 className="spin" size={20} /> Cargando usuarios...</td></tr>}
            {!loading && !users.length && <tr><td className="admin-users-empty" colSpan="4">No hay perfiles en la coleccion users.</td></tr>}
            {!loading && users.map((profile) => {
              const isCurrentUser = profile.id === currentUser?.uid;
              return (
                <tr key={profile.id}>
                  <td><strong>{profile.email || "Email no registrado"}</strong>{isCurrentUser && <span className="admin-current-user">Tu cuenta</span>}</td>
                  <td><code>{profile.id}</code></td>
                  <td>
                    <select
                      aria-label={`Rol de ${profile.email || profile.id}`}
                      disabled={savingId === profile.id || isCurrentUser}
                      onChange={(event) => changeRole(profile.id, event.target.value)}
                      value={profile.role || USER_ROLES.VIEWER}
                    >
                      {Object.entries(roleLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </select>
                  </td>
                  <td className="admin-user-status">
                    {savingId === profile.id && <><Loader2 className="spin" size={16} /> Guardando</>}
                    {savedId === profile.id && <><Check size={16} /> Guardado</>}
                    {!savingId && savedId !== profile.id && <span className={`role-badge is-${profile.role || USER_ROLES.VIEWER}`}>{roleLabels[profile.role] || roleLabels.viewer}</span>}
                    {profile.email && !isCurrentUser && <button className="icon-button" data-tooltip="Reenviar invitacion" disabled={Boolean(savingId)} onClick={() => resendInvitation(profile.email, profile.id)} type="button"><Mail size={15} /></button>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="admin-users-note">Las cuentas aprobadas comienzan con rol viewer. La invitacion permite que cada usuario defina su propia contrasena.</p>
    </section>
  );
}

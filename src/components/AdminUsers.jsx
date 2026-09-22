import React, { useEffect, useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { collection, getDocs } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { Check, Loader2, Mail, Plus, RefreshCw, ShieldCheck, Users } from "lucide-react";
import { auth, db, functions } from "../lib/firebase.js";
import { USER_ROLES } from "../auth/roles.js";

const roleLabels = {
  [USER_ROLES.VIEWER]: "Viewer",
  [USER_ROLES.TESTER]: "Tester",
  [USER_ROLES.ADMIN]: "Admin"
};

export default function AdminUsers({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({ name: "", email: "", role: USER_ROLES.TESTER });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [savingId, setSavingId] = useState("");
  const [savedId, setSavedId] = useState("");

  async function loadUsers() {
    setLoading(true);
    setError("");
    try {
      const snapshot = await getDocs(collection(db, "users"));
      setUsers(snapshot.docs.map((userDoc) => ({ id: userDoc.id, ...userDoc.data() }))
        .sort((first, second) => String(first.email || first.id).localeCompare(String(second.email || second.id))));
    } catch (caught) {
      console.error("No se pudieron cargar los usuarios.", caught);
      setError("No se pudieron cargar los usuarios. Revisa las reglas de Firestore.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadUsers(); }, []);

  async function createUser(event) {
    event.preventDefault();
    setSavingId("new");
    setError("");
    setStatus("");
    try {
      const createManagedUser = httpsCallable(functions, "createManagedUser");
      const result = await createManagedUser(newUser);
      await sendPasswordResetEmail(auth, result.data.email);
      setNewUser({ name: "", email: "", role: USER_ROLES.TESTER });
      setStatus("Usuario creado. Firebase envio el enlace para definir su contrasena.");
      await loadUsers();
    } catch (caught) {
      console.error("No se pudo crear el usuario.", caught);
      setError(caught?.code === "functions/already-exists" ? "Ya existe una cuenta con ese email." : "No se pudo crear el usuario. Verifica que las funciones esten desplegadas.");
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
        <div><span>ADMINISTRACION</span><h1>Usuarios y accesos</h1><p>Solo un administrador puede crear cuentas y asignar permisos.</p></div>
        <button className="secondary-button" disabled={loading} onClick={loadUsers} type="button"><RefreshCw className={loading ? "spin" : ""} size={17} /> Actualizar</button>
      </header>
      <div className="admin-role-summary">
        <article><Users size={21} /><strong>{users.length}</strong><span>Usuarios</span></article>
        <article><ShieldCheck size={21} /><strong>{users.filter((item) => item.role === USER_ROLES.ADMIN).length}</strong><span>Administradores</span></article>
        <article><Check size={21} /><strong>{users.filter((item) => item.role === USER_ROLES.TESTER).length}</strong><span>Acceso completo</span></article>
      </div>
      {error && <p className="panel-error">{error}</p>}
      {status && <p className="form-status">{status}</p>}
      <form className="admin-create-user" onSubmit={createUser}>
        <div><h2>Crear usuario</h2><span>El usuario recibira un enlace para definir su contrasena.</span></div>
        <label>Nombre<input maxLength="100" onChange={(event) => setNewUser((current) => ({ ...current, name: event.target.value }))} required value={newUser.name} /></label>
        <label>Email<input autoComplete="off" maxLength="254" onChange={(event) => setNewUser((current) => ({ ...current, email: event.target.value }))} required type="email" value={newUser.email} /></label>
        <label>Rol<select onChange={(event) => setNewUser((current) => ({ ...current, role: event.target.value }))} value={newUser.role}>{Object.entries(roleLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <button className="primary-button" disabled={Boolean(savingId)} type="submit">{savingId === "new" ? <Loader2 className="spin" size={17} /> : <Plus size={17} />} Crear e invitar</button>
      </form>
      <div className="admin-users-section-title"><h2>Usuarios habilitados</h2><span>{users.length} perfiles</span></div>
      <div className="admin-users-table-wrap">
        <table className="admin-users-table">
          <thead><tr><th>Usuario</th><th>UID</th><th>Rol</th><th>Estado</th></tr></thead>
          <tbody>
            {loading && <tr><td className="admin-users-empty" colSpan="4"><Loader2 className="spin" size={20} /> Cargando usuarios...</td></tr>}
            {!loading && !users.length && <tr><td className="admin-users-empty" colSpan="4">No hay perfiles en la coleccion users.</td></tr>}
            {!loading && users.map((profile) => {
              const isCurrentUser = profile.id === currentUser?.uid;
              return <tr key={profile.id}>
                <td><strong>{profile.email || "Email no registrado"}</strong>{isCurrentUser && <span className="admin-current-user">Tu cuenta</span>}</td>
                <td><code>{profile.id}</code></td>
                <td><select aria-label={`Rol de ${profile.email || profile.id}`} disabled={savingId === profile.id || isCurrentUser} onChange={(event) => changeRole(profile.id, event.target.value)} value={profile.role || USER_ROLES.VIEWER}>{Object.entries(roleLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></td>
                <td className="admin-user-status">
                  {savingId === profile.id && <><Loader2 className="spin" size={16} /> Guardando</>}
                  {savedId === profile.id && <><Check size={16} /> Guardado</>}
                  {!savingId && savedId !== profile.id && <span className={`role-badge is-${profile.role || USER_ROLES.VIEWER}`}>{roleLabels[profile.role] || roleLabels.viewer}</span>}
                  {profile.email && !isCurrentUser && <button className="icon-button" data-tooltip="Reenviar invitacion" disabled={Boolean(savingId)} onClick={() => resendInvitation(profile.email, profile.id)} type="button"><Mail size={15} /></button>}
                </td>
              </tr>;
            })}
          </tbody>
        </table>
      </div>
      <p className="admin-users-note">No hay registro publico. Cada cuenta debe crearse desde este panel o desde Firebase Console.</p>
    </section>
  );
}

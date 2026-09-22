const PROJECT_DB_NAME = "neon-studio-projects";
const PROJECT_STORE = "projects";

function openProjectDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(PROJECT_DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(PROJECT_STORE)) {
        request.result.createObjectStore(PROJECT_STORE);
      }
    };
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

export async function putProject(id, value) {
  const db = await openProjectDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(PROJECT_STORE, "readwrite");
    const request = transaction.objectStore(PROJECT_STORE).put(value, id);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => { db.close(); resolve(); };
    transaction.onerror = () => { db.close(); reject(transaction.error); };
    transaction.onabort = () => { db.close(); reject(transaction.error || new Error("Guardado cancelado.")); };
  });
}

export async function getProject(id) {
  const db = await openProjectDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(PROJECT_STORE, "readonly");
    const request = transaction.objectStore(PROJECT_STORE).get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => db.close();
    transaction.onerror = () => { db.close(); reject(transaction.error); };
  });
}

export async function deleteProject(id) {
  const db = await openProjectDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(PROJECT_STORE, "readwrite");
    const request = transaction.objectStore(PROJECT_STORE).delete(id);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => { db.close(); resolve(); };
    transaction.onerror = () => { db.close(); reject(transaction.error); };
  });
}

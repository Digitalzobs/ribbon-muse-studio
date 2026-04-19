const DB_NAME = "ribbon-muse-studio";
const DB_VERSION = 1;
const STORE_NAMES = ["users", "projects", "looks", "prompts"];

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      STORE_NAMES.forEach((storeName) => {
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName, { keyPath: "id" });
        }
      });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function withStore(storeName, mode, callback) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    const result = callback(store);
    tx.oncomplete = () => resolve(result);
    tx.onerror = () => reject(tx.error);
  });
}

export async function getAll(storeName) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const store = tx.objectStore(storeName);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result ?? []);
    request.onerror = () => reject(request.error);
  });
}

export async function getOne(storeName, id) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const store = tx.objectStore(storeName);
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result ?? null);
    request.onerror = () => reject(request.error);
  });
}

export async function putOne(storeName, value) {
  return withStore(storeName, "readwrite", (store) => store.put(value));
}

export async function deleteOne(storeName, id) {
  return withStore(storeName, "readwrite", (store) => store.delete(id));
}

export async function queryByUser(storeName, userId) {
  const all = await getAll(storeName);
  return all
    .filter((item) => item.userId === userId)
    .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
}

export function getSessionUserId() {
  return window.localStorage.getItem("ribbon-session-user");
}

export function setSessionUserId(userId) {
  if (userId) {
    window.localStorage.setItem("ribbon-session-user", userId);
    return;
  }
  window.localStorage.removeItem("ribbon-session-user");
}

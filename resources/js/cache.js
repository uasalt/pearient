const tables = [
  {
    name: "filesCache",
    columns: ["file", "content", "offset", "ext"]
  },
  {
    name: "photoCache",
    columns: ["file", "content", "offset", "ext"]
  }
];

let db;

function openDB(name = "client", version = 1) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(name, version);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      for (const table of tables) {
        if (!db.objectStoreNames.contains(table.name)) {
          const store = db.createObjectStore(table.name, { keyPath: "file" });
          for (const column of table.columns) {
            store.createIndex(column, column, { unique: false });
          }
        }
      }
    };

    request.onsuccess = (event) => {
      db = event.target.result;
      resolve(db);
    };

    request.onerror = (event) => reject(event.target.error);
  });
}

// универсальная функция получения
async function get(table, key) {
  const tx = db.transaction(table, "readonly");
  const store = tx.objectStore(table);
  return new Promise((resolve) => {
    const req = store.get(key);
    req.onsuccess = (e) => resolve(e.target.result || false);
    req.onerror = () => resolve(false);
  });
}

// универсальная функция добавления
async function add(table, data) {
  const tx = db.transaction(table, "readwrite");
  const store = tx.objectStore(table);
  return new Promise((resolve) => {
    const req = store.add(data);
    req.onsuccess = () => resolve(true);
    req.onerror = () => resolve(false);
  });
}

// получение всех записей по индексу
async function all(table, column, value) {
  const tx = db.transaction(table, "readonly");
  const store = tx.objectStore(table);
  const index = store.index(column);
  return new Promise((resolve) => {
    const req = index.getAll(value);
    req.onsuccess = (e) => resolve(e.target.result || []);
    req.onerror = () => resolve([]);
  });
}

// добавление или обновление кеша с file, blob, offset
async function appendCache(table, file, blob, offset) {
  const tx = db.transaction(table, "readwrite");
  const store = tx.objectStore(table);

  return new Promise((resolve) => {
    const getReq = store.get(file);

    getReq.onsuccess = (e) => {
      const record = e.target.result;
      if (record) {
        // если запись есть, обновляем content и offset
        record.content = blob;
        record.offset = offset;
        const updateReq = store.put(record);
        updateReq.onsuccess = () => resolve(true);
        updateReq.onerror = () => resolve(false);
      } else {
        // если записи нет, создаём новую
        const addReq = store.add({ file, content: blob, offset });
        addReq.onsuccess = () => resolve(true);
        addReq.onerror = () => resolve(false);
      }
    };

    getReq.onerror = () => resolve(false);
  });
}

async function getAllByFileSorted(table, file) {
  const tx = db.transaction(table, "readonly");
  const store = tx.objectStore(table);
  const index = store.index("file"); // используем индекс по file

  return new Promise((resolve) => {
    const req = index.getAll(file);
    req.onsuccess = (e) => {
      const result = e.target.result || [];
      // сортируем по offset
      result.sort((a, b) => a.offset - b.offset);
      resolve(result);
    };
    req.onerror = () => resolve([]);
  });
}

export default {
  openDB,
  get,
  add,
  all,
  appendCache,
  getAllByFileSorted
};
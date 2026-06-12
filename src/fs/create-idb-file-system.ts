export interface IdbFileSystem {
  delete(key: string): Promise<void>;
  save(key: string, data: Uint8Array): Promise<void>;
  load(key: string): Promise<Uint8Array | null>;
  list(prefix?: string): Promise<string[]>;
}

export async function createIdbFileSystem(
  name: string,
  version?: number,
): Promise<IdbFileSystem> {
  const db = await new Promise<IDBDatabase>((resolve) => {
    const idb = window.indexedDB.open(name, version);
    idb.onupgradeneeded = function () {
      this.result.createObjectStore("files");
    };
    idb.onsuccess = function () {
      resolve(this.result);
    };
  });

  return {
    delete(key: string): Promise<void> {
      return new Promise((resolve) => {
        const request = db
          .transaction("files", "readwrite")
          .objectStore("files")
          .delete(key);
        request.onsuccess = function () {
          resolve();
        };
      });
    },
    save(key: string, data: Uint8Array): Promise<void> {
      return new Promise((resolve) => {
        const request = db
          .transaction("files", "readwrite")
          .objectStore("files")
          .put(data, key);
        request.onsuccess = function () {
          resolve();
        };
      });
    },
    load(key: string): Promise<Uint8Array | null> {
      return new Promise((resolve) => {
        const request = db
          .transaction("files", "readonly")
          .objectStore("files")
          .get(key);
        request.onsuccess = function (ev) {
          resolve((ev.target as IDBRequest).result ?? null);
        };
      });
    },
    list(prefix = ""): Promise<string[]> {
      return new Promise((resolve) => {
        const keys: string[] = [];
        const request = db
          .transaction("files", "readonly")
          .objectStore("files")
          .openCursor();
        request.onsuccess = function (ev) {
          const cursor = (ev.target as IDBRequest<IDBCursorWithValue>).result;
          if (cursor) {
            if (!prefix || cursor.key.toString().startsWith(prefix)) {
              keys.push(cursor.key.toString());
            }
            cursor.continue();
          } else {
            resolve(keys);
          }
        };
      });
    },
  };
}

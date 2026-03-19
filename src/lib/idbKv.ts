type DbValue = any

const DB_NAME = 'class-pet-home'
const STORE = 'kv'
const VERSION = 1

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE)
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error ?? new Error('indexedDB.open 失败'))
  })
}

export async function idbGet<T = DbValue>(key: string): Promise<T | undefined> {
  const db = await openDb()
  try {
    return await new Promise<T | undefined>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly')
      const store = tx.objectStore(STORE)
      const req = store.get(key)
      req.onsuccess = () => resolve(req.result as T | undefined)
      req.onerror = () => reject(req.error ?? new Error('indexedDB.get 失败'))
    })
  } finally {
    db.close()
  }
}

export async function idbSet(key: string, value: DbValue): Promise<void> {
  const db = await openDb()
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite')
      const store = tx.objectStore(STORE)
      const req = store.put(value, key)
      req.onerror = () => reject(req.error ?? new Error('indexedDB.put 失败'))
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error ?? new Error('indexedDB 事务失败'))
      tx.onabort = () => reject(tx.error ?? new Error('indexedDB 事务中止'))
    })
  } finally {
    db.close()
  }
}

export async function idbDel(key: string): Promise<void> {
  const db = await openDb()
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite')
      const store = tx.objectStore(STORE)
      const req = store.delete(key)
      req.onerror = () => reject(req.error ?? new Error('indexedDB.delete 失败'))
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error ?? new Error('indexedDB 事务失败'))
      tx.onabort = () => reject(tx.error ?? new Error('indexedDB 事务中止'))
    })
  } finally {
    db.close()
  }
}


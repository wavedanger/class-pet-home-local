import { idbDel, idbGet, idbSet } from '@/lib/idbKv'

const HANDLE_KEY = 'autoBackup:fileHandle'

export type AutoBackupSupport = {
  supported: boolean
  reason?: string
}

export type AutoBackupStatus = {
  enabled: boolean
  hasTarget: boolean
  lastOkAt?: number
  lastError?: string
}

export function getSupport(): AutoBackupSupport {
  const ok =
    typeof window !== 'undefined' &&
    'showSaveFilePicker' in window &&
    typeof (window as any).showSaveFilePicker === 'function'
  return ok ? { supported: true } : { supported: false, reason: '当前浏览器不支持 File System Access API' }
}

export async function getSavedHandle(): Promise<FileSystemFileHandle | undefined> {
  return await idbGet<FileSystemFileHandle>(HANDLE_KEY)
}

export async function clearSavedHandle() {
  await idbDel(HANDLE_KEY)
}

export async function pickTargetFile(): Promise<FileSystemFileHandle> {
  const support = getSupport()
  if (!support.supported) throw new Error(support.reason || '不支持自动备份')

  const handle = await (window as any).showSaveFilePicker({
    suggestedName: 'class-pet-home_backup.json',
    types: [
      {
        description: 'JSON 备份文件',
        accept: { 'application/json': ['.json'] },
      },
    ],
  })
  await idbSet(HANDLE_KEY, handle)
  return handle as FileSystemFileHandle
}

async function ensureWritePermission(handle: FileSystemFileHandle) {
  // 兼容：部分浏览器没有 queryPermission
  const anyHandle = handle as any
  if (typeof anyHandle.queryPermission === 'function') {
    const q = await anyHandle.queryPermission({ mode: 'readwrite' })
    if (q === 'granted') return
  }
  if (typeof anyHandle.requestPermission === 'function') {
    const r = await anyHandle.requestPermission({ mode: 'readwrite' })
    if (r === 'granted') return
  }
  // 如果浏览器不提供 permission API，尝试直接写
}

export async function writeBackupJson(jsonText: string) {
  const handle = await getSavedHandle()
  if (!handle) throw new Error('未选择备份文件，请先点击“选择备份文件”')
  await ensureWritePermission(handle)

  const writable = await handle.createWritable()
  await writable.write(jsonText)
  await writable.close()
}


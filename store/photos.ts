/**
 * 按账户记录本设备上传过的照片 ID，用于主动清理；不存照片内容或签名 URL。
 * 第一批后端尚无照片列表，本索引只覆盖本设备已收到成功响应的上传，不代表账户全量资产。
 */
const memory = new Map<string, string[]>()
const STORAGE_PREFIX = 'huaye_uploaded_photos_v1_'

export function getUploadedPhotoIds(userId: string): string[] {
  if (!memory.has(userId)) {
    try {
      const stored = wx.getStorageSync<unknown>(`${STORAGE_PREFIX}${userId}`)
      memory.set(userId, Array.isArray(stored) ? stored.filter((value): value is string => typeof value === 'string') : [])
    } catch { memory.set(userId, []) }
  }
  return [...memory.get(userId)!]
}

/** 持久化不可用时保留进程内清理记录，不把已成功上传的照片误报为上传失败。 */
function save(userId: string, ids: string[]): void {
  memory.set(userId, ids)
  try { wx.setStorageSync(`${STORAGE_PREFIX}${userId}`, ids) } catch { /* 本次进程仍可执行删除。 */ }
}

export function rememberUploadedPhoto(userId: string, photoId: string): void {
  save(userId, [...new Set([...getUploadedPhotoIds(userId), photoId])])
}

export function forgetUploadedPhoto(userId: string, photoId: string): void {
  save(userId, getUploadedPhotoIds(userId).filter((id) => id !== photoId))
}

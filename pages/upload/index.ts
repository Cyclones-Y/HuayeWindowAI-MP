import { PHOTO_MAX_BYTES } from '../../config/api'
import { getDraft, updateDraft } from '../../store/session'
import { ensureSession } from '../../services/auth'
import { ApiError } from '../../services/http-client'
import { gateway } from '../../services/index'
import type { PhotoUploadOperation } from '../../types/index'

/** 下载服务端规范化后的图片，保证框选看到的方向和提交给后端的尺寸一致。 */
function downloadPreview(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    wx.downloadFile({
      url, timeout: 30000,
      success: (result) => {
        if (result.statusCode === 200 && result.tempFilePath) resolve(result.tempFilePath)
        else reject(new ApiError('PHOTO_PREVIEW_FAILED', '照片预览加载失败，请重试', result.statusCode))
      },
      fail: () => reject(new ApiError('PHOTO_PREVIEW_FAILED', '照片预览加载失败，请检查网络', 0)),
    })
  })
}

Page({
  data: {
    choosing: false,
    uploading: false,
    uploadProgress: 0,
    uploadStage: '',
    uploadError: '',
    selectedSolutionName: '',
  },

  pageAlive: true,
  uploadCancelled: false,
  activeUpload: null as PhotoUploadOperation | null,

  onLoad() { void this.initialize() },

  onUnload() {
    this.pageAlive = false
    this.cancelUpload()
  },

  async initialize() {
    if (!(await ensureSession())) {
      const pages = getCurrentPages()
      if (pages.length > 1) wx.navigateBack()
      else wx.switchTab({ url: '/pages/home/index' })
      return
    }
    if (this.pageAlive) this.setData({ selectedSolutionName: getDraft().solution?.name || '' })
  },

  chooseFromCamera() { void this.choosePhoto(['camera']) },
  chooseFromAlbum() { void this.choosePhoto(['album']) },

  /** 取消和离开页面共用标记，上传成功回调若已到达仍会清理刚创建的服务器照片。 */
  cancelUpload() {
    this.uploadCancelled = true
    this.activeUpload?.abort()
    if (this.pageAlive && this.data.uploading) this.setData({ uploadStage: '正在取消…' })
  },

  /** 选择、校验、上传和预览就绪后才替换草稿；未提交的上传通过 finally 回收。 */
  async choosePhoto(sourceType: Array<'album' | 'camera'>) {
    if (this.data.choosing) return
    this.uploadCancelled = false
    this.setData({ choosing: true, uploadError: '', uploadProgress: 0 })
    let newPhotoId = ''
    let draftCommitted = false
    try {
      if (!(await ensureSession()) || !this.pageAlive) return
      const result = await wx.chooseMedia({ count: 1, mediaType: ['image'], sourceType, sizeType: ['compressed'] })
      const file = result.tempFiles[0]
      if (!file?.tempFilePath || !this.pageAlive || this.uploadCancelled) return
      if (file.size > PHOTO_MAX_BYTES) {
        throw new ApiError('PHOTO_TOO_LARGE', '照片超过 10 MB，请压缩后重新选择', 413)
      }
      const info = await wx.getImageInfo({ src: file.tempFilePath })
      if (Math.min(info.width, info.height) < 640) {
        throw new ApiError('PHOTO_TOO_SMALL', '照片清晰度偏低，请重新拍摄', 400)
      }
      if (!this.pageAlive || this.uploadCancelled) return
      this.setData({ uploading: true, uploadStage: '正在上传照片' })
      this.activeUpload = gateway.uploadPhoto(file.tempFilePath, (progress) => {
        if (this.pageAlive) this.setData({
          uploadProgress: progress,
          uploadStage: progress >= 100 ? '正在处理照片' : '正在上传照片',
        })
      })
      const uploaded = await this.activeUpload.result
      this.activeUpload = null
      newPhotoId = uploaded.photoId
      if (!this.pageAlive || this.uploadCancelled) return
      this.setData({ uploadStage: '正在加载照片预览', uploadProgress: 100 })
      const normalizedPath = await downloadPreview(uploaded.previewUrl)
      if (!this.pageAlive || this.uploadCancelled) return

      // 预览可用后同步替换草稿，再回收旧图；异步删除期间离开页面也不会留下失效草稿。
      const previousPhotoId = getDraft().photo?.photoId
      updateDraft({
        photo: {
          photoId: uploaded.photoId, localPath: normalizedPath,
          previewUrl: uploaded.previewUrl, previewUrlExpiresAt: uploaded.previewUrlExpiresAt,
          width: uploaded.width, height: uploaded.height, size: uploaded.sizeBytes, isSample: false,
        },
        selection: null, taskId: '',
      })
      draftCommitted = true
      this.setData({ uploading: false })
      if (previousPhotoId) {
        try { await gateway.deletePhoto(previousPhotoId) } catch {
          // 新草稿已经有效，旧图清理失败不回滚；账户索引保留它，供个人中心重试删除。
          if (this.pageAlive) wx.showToast({ title: '旧照片暂未清理，可在“我的”中再次清除', icon: 'none' })
        }
      }
      if (this.pageAlive) wx.navigateTo({ url: '/pages/selection/index' })
    } catch (error) {
      const cancelled = this.uploadCancelled || String((error as { errMsg?: string })?.errMsg || error).includes('cancel')
      if (this.pageAlive && !cancelled) {
        const message = error instanceof ApiError ? error.message : '无法读取照片，请检查相机或相册权限后重试'
        this.setData({ uploadError: message })
        wx.showToast({ title: message, icon: 'none' })
      }
    } finally {
      // 已成功上传但未进入草稿的照片应回收；失败时索引仍保留，可从个人中心再次清理。
      if (newPhotoId && !draftCommitted) {
        try { await gateway.deletePhoto(newPhotoId) } catch {
          if (this.pageAlive) this.setData({ uploadError: '照片清理暂未完成，可在“我的”中再次清除。' })
        }
      }
      this.activeUpload = null
      if (this.pageAlive) this.setData({ choosing: false, uploading: false })
    }
  },
})

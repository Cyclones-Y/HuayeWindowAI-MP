import { getDraft, updateDraft } from '../../store/session'

Page({
  data: {
    choosing: false,
    selectedSolutionName: '',
  },

  onLoad() {
    const solution = getDraft().solution
    this.setData({ selectedSolutionName: solution?.name || '' })
  },

  chooseFromCamera() {
    void this.choosePhoto(['camera'])
  },

  chooseFromAlbum() {
    void this.choosePhoto(['album'])
  },

  async choosePhoto(sourceType: Array<'album' | 'camera'>) {
    if (this.data.choosing) return
    this.setData({ choosing: true })
    try {
      const result = await wx.chooseMedia({
        count: 1,
        mediaType: ['image'],
        sourceType,
        sizeType: ['compressed'],
      })
      const file = result.tempFiles[0]
      if (!file?.tempFilePath) return
      const info = await wx.getImageInfo({ src: file.tempFilePath })
      if (Math.min(info.width, info.height) < 640) {
        wx.showToast({ title: '照片清晰度偏低，请重新拍摄', icon: 'none', duration: 2400 })
        return
      }
      updateDraft({
        photo: {
          localPath: file.tempFilePath,
          width: info.width,
          height: info.height,
          size: file.size,
          isSample: false,
        },
        selection: null,
        taskId: '',
      })
      wx.navigateTo({ url: '/pages/selection/index' })
    } catch (error) {
      const message = String(error)
      if (!message.includes('cancel')) {
        wx.showModal({
          title: '暂时无法读取照片',
          content: '请检查微信相机或相册权限后重试。照片仅用于生成门窗效果图。',
          showCancel: false,
        })
      }
    } finally {
      this.setData({ choosing: false })
    }
  },
})

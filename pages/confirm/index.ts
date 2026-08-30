import { getDraft, updateDraft } from '../../store/session'
import type { ProductOption, WindowSolution } from '../../types/index'

Page({
  data: {
    photoPath: '',
    solution: null as WindowSolution | null,
    frameColors: [] as ProductOption[],
    glassOptions: [] as ProductOption[],
    frameColorCode: '',
    glassCode: '',
  },

  onLoad() {
    const draft = getDraft()
    if (!draft.photo || !draft.solution) {
      wx.showToast({ title: '方案信息不完整', icon: 'none' })
      wx.navigateBack()
      return
    }
    this.setData({
      photoPath: draft.photo.localPath,
      solution: draft.solution,
      frameColors: draft.solution.frameColors,
      glassOptions: draft.solution.glassOptions,
      frameColorCode: draft.frameColorCode || draft.solution.frameColors[0].code,
      glassCode: draft.glassCode || draft.solution.glassOptions[0].code,
    })
  },

  selectFrameColor(event: WechatMiniprogram.TouchEvent) {
    this.setData({ frameColorCode: String(event.currentTarget.dataset.code) })
  },

  selectGlass(event: WechatMiniprogram.TouchEvent) {
    this.setData({ glassCode: String(event.currentTarget.dataset.code) })
  },

  startGeneration() {
    updateDraft({
      frameColorCode: this.data.frameColorCode,
      glassCode: this.data.glassCode,
      taskId: '',
    })
    wx.navigateTo({ url: '/pages/generating/index' })
  },
})

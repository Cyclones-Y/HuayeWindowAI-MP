import { WINDOW_SOLUTIONS } from '../../data/solutions'
import { resetDraft, updateDraft } from '../../store/session'

Page({
  data: {
    featuredSolutions: WINDOW_SOLUTIONS,
  },

  onShow() {
    wx.setNavigationBarColor({ frontColor: '#000000', backgroundColor: '#F3F2EE' })
  },

  goUpload() {
    resetDraft()
    wx.navigateTo({ url: '/pages/upload/index' })
  },

  trySample() {
    resetDraft()
    updateDraft({
      photo: {
        localPath: WINDOW_SOLUTIONS[0].beforeImage,
        width: 720,
        height: 900,
        size: 0,
        isSample: true,
      },
      selection: { x: 0.12, y: 0.12, width: 0.76, height: 0.7 },
    })
    wx.navigateTo({ url: '/pages/solution-select/index' })
  },

  goSolutions() {
    wx.switchTab({ url: '/pages/solutions/index' })
  },

  onSolutionSelect(event: WechatMiniprogram.CustomEvent<{ id: string }>) {
    const solution = WINDOW_SOLUTIONS.find((item) => item.id === event.detail.id)
    if (!solution) return
    resetDraft()
    updateDraft({ solution })
    wx.navigateTo({ url: '/pages/upload/index' })
  },
})

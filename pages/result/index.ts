import { gateway } from '../../services/index'
import { ensureSession } from '../../services/auth'
import { getDraft, getHistory, isFavorite, updateDraft } from '../../store/session'
import type { RenderResult, WindowSolution } from '../../types/index'

Page({
  data: {
    solution: null as WindowSolution | null,
    result: null as RenderResult | null,
    comparePercent: 50,
    stageWidth: 0,
    favorite: false,
  },

  compareRect: null as WechatMiniprogram.BoundingClientRectCallbackResult | null,

  onLoad() {
    const draft = getDraft()
    const result = getHistory().find((item) => item.taskId === draft.taskId)
    if (!draft.solution || !result) {
      wx.showToast({ title: '效果记录已失效，请重新生成', icon: 'none' })
      wx.navigateBack()
      return
    }
    this.setData({
      solution: draft.solution,
      result,
      favorite: isFavorite(draft.solution.id),
    })
  },

  onReady() {
    this.createSelectorQuery()
      .select('.compare-stage')
      .boundingClientRect((rect) => {
        if (!rect || Array.isArray(rect)) return
        this.compareRect = rect
        this.setData({ stageWidth: rect.width })
      })
      .exec()
  },

  onCompareTouch(event: WechatMiniprogram.TouchEvent) {
    if (!this.compareRect || event.touches.length === 0) return
    const x = event.touches[0].clientX - this.compareRect.left
    const percent = Math.min(Math.max((x / this.compareRect.width) * 100, 6), 94)
    this.setData({ comparePercent: Number(percent.toFixed(2)) })
  },

  async toggleFavorite() {
    const solution = this.data.solution
    if (!solution) return
    if (!(await ensureSession())) return
    const favorite = await gateway.favoriteSolution(solution.id)
    this.setData({ favorite })
    wx.showToast({ title: favorite ? '已收藏方案' : '已取消收藏', icon: 'none' })
  },

  regenerate() {
    updateDraft({ taskId: '' })
    wx.navigateTo({ url: '/pages/solution-select/index' })
  },

  async bookMeasure() {
    if (!(await ensureSession())) return
    wx.navigateTo({ url: '/pages/appointment/index' })
  },

  onShareAppMessage() {
    return {
      title: '华业门窗：提前看看换窗效果',
      path: '/pages/home/index',
      imageUrl: this.data.solution?.thumbnail,
    }
  },
})

import { WINDOW_SOLUTIONS } from '../../data/solutions'
import { resetDraft, updateDraft } from '../../store/session'

const COMPARE_MIN_POSITION = 8
const COMPARE_MAX_POSITION = 92
const COMPARE_INITIAL_POSITION = 46
const COMPARE_INTRO_POSITION = 62
const COMPARE_REST_POSITION = 54

let compareIntroTimers: number[] = []

function clearCompareIntroTimers() {
  compareIntroTimers.forEach((timer) => clearTimeout(timer))
  compareIntroTimers = []
}

Page({
  data: {
    featuredSolutions: WINDOW_SOLUTIONS,
    comparePosition: COMPARE_INITIAL_POSITION,
    compareAnimating: false,
    compareDragging: false,
  },

  onReady() {
    clearCompareIntroTimers()
    compareIntroTimers = [
      setTimeout(() => {
        this.setData({ compareAnimating: true, comparePosition: COMPARE_INTRO_POSITION })
      }, 420),
      setTimeout(() => {
        this.setData({ comparePosition: COMPARE_REST_POSITION })
      }, 1280),
      setTimeout(() => {
        this.setData({ compareAnimating: false })
      }, 2140),
    ]
  },

  onShow() {
    wx.setNavigationBarColor({ frontColor: '#000000', backgroundColor: '#F3F2EE' })
    this.getTabBar?.()?.setData({ selected: 0 })
  },

  onUnload() {
    clearCompareIntroTimers()
  },

  onCompareStart(event: WechatMiniprogram.TouchEvent) {
    clearCompareIntroTimers()
    this.setData({ compareAnimating: false, compareDragging: true })
    this.updateComparePosition(event)
  },

  onCompareMove(event: WechatMiniprogram.TouchEvent) {
    this.updateComparePosition(event)
  },

  onCompareEnd() {
    this.setData({ compareDragging: false })
  },

  updateComparePosition(event: WechatMiniprogram.TouchEvent) {
    const touch = event.touches[0] || event.changedTouches[0]
    if (!touch) return

    const { windowWidth } = wx.getWindowInfo()
    const rawPosition = (touch.clientX / windowWidth) * 100
    const comparePosition = Math.min(COMPARE_MAX_POSITION, Math.max(COMPARE_MIN_POSITION, rawPosition))
    this.setData({ comparePosition })
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

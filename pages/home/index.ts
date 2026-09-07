import { ensureSession } from '../../services/auth'
import { gateway } from '../../services/index'
import { ApiError } from '../../services/http-client'
import { resetDraft, updateDraft } from '../../store/session'
import type { WindowSolution } from '../../types/index'

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
    featuredSolutions: [] as WindowSolution[],
    loadingSolutions: true,
    solutionsError: '',
    loadingSample: false,
    openingFlow: false,
    comparePosition: COMPARE_INITIAL_POSITION,
    compareAnimating: false,
    compareDragging: false,
    labelTop: 96,
  },

  onLoad() {
    // 首页使用自定义导航，对比标签需要避开状态栏与右上角胶囊按钮。
    const { statusBarHeight } = wx.getWindowInfo()
    let labelTop = statusBarHeight + 52
    try {
      const menu = wx.getMenuButtonBoundingClientRect()
      if (menu && menu.bottom > 0) labelTop = menu.bottom + 12
    } catch {
      // 部分环境不支持胶囊测量，保留状态栏估算值。
    }
    this.setData({ labelTop })
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
    wx.setNavigationBarColor({ frontColor: '#000000', backgroundColor: '#F8F5F0' })
    this.getTabBar?.()?.setData({ selected: 0 })
    void this.loadFeatured()
  },

  /** 首页与方案页共用真实目录，下架或服务失败时不回退到内置假数据。 */
  async loadFeatured() {
    this.setData({ loadingSolutions: true, solutionsError: '' })
    try {
      const featuredSolutions = await gateway.listSolutions()
      this.setData({ featuredSolutions })
    } catch {
      this.setData({ solutionsError: '方案暂时无法加载，请稍后重试。' })
    } finally {
      this.setData({ loadingSolutions: false })
    }
  },

  onHide() {
    clearCompareIntroTimers()
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

  async goUpload() {
    if (this.data.openingFlow || this.data.loadingSample) return
    this.setData({ openingFlow: true })
    try {
      if (!(await ensureSession())) return
      resetDraft()
      wx.navigateTo({ url: '/pages/upload/index' })
    } finally { this.setData({ openingFlow: false }) }
  },

  /** 样例无需登录，图像尺寸、默认框选和稳定 ID 全部来自样例接口。 */
  async trySample() {
    if (this.data.loadingSample || this.data.openingFlow) return
    this.setData({ loadingSample: true })
    try {
      const [sample] = await gateway.listSampleScenes()
      if (!sample) { wx.showToast({ title: '暂无可用示例照片', icon: 'none' }); return }
      resetDraft()
      updateDraft({
        photo: {
          sampleSceneId: sample.id, localPath: sample.thumbnailUrl,
          width: sample.width, height: sample.height, size: 0, isSample: true,
        },
        selection: sample.defaultSelection,
      })
      wx.navigateTo({ url: '/pages/solution-select/index' })
    } catch (error) {
      wx.showToast({ title: error instanceof ApiError ? error.message : '示例照片加载失败，请重试', icon: 'none' })
    } finally { this.setData({ loadingSample: false }) }
  },

  goSolutions() {
    wx.switchTab({ url: '/pages/solutions/index' })
  },

  async onSolutionSelect(event: WechatMiniprogram.CustomEvent<{ id: string }>) {
    if (this.data.openingFlow || this.data.loadingSample) return
    this.setData({ openingFlow: true })
    try {
      if (!(await ensureSession())) return
      const solution = await gateway.getSolution(event.detail.id)
      resetDraft()
      updateDraft({ solution })
      wx.navigateTo({ url: '/pages/upload/index' })
    } catch (error) {
      wx.showToast({ title: error instanceof ApiError ? error.message : '方案加载失败，请重试', icon: 'none' })
    } finally { this.setData({ openingFlow: false }) }
  },
})

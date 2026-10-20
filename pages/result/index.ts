import { gateway } from '../../services/index'
import { ensureSession, getSessionUserId } from '../../services/auth'
import { getSubmissions } from '../../store/renders'
import { getDraft, isFavorite, updateDraft } from '../../store/session'
import type { RenderResult, RenderSolutionSnapshot } from '../../types/index'

Page({
  data: {
    solution: null as RenderSolutionSnapshot | null,
    result: null as RenderResult | null,
    comparePercent: 50,
    stageWidth: 0,
    favorite: false,
    stageHeight: 0,
    loading: false,
    loadError: '',
  },

  compareRect: null as WechatMiniprogram.BoundingClientRectCallbackResult | null,

  resultId: '',
  visible: false,
  refreshedForImageError: false,
  userId: '',
  epoch: 0,
  onLoad(options: Record<string, string | undefined>) { this.resultId = options.resultId || ''; this.userId = getSessionUserId() || '' },
  onShow() {
    this.visible = true
    const userId = getSessionUserId() || ''
    if (this.userId !== userId) {
      this.userId = userId; this.epoch++; this.refreshedForImageError = false
      // 有效的签名仍属于原账户，切换身份立即移除像素，不能等新请求返回才清空。
      this.setData({ result: null, solution: null, favorite: false, loading: false, loadError: '' })
    }
    if (!this.data.result || Date.parse(this.data.result.imageUrlExpiresAt) <= Date.now() + 30000) void this.loadResult()
  },
  onHide() { this.visible = false; this.epoch++; this.setData({ loading: false }) },
  onUnload() { this.visible = false; this.epoch++ },
  /** 每次详情都从服务器刷新签名；历史回看不依赖内存草稿或方案仍在目录中。 */
  async loadResult() {
    if (this.data.loading) return
    const epoch = ++this.epoch, userId = this.userId
    this.setData({ loading: true, loadError: '' })
    try {
      const result = await gateway.getRenderResult(this.resultId)
      if (!this.visible || epoch !== this.epoch || userId !== getSessionUserId()) return
      this.setData({ result, solution: result.solution, favorite: isFavorite(result.solutionId) }, () => this.measureComparison())
    } catch (error) {
      if (this.visible && epoch === this.epoch) this.setData({ loadError: error instanceof Error ? error.message : '结果加载失败，请重试' })
    } finally { if (epoch === this.epoch) this.setData({ loading: false }) }
  },
  onReady() { this.measureComparison() },
  measureComparison() {
    this.createSelectorQuery()
      .select('.compare-stage')
      .boundingClientRect((rect) => {
        if (!rect || Array.isArray(rect)) return
        this.compareRect = rect
        const result = this.data.result
        this.setData({ stageWidth: rect.width, stageHeight: result ? rect.width * result.height / result.width : 0 })
      })
      .exec()
  },
  /** 自动刷新一次防止损坏图片造成无限请求；之后展示明确的手动重试入口。 */
  onImageError() {
    if (!this.refreshedForImageError) { this.refreshedForImageError = true; void this.loadResult() }
    else this.setData({ loadError: '图片加载失败，请重新加载结果' })
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
    const result = this.data.result
    const record = getSubmissions(getSessionUserId() || '').find((item) => item.taskId === result?.taskId)
    // 历史回看不能意外带入另一个房间；只恢复当前结果所对应的设备草稿。
    const draft = record?.draft || (getDraft().taskId === result?.taskId ? getDraft() : null)
    if (!draft?.photo) { wx.switchTab({ url: '/pages/home/index' }); return }
    updateDraft(draft)
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
    }
  },
})

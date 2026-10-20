import { ensureSession, getSessionUserId } from '../../services/auth'
import { ApiError } from '../../services/http-client'
import { gateway } from '../../services/index'
import { getFavoriteIds, getLeads } from '../../store/session'
import { getSubmissions } from '../../store/renders'
import type { RenderSubmission } from '../../store/renders'
import type { LocalHistoryItem, LocalLead, WindowSolution } from '../../types/index'

type ProfileView = 'history' | 'favorites' | 'appointments'

Page({
  data: {
    activeView: 'history' as ProfileView,
    history: [] as LocalHistoryItem[],
    favorites: [] as WindowSolution[],
    leads: [] as LocalLead[],
    favoritesError: '',
    clearing: false,
    historyError: '',
    historyLoading: false,
    historyTotal: 0,
    historyPage: 0,
    hasNext: false,
    pending: [] as RenderSubmission[],
  },

  historyEpoch: 0,

  onShow() {
    this.getTabBar?.()?.setData({ selected: 2 })
    void this.refreshData()
  },

  /** 收藏 ID 暂存本地，但展示的方案及可用状态必须取自真实目录。 */
  async refreshData() {
    const favoriteIds = getFavoriteIds()
    this.setData({
      history: [], historyPage: 0, historyTotal: 0, hasNext: false, historyError: '',
      pending: getSessionUserId() ? getSubmissions(getSessionUserId()!).filter((item) => !item.resultId) : [],
      favorites: [],
      favoritesError: '',
      leads: getLeads(),
    })
    // 游客不触发登录弹窗；登录后历史来自服务器，可回看其他设备生成的结果。
    const history = getSessionUserId() ? this.loadHistory(true) : Promise.resolve()
    if (!favoriteIds.length) { await history; return }
    try {
      const solutions = await gateway.listSolutions()
      this.setData({ favorites: solutions.filter((solution) => getFavoriteIds().includes(solution.id)) })
    } catch { this.setData({ favoritesError: '收藏方案加载失败，请重试。' }) }
    await history
  },

  /** 分页去重并校验账户，旧页面请求不得把前一个账户的记录写回。 */
  async loadHistory(reset = false) {
    if (this.data.historyLoading && !reset) return
    const userId = getSessionUserId()
    if (!userId) return
    const epoch = ++this.historyEpoch
    const page = reset ? 1 : this.data.historyPage + 1
    this.setData({ historyLoading: true, historyError: '' })
    try {
      const response = await gateway.listRenderResults(page)
      if (epoch !== this.historyEpoch || userId !== getSessionUserId()) return
      const items = response.items.map((result) => ({ ...result, solutionName: result.solution.name, thumbnail: result.afterImage }))
      const combined = reset ? items : [...this.data.history, ...items]
      this.setData({ history: [...new Map(combined.map((item) => [item.id, item])).values()],
        historyPage: page, historyTotal: response.total, hasNext: response.hasNext })
    } catch (error) {
      if (epoch === this.historyEpoch) this.setData({ historyError: error instanceof Error ? error.message : '历史加载失败，请重试' })
    } finally { if (epoch === this.historyEpoch) this.setData({ historyLoading: false }) }
  },
  onReachBottom() { if (this.data.hasNext) void this.loadHistory() },
  retryHistory() { void this.loadHistory(this.data.historyPage === 0) },
  openResult(event: WechatMiniprogram.TouchEvent) { wx.navigateTo({ url: `/pages/result/index?resultId=${encodeURIComponent(String(event.currentTarget.dataset.id))}` }) },
  continueTask(event: WechatMiniprogram.TouchEvent) { wx.navigateTo({ url: `/pages/generating/index?submissionKey=${encodeURIComponent(String(event.currentTarget.dataset.key))}` }) },

  switchView(event: WechatMiniprogram.TouchEvent) {
    this.setData({ activeView: event.currentTarget.dataset.view as ProfileView })
  },

  startExperience() {
    wx.switchTab({ url: '/pages/home/index' })
  },

  browseSolutions() {
    wx.switchTab({ url: '/pages/solutions/index' })
  },

  /** 隐私规则不应只在首次登录时出现，用户可从个人中心随时重新查阅。 */
  openPrivacyGuide() {
    wx.navigateTo({ url: '/pages/privacy/index' })
  },

  async clearData() {
    if (this.data.clearing) return
    if (!(await ensureSession())) return
    wx.showModal({
      title: '清除照片与记录',
      content: '将删除本设备记录的已上传照片、效果记录、收藏和预约信息。其他设备上传的照片及账户信息不在本次清理范围内。此操作无法撤销。',
      confirmText: '确认清除',
      confirmColor: '#A43F37',
      success: (result) => {
        if (!result.confirm) return
        this.setData({ clearing: true })
        void gateway.clearUserData().then(async () => {
          await this.refreshData()
          wx.showToast({ title: '记录已清除', icon: 'success' })
        }).catch((error: unknown) => {
          wx.showToast({ title: error instanceof ApiError ? error.message : '部分记录未清除，请重试', icon: 'none' })
        }).finally(() => this.setData({ clearing: false }))
      },
    })
  },
})

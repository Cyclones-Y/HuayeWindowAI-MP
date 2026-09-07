import { ensureSession } from '../../services/auth'
import { ApiError } from '../../services/http-client'
import { gateway } from '../../services/index'
import { getFavoriteIds, getHistory, getLeads } from '../../store/session'
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
  },

  onShow() {
    this.getTabBar?.()?.setData({ selected: 2 })
    void this.refreshData()
  },

  /** 收藏 ID 暂存本地，但展示的方案及可用状态必须取自真实目录。 */
  async refreshData() {
    const favoriteIds = getFavoriteIds()
    this.setData({
      history: getHistory(),
      favorites: [],
      favoritesError: '',
      leads: getLeads(),
    })
    if (!favoriteIds.length) return
    try {
      const solutions = await gateway.listSolutions()
      this.setData({ favorites: solutions.filter((solution) => getFavoriteIds().includes(solution.id)) })
    } catch { this.setData({ favoritesError: '收藏方案加载失败，请重试。' }) }
  },

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

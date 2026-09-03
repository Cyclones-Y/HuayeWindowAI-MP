import { WINDOW_SOLUTIONS } from '../../data/solutions'
import { ensureSession } from '../../services/auth'
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
  },

  onShow() {
    this.getTabBar?.()?.setData({ selected: 2 })
    this.refreshData()
  },

  refreshData() {
    const favoriteIds = getFavoriteIds()
    this.setData({
      history: getHistory(),
      favorites: WINDOW_SOLUTIONS.filter((solution) => favoriteIds.includes(solution.id)),
      leads: getLeads(),
    })
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
    if (!(await ensureSession())) return
    wx.showModal({
      title: '清除全部记录',
      content: '将删除效果记录、收藏方案和预约信息。此操作无法撤销。',
      confirmText: '确认清除',
      confirmColor: '#A43F37',
      success: (result) => {
        if (!result.confirm) return
        void gateway.clearUserData().then(() => {
          this.refreshData()
          wx.showToast({ title: '记录已清除', icon: 'success' })
        })
      },
    })
  },
})

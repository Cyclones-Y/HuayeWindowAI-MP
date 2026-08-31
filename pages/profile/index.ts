import { WINDOW_SOLUTIONS } from '../../data/solutions'
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

  clearData() {
    wx.showModal({
      title: '清除演示数据',
      content: '将删除本机保存的历史、收藏和预约演示记录。此操作无法撤销。',
      confirmText: '确认清除',
      confirmColor: '#A43F37',
      success: (result) => {
        if (!result.confirm) return
        void gateway.clearUserData().then(() => {
          this.refreshData()
          wx.showToast({ title: '演示数据已清除', icon: 'success' })
        })
      },
    })
  },
})

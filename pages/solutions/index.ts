import { gateway } from '../../services/index'
import { ensureSession } from '../../services/auth'
import { ApiError } from '../../services/http-client'
import { resetDraft, updateDraft } from '../../store/session'
import type { NeedType, RoomType, WindowSolution } from '../../types/index'

type FilterValue = 'ALL' | RoomType | NeedType

Page({
  data: {
    loading: true,
    errorText: '',
    openingSolution: false,
    solutions: [] as WindowSolution[],
    filteredSolutions: [] as WindowSolution[],
    activeRoom: 'ALL' as FilterValue,
    activeNeed: 'ALL' as FilterValue,
    roomFilters: [
      { value: 'ALL', label: '全部空间' },
      { value: 'LIVING_ROOM', label: '客厅' },
      { value: 'BEDROOM', label: '卧室' },
      { value: 'BALCONY', label: '阳台' },
    ],
    needFilters: [
      { value: 'ALL', label: '全部需求' },
      { value: 'QUIET', label: '隔音' },
      { value: 'INSULATION', label: '保温' },
      { value: 'SAFETY', label: '安全' },
      { value: 'VENTILATION', label: '通风' },
    ],
  },

  onLoad() {
    void this.loadSolutions()
  },

  onShow() {
    this.getTabBar?.()?.setData({ selected: 1 })
  },

  async loadSolutions() {
    this.setData({ loading: true, errorText: '' })
    try {
      const solutions = await gateway.listSolutions()
      this.setData({ solutions, loading: false })
      this.applyFilters()
    } catch {
      this.setData({ loading: false, errorText: '方案暂时没有加载成功，请稍后重试。' })
    }
  },

  selectRoom(event: WechatMiniprogram.TouchEvent) {
    this.setData({ activeRoom: event.currentTarget.dataset.value as FilterValue })
    this.applyFilters()
  },

  selectNeed(event: WechatMiniprogram.TouchEvent) {
    this.setData({ activeNeed: event.currentTarget.dataset.value as FilterValue })
    this.applyFilters()
  },

  applyFilters() {
    const { solutions, activeRoom, activeNeed } = this.data
    const filteredSolutions = solutions.filter((solution) => {
      const roomMatched = activeRoom === 'ALL' || solution.room === activeRoom
      const needMatched = activeNeed === 'ALL' || solution.needs.includes(activeNeed as NeedType)
      return roomMatched && needMatched
    })
    this.setData({ filteredSolutions })
  },

  async onSolutionSelect(event: WechatMiniprogram.CustomEvent<{ id: string }>) {
    if (this.data.openingSolution) return
    this.setData({ openingSolution: true })
    try {
      if (!(await ensureSession())) return
      // 点击时重新读取详情，避免目录加载后被下架的方案仍能继续进入流程。
      const solution = await gateway.getSolution(event.detail.id)
      resetDraft()
      updateDraft({ solution })
      wx.navigateTo({ url: '/pages/upload/index' })
    } catch (error) {
      wx.showToast({ title: error instanceof ApiError ? error.message : '方案加载失败，请重试', icon: 'none' })
    } finally { this.setData({ openingSolution: false }) }
  },
})

import { gateway } from '../../services/index'
import { resetDraft, updateDraft } from '../../store/session'
import type { NeedType, RoomType, WindowSolution } from '../../types/index'

type FilterValue = 'ALL' | RoomType | NeedType

Page({
  data: {
    loading: true,
    errorText: '',
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

  async loadSolutions() {
    this.setData({ loading: true, errorText: '' })
    try {
      const solutions = await gateway.listSolutions()
      this.setData({ solutions, filteredSolutions: solutions, loading: false })
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

  onSolutionSelect(event: WechatMiniprogram.CustomEvent<{ id: string }>) {
    const solution = this.data.solutions.find((item) => item.id === event.detail.id)
    if (!solution) return
    resetDraft()
    updateDraft({ solution })
    wx.navigateTo({ url: '/pages/upload/index' })
  },
})

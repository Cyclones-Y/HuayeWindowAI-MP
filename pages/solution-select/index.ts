import { gateway } from '../../services/index'
import { getDraft, updateDraft } from '../../store/session'
import type { NeedType, WindowSolution } from '../../types/index'

type NeedFilter = 'ALL' | NeedType

Page({
  data: {
    loading: true,
    errorText: '',
    solutions: [] as WindowSolution[],
    filteredSolutions: [] as WindowSolution[],
    selectedId: '',
    activeNeed: 'ALL' as NeedFilter,
    needFilters: [
      { value: 'ALL', label: '全部方案' },
      { value: 'QUIET', label: '隔音优先' },
      { value: 'INSULATION', label: '保温优先' },
      { value: 'SAFETY', label: '安全优先' },
      { value: 'VENTILATION', label: '通风优先' },
    ],
  },

  onLoad() {
    this.setData({ selectedId: getDraft().solution?.id || '' })
    void this.loadSolutions()
  },

  async loadSolutions() {
    this.setData({ loading: true, errorText: '' })
    try {
      const solutions = await gateway.listSolutions()
      this.setData({ solutions, filteredSolutions: solutions, loading: false })
    } catch {
      this.setData({ loading: false, errorText: '方案没有加载成功，请稍后重试。' })
    }
  },

  selectNeed(event: WechatMiniprogram.TouchEvent) {
    const activeNeed = event.currentTarget.dataset.value as NeedFilter
    const filteredSolutions = this.data.solutions.filter((solution) => activeNeed === 'ALL' || solution.needs.includes(activeNeed))
    this.setData({ activeNeed, filteredSolutions })
  },

  onSolutionSelect(event: WechatMiniprogram.CustomEvent<{ id: string }>) {
    this.setData({ selectedId: event.detail.id })
  },

  continueFlow() {
    const solution = this.data.solutions.find((item) => item.id === this.data.selectedId)
    if (!solution) {
      wx.showToast({ title: '请先选择一个方案', icon: 'none' })
      return
    }
    updateDraft({
      solution,
      frameColorCode: solution.frameColors[0].code,
      glassCode: solution.glassOptions[0].code,
    })
    wx.navigateTo({ url: '/pages/confirm/index' })
  },
})

import { gateway } from '../../services/index'
import { ApiError } from '../../services/http-client'
import { getDraft, updateDraft } from '../../store/session'
import type { NeedType, WindowSolution } from '../../types/index'

type NeedFilter = 'ALL' | NeedType

Page({
  data: {
    loading: true,
    continuing: false,
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
      const selectedId = solutions.some((solution) => solution.id === this.data.selectedId) ? this.data.selectedId : ''
      const filteredSolutions = solutions.filter((solution) => this.data.activeNeed === 'ALL' || solution.needs.includes(this.data.activeNeed))
      this.setData({ solutions, filteredSolutions, selectedId, loading: false })
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

  /** 以最新详情的有效配置和默认代码进入确认页，不依赖本地目录的数组顺序。 */
  async continueFlow() {
    if (this.data.continuing || this.data.loading) return
    if (!this.data.selectedId) {
      wx.showToast({ title: '请先选择一个方案', icon: 'none' })
      return
    }
    this.setData({ continuing: true })
    try {
      const solution = await gateway.getSolution(this.data.selectedId)
      if (!solution.frameColors.length || !solution.glassOptions.length) {
        wx.showToast({ title: '该方案配置暂不可用，请重新选择', icon: 'none' })
        return
      }
      updateDraft({
        solution,
        frameColorCode: solution.defaultFrameColorCode || solution.frameColors[0].code,
        glassCode: solution.defaultGlassCode || solution.glassOptions[0].code,
      })
      wx.navigateTo({ url: '/pages/confirm/index' })
    } catch (error) {
      wx.showToast({ title: error instanceof ApiError ? error.message : '方案加载失败，请重试', icon: 'none' })
    } finally { this.setData({ continuing: false }) }
  },
})

import { gateway } from '../../services/index'
import { getDraft, saveHistory, updateDraft } from '../../store/session'
import type { RenderStatus, WindowSolution } from '../../types/index'

Page({
  data: {
    status: 'DRAFT' as RenderStatus,
    progress: 0,
    stageText: '正在准备演示任务',
    errorMessage: '',
    solution: null as WindowSolution | null,
  },

  pollTimer: undefined as ReturnType<typeof setInterval> | undefined,
  forceFailure: false,

  onLoad(options: Record<string, string | undefined>) {
    const solution = getDraft().solution
    if (!solution) {
      wx.showToast({ title: '请先选择方案', icon: 'none' })
      wx.navigateBack()
      return
    }
    this.forceFailure = options.fail === '1'
    this.setData({ solution })
    void this.createTask()
  },

  onUnload() {
    this.stopPolling()
  },

  async createTask() {
    const solution = this.data.solution
    if (!solution) return
    this.stopPolling()
    this.setData({ status: 'QUEUED', progress: 8, stageText: '正在创建演示任务', errorMessage: '' })
    try {
      const task = await gateway.createRenderTask({ solution, forceFailure: this.forceFailure })
      updateDraft({ taskId: task.id })
      this.applyTask(task)
      this.pollTimer = setInterval(() => void this.pollTask(), 650)
    } catch {
      this.setData({ status: 'FAILED', errorMessage: '演示任务创建失败，请重试。', stageText: '任务未创建' })
    }
  },

  async pollTask() {
    const taskId = getDraft().taskId
    if (!taskId) return
    const task = await gateway.getRenderTask(taskId)
    this.applyTask(task)
    if (task.status === 'FAILED') this.stopPolling()
    if (task.status === 'SUCCEEDED' && task.result && this.data.solution) {
      this.stopPolling()
      saveHistory(task.result, this.data.solution)
      setTimeout(() => wx.redirectTo({ url: '/pages/result/index' }), 420)
    }
  },

  applyTask(task: { status: RenderStatus; progress: number; stageText: string; errorMessage?: string }) {
    this.setData({
      status: task.status,
      progress: task.progress,
      stageText: task.stageText,
      errorMessage: task.errorMessage || '',
    })
  },

  retryTask() {
    this.forceFailure = false
    void this.createTask()
  },

  stopPolling() {
    if (this.pollTimer) clearInterval(this.pollTimer)
    this.pollTimer = undefined
  },
})

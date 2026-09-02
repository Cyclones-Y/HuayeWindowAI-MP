import { gateway } from '../../services/index'
import { getDraft, saveHistory, updateDraft } from '../../store/session'
import type { RenderStatus, WindowSolution } from '../../types/index'
import { computeOverlayRect, fitStageSize, overlayStyle } from '../../utils/selection-overlay'

Page({
  data: {
    status: 'DRAFT' as RenderStatus,
    progress: 0,
    stageText: '正在准备生成',
    errorMessage: '',
    solution: null as WindowSolution | null,
    photoPath: '',
    overlayStyle: '',
    stageStyle: '',
  },

  pollTimer: undefined as ReturnType<typeof setInterval> | undefined,
  forceFailure: false,

  onLoad(options: Record<string, string | undefined>) {
    const draft = getDraft()
    const solution = draft.solution
    if (!solution) {
      wx.showToast({ title: '请先选择方案', icon: 'none' })
      wx.navigateBack()
      return
    }
    this.forceFailure = options.fail === '1'
    this.setData({ solution, photoPath: draft.photo?.localPath || solution.beforeImage })
    void this.createTask()
  },

  onReady() {
    this.measureOverlay()
  },

  onUnload() {
    this.stopPolling()
  },

  measureOverlay() {
    const { photo, selection } = getDraft()
    if (!photo) return
    this.createSelectorQuery()
      .select('.generation-stage')
      .boundingClientRect((rect) => {
        if (!rect || Array.isArray(rect)) return
        const rpx = rect.width / 686
        const stage = fitStageSize(photo, rect.width, 480 * rpx, 860 * rpx)
        const overlay = selection ? overlayStyle(computeOverlayRect(photo, selection, stage.width, stage.height)) : ''
        this.setData({ stageStyle: `width: ${stage.width}px; height: ${stage.height}px;`, overlayStyle: overlay })
      })
      .exec()
  },

  async createTask() {
    const solution = this.data.solution
    if (!solution) return
    this.stopPolling()
    this.setData({ status: 'QUEUED', progress: 8, stageText: '正在创建生成任务', errorMessage: '' })
    try {
      const task = await gateway.createRenderTask({ solution, forceFailure: this.forceFailure })
      updateDraft({ taskId: task.id })
      this.applyTask(task)
      this.pollTimer = setInterval(() => void this.pollTask(), 650)
    } catch {
      this.setData({ status: 'FAILED', errorMessage: '生成任务创建失败，请重试。', stageText: '任务未创建' })
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
    // 失败面板会替换掉照片舞台，重试后需要等舞台重新出现再定位选框。
    setTimeout(() => this.measureOverlay(), 60)
  },

  goBack() {
    wx.navigateBack()
  },

  stopPolling() {
    if (this.pollTimer) clearInterval(this.pollTimer)
    this.pollTimer = undefined
  },
})

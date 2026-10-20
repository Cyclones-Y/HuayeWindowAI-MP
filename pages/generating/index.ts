/** 页面仅展示持久任务；创建、查询都复用本设备已保存的提交标识。 */
import { getSessionUserId } from '../../services/auth'
import { ApiError } from '../../services/http-client'
import { gateway } from '../../services/index'
import { beginSubmission, getSubmissions, requestId, updateSubmission } from '../../store/renders'
import type { RenderSubmission } from '../../store/renders'
import { getDraft, updateDraft } from '../../store/session'
import type { RenderTask, RenderStatus, WindowSolution } from '../../types/index'
import { RenderPoller, stageSteps } from '../../utils/render-poller'
import { computeOverlayRect, fitStageSize, overlayStyle } from '../../utils/selection-overlay'

Page({
  data: { status: 'DRAFT' as RenderStatus, stageText: '正在提交任务', errorMessage: '', connectionText: '',
    retryable: false, submitting: false, submissionError: false,
    steps: stageSteps('QUEUED', 'DRAFT'), solution: null as WindowSolution | null,
    photoPath: '', overlayStyle: '', stageStyle: '' },
  poller: null as RenderPoller<RenderTask> | null,
  record: null as RenderSubmission | null,
  userId: '',
  visible: false,

  onLoad(options: Record<string, string | undefined>) {
    this.userId = getSessionUserId() || ''
    this.record = getSubmissions(this.userId).find((item) => options.submissionKey ? item.key === options.submissionKey
      : options.taskId ? item.taskId === options.taskId : !item.resultId) || null
    if (!this.userId || !this.record) {
      this.setData({ submissionError: true, errorMessage: '找不到当前账户的任务，请返回重新选择' })
      return
    }
    if (this.record.draft) updateDraft(this.record.draft)
    this.setData({ solution: this.record.draft?.solution || null, photoPath: this.record.draft?.photo?.localPath || '' })
    this.buildPoller()
  },
  onReady() { this.measureOverlay() },
  onShow() { this.visible = true; this.poller?.resume() },
  onHide() { this.visible = false; this.poller?.pause() },
  onUnload() { this.visible = false; this.poller?.pause() },

  /** query 同时承担响应丢失后的幂等恢复；即使页面隐藏也保存已收到的任务 ID。 */
  buildPoller() {
    this.poller?.pause()
    this.poller = new RenderPoller(async () => {
      const record = this.record
      if (!record || getSessionUserId() !== this.userId) throw new ApiError('ACCOUNT_CHANGED', '账户已切换，请返回', 403)
      if (!record.taskId) updateSubmission(this.userId, record.key, { attempted: true })
      const task = record.taskId ? await gateway.getRenderTask(record.taskId)
        : record.retryOf ? await gateway.retryRenderTask(record.retryOf, record.key, this.userId)
        : await gateway.createRenderTask(record.input, record.key, this.userId)
      if (getSessionUserId() !== this.userId) throw new ApiError('ACCOUNT_CHANGED', '账户已切换，请返回', 403)
      this.record = updateSubmission(this.userId, record.key, { taskId: task.id, rejected: false, ...(task.resultId ? { resultId: task.resultId } : {}) })
      // 详情失败属于连接问题，保留成功任务继续读取，不能重新触发生成。
      if (task.status === 'SUCCEEDED' && task.resultId) await gateway.getRenderResult(task.resultId)
      return task
    }, (task) => {
      const steps = stageSteps(task.stage, task.status)
      this.setData({ status: task.status, stageText: task.status === 'FAILED' ? `${steps.find((item) => item.value === task.stage)?.label || '生成'}未完成` : task.stageText, connectionText: '', submissionError: false,
        errorMessage: task.failure?.message || '', retryable: task.failure?.retryable || false,
        steps })
      if (task.status === 'SUCCEEDED' && task.resultId) wx.redirectTo({ url: `/pages/result/index?resultId=${task.resultId}` })
    }, (error) => {
      // 确定的服务拒绝停止自动发送；弱网只退避，不伪造服务端失败终态。
      if (error instanceof ApiError && ((!['NETWORK_ERROR', 'INVALID_RESPONSE'].includes(error.code) && error.statusCode < 500)
        || error.code === 'RENDER_NOT_ENABLED')) {
        this.poller?.pause()
        // 明确的输入/禁用错误表示未入队，允许设备清理丢弃该提交；未知响应继续保留。
        if (this.record && !this.record.taskId && (error.code === 'RENDER_NOT_ENABLED' || [400, 422].includes(error.statusCode))) {
          this.record = updateSubmission(this.userId, this.record.key, { rejected: true })
        }
        this.setData({ submissionError: true, errorMessage: error.message, connectionText: '' })
      } else this.setData({ connectionText: '连接暂时中断，正在重新连接' })
    })
  },
  measureOverlay() {
    const { photo, selection } = getDraft()
    if (!photo) return
    this.createSelectorQuery().select('.generation-stage').boundingClientRect((rect) => {
      if (!rect || Array.isArray(rect)) return
      const rpx = rect.width / 686
      const stage = fitStageSize(photo, rect.width, 480 * rpx, 860 * rpx)
      this.setData({ stageStyle: `width: ${stage.width}px; height: ${stage.height}px;`,
        overlayStyle: selection ? overlayStyle(computeOverlayRect(photo, selection, stage.width, stage.height)) : '' })
    }).exec()
  },
  reconnect() { this.setData({ submissionError: false }); this.poller?.resume() },
  retryTask() {
    if (this.data.submitting || !this.data.retryable || !this.record?.taskId) return
    wx.showModal({ title: '重新生成', content: '将创建新的生成任务，可能产生新的模型调用费用。是否继续？',
      success: (response) => {
        if (!response.confirm || !this.visible || getSessionUserId() !== this.userId || this.data.submitting) return
        this.setData({ submitting: true })
        try {
          const old = this.record!
          this.record = beginSubmission(this.userId, { ...old.input, clientRequestId: requestId() }, old.draft, old.taskId)
          this.setData({ status: 'DRAFT', stageText: '正在提交重试', errorMessage: '', retryable: false, steps: stageSteps('QUEUED', 'DRAFT') })
          this.buildPoller(); this.poller!.resume()
        } catch { wx.showToast({ title: '无法保存重试记录，请重试', icon: 'none' }) }
        finally { this.setData({ submitting: false }) }
      } })
  },
  goBack() { wx.navigateBack() },
})

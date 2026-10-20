import { getDraft, updateDraft } from '../../store/session'
import { ensureSession, getSessionUserId } from '../../services/auth'
import { beginSubmission, requestId } from '../../store/renders'
import type { ProductOption, WindowSolution } from '../../types/index'
import { computeOverlayRect, fitStageSize, overlayStyle } from '../../utils/selection-overlay'

Page({
  data: {
    photoPath: '',
    overlayStyle: '',
    stageStyle: '',
    solution: null as WindowSolution | null,
    frameColors: [] as ProductOption[],
    glassOptions: [] as ProductOption[],
    frameColorCode: '',
    glassCode: '',
    submitting: false,
  },

  onLoad() {
    const draft = getDraft()
    if (!draft.photo || !draft.solution) {
      wx.showToast({ title: '方案信息不完整', icon: 'none' })
      wx.navigateBack()
      return
    }
    this.setData({
      photoPath: draft.photo.localPath,
      solution: draft.solution,
      frameColors: draft.solution.frameColors,
      glassOptions: draft.solution.glassOptions,
      frameColorCode: draft.frameColorCode || draft.solution.frameColors[0].code,
      glassCode: draft.glassCode || draft.solution.glassOptions[0].code,
    })
  },

  onReady() {
    this.measureOverlay()
  },

  measureOverlay() {
    const { photo, selection } = getDraft()
    if (!photo) return
    this.createSelectorQuery()
      .select('.preview-stage')
      .boundingClientRect((rect) => {
        if (!rect || Array.isArray(rect)) return
        const rpx = rect.width / 686
        const stage = fitStageSize(photo, rect.width, 320 * rpx, 560 * rpx)
        const overlay = selection ? overlayStyle(computeOverlayRect(photo, selection, stage.width, stage.height)) : ''
        this.setData({ stageStyle: `width: ${stage.width}px; height: ${stage.height}px;`, overlayStyle: overlay })
      })
      .exec()
  },

  selectFrameColor(event: WechatMiniprogram.TouchEvent) {
    this.setData({ frameColorCode: String(event.currentTarget.dataset.code) })
  },

  selectGlass(event: WechatMiniprogram.TouchEvent) {
    this.setData({ glassCode: String(event.currentTarget.dataset.code) })
  },

  async startGeneration() {
    if (this.data.submitting) return
    this.setData({ submitting: true })
    try {
      // 样例可公开浏览，但真实生成同样需要账户归属。
      if (!(await ensureSession())) return
      const userId = getSessionUserId()
      if (!userId) return
      const draft = updateDraft({
        frameColorCode: this.data.frameColorCode,
        glassCode: this.data.glassCode,
        taskId: '',
      })
      if (!draft.photo || !draft.solution || !draft.selection) throw new Error('请补全照片、选区和方案')
      const record = beginSubmission(userId, {
        sourceType: draft.photo.isSample ? 'SAMPLE_SCENE' : 'UPLOADED_PHOTO',
        ...(draft.photo.isSample ? { sampleSceneId: draft.photo.sampleSceneId } : { photoId: draft.photo.photoId }),
        selection: draft.selection, solutionId: draft.solution.id, frameColorCode: draft.frameColorCode,
        glassCode: draft.glassCode, clientRequestId: requestId(),
      }, draft)
      await wx.navigateTo({ url: `/pages/generating/index?submissionKey=${record.key}` })
    } catch (error) { wx.showToast({ title: error instanceof Error ? error.message : '无法保存提交记录，请重试', icon: 'none' }) }
    finally { this.setData({ submitting: false }) }
  },
})

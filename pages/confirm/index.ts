import { getDraft, updateDraft } from '../../store/session'
import { ensureSession } from '../../services/auth'
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
    // 公开样例保留免登录体验，只有用户真实照片生成需要建立账号。
    if (!getDraft().photo?.isSample && !(await ensureSession())) return
    updateDraft({
      frameColorCode: this.data.frameColorCode,
      glassCode: this.data.glassCode,
      taskId: '',
    })
    wx.navigateTo({ url: '/pages/generating/index' })
  },
})

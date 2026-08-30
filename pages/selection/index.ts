import { getDraft, updateDraft } from '../../store/session'

interface Box {
  left: number
  top: number
  width: number
  height: number
}

interface TouchState {
  mode: string
  startX: number
  startY: number
  box: Box
}

const MIN_BOX_SIZE = 80

Page({
  data: {
    photoPath: '',
    stageReady: false,
    box: { left: 0, top: 0, width: 0, height: 0 } as Box,
    hintText: '拖动绿色边框，尽量只框住需要更换的门窗。',
  },

  stageRect: null as WechatMiniprogram.BoundingClientRectCallbackResult | null,
  touchState: null as TouchState | null,

  onLoad() {
    const photo = getDraft().photo
    if (!photo) {
      wx.showToast({ title: '请先选择照片', icon: 'none' })
      wx.navigateBack()
      return
    }
    this.setData({ photoPath: photo.localPath })
  },

  onImageLoad() {
    this.measureStage()
  },

  measureStage() {
    this.createSelectorQuery()
      .select('.selection-stage')
      .boundingClientRect((rect) => {
        if (!rect || Array.isArray(rect)) return
        this.stageRect = rect
        this.resetSelection()
        this.setData({ stageReady: true })
      })
      .exec()
  },

  resetSelection() {
    if (!this.stageRect) return
    const { width, height } = this.stageRect
    this.setData({
      box: {
        left: width * 0.12,
        top: height * 0.12,
        width: width * 0.76,
        height: height * 0.7,
      },
      hintText: '拖动绿色边框，尽量只框住需要更换的门窗。',
    })
  },

  onTouchStart(event: WechatMiniprogram.TouchEvent) {
    if (!this.stageRect || event.touches.length === 0) return
    const touch = event.touches[0]
    this.touchState = {
      mode: String(event.currentTarget.dataset.mode || 'move'),
      startX: touch.clientX,
      startY: touch.clientY,
      box: { ...this.data.box },
    }
  },

  onTouchMove(event: WechatMiniprogram.TouchEvent) {
    if (!this.stageRect || !this.touchState || event.touches.length === 0) return
    const touch = event.touches[0]
    const dx = touch.clientX - this.touchState.startX
    const dy = touch.clientY - this.touchState.startY
    const next = this.calculateBox(this.touchState.mode, this.touchState.box, dx, dy)
    this.setData({ box: next })
  },

  onTouchEnd() {
    this.touchState = null
  },

  calculateBox(mode: string, initial: Box, dx: number, dy: number): Box {
    const stageWidth = this.stageRect?.width || 0
    const stageHeight = this.stageRect?.height || 0
    let { left, top, width, height } = initial

    if (mode === 'move') {
      left = this.clamp(initial.left + dx, 0, stageWidth - width)
      top = this.clamp(initial.top + dy, 0, stageHeight - height)
      return { left, top, width, height }
    }

    if (mode.includes('w')) {
      const nextLeft = this.clamp(initial.left + dx, 0, initial.left + initial.width - MIN_BOX_SIZE)
      width = initial.width + initial.left - nextLeft
      left = nextLeft
    }
    if (mode.includes('e')) {
      width = this.clamp(initial.width + dx, MIN_BOX_SIZE, stageWidth - initial.left)
    }
    if (mode.includes('n')) {
      const nextTop = this.clamp(initial.top + dy, 0, initial.top + initial.height - MIN_BOX_SIZE)
      height = initial.height + initial.top - nextTop
      top = nextTop
    }
    if (mode.includes('s')) {
      height = this.clamp(initial.height + dy, MIN_BOX_SIZE, stageHeight - initial.top)
    }
    return { left, top, width, height }
  },

  clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max)
  },

  confirmSelection() {
    if (!this.stageRect) return
    const { box } = this.data
    const areaRatio = (box.width * box.height) / (this.stageRect.width * this.stageRect.height)
    if (areaRatio < 0.08) {
      this.setData({ hintText: '选区太小，请框住完整门窗后再继续。' })
      wx.showToast({ title: '请扩大选区', icon: 'none' })
      return
    }
    updateDraft({
      selection: {
        x: Number((box.left / this.stageRect.width).toFixed(4)),
        y: Number((box.top / this.stageRect.height).toFixed(4)),
        width: Number((box.width / this.stageRect.width).toFixed(4)),
        height: Number((box.height / this.stageRect.height).toFixed(4)),
      },
    })
    wx.navigateTo({ url: '/pages/solution-select/index' })
  },
})

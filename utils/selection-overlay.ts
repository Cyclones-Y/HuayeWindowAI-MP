import type { NormalizedRect, PhotoDraft } from '../types/index'

export interface OverlayRect {
  left: number
  top: number
  width: number
  height: number
}

/**
 * 把归一化选框换算成 aspectFit 容器内的像素位置。
 * 确认页与生成页都用它在用户照片上标出“将要替换的区域”，避免各页各算一套。
 */
export function computeOverlayRect(
  photo: Pick<PhotoDraft, 'width' | 'height'>,
  selection: NormalizedRect,
  containerWidth: number,
  containerHeight: number,
): OverlayRect {
  const photoWidth = Math.max(photo.width, 1)
  const photoHeight = Math.max(photo.height, 1)
  const scale = Math.min(containerWidth / photoWidth, containerHeight / photoHeight)
  const renderedWidth = photoWidth * scale
  const renderedHeight = photoHeight * scale
  const offsetX = (containerWidth - renderedWidth) / 2
  const offsetY = (containerHeight - renderedHeight) / 2

  return {
    left: round(offsetX + selection.x * renderedWidth),
    top: round(offsetY + selection.y * renderedHeight),
    width: round(selection.width * renderedWidth),
    height: round(selection.height * renderedHeight),
  }
}

export function overlayStyle(rect: OverlayRect): string {
  return `left: ${rect.left}px; top: ${rect.top}px; width: ${rect.width}px; height: ${rect.height}px;`
}

/**
 * 按照片比例决定舞台尺寸：先按容器宽度算高度，超过 maxHeight 时反过来收窄宽度，
 * 让 aspectFit 的照片恰好铺满舞台，不出现黑边。
 */
export function fitStageSize(
  photo: Pick<PhotoDraft, 'width' | 'height'>,
  containerWidth: number,
  minHeight: number,
  maxHeight: number,
): { width: number; height: number } {
  const ratio = Math.max(photo.height, 1) / Math.max(photo.width, 1)
  const height = Math.min(maxHeight, Math.max(minHeight, containerWidth * ratio))
  const width = Math.min(containerWidth, height / ratio)
  return { width: round(width), height: round(height) }
}

function round(value: number): number {
  return Math.round(value * 100) / 100
}

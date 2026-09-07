export type RoomType = 'LIVING_ROOM' | 'BEDROOM' | 'BALCONY'
export type NeedType = 'QUIET' | 'INSULATION' | 'SAFETY' | 'VENTILATION'
export type RenderStatus = 'DRAFT' | 'QUEUED' | 'PROCESSING' | 'SUCCEEDED' | 'FAILED'

export interface NormalizedRect {
  x: number
  y: number
  width: number
  height: number
}

export interface PhotoDraft {
  /** 原图上传后保留服务端标识；样例只使用 sampleSceneId，不创建用户照片。 */
  photoId?: string
  sampleSceneId?: string
  previewUrl?: string
  previewUrlExpiresAt?: string
  localPath: string
  width: number
  height: number
  size: number
  isSample: boolean
}

export interface ProductOption {
  code: string
  name: string
  color?: string
}

export interface WindowSolution {
  id: string
  name: string
  subtitle: string
  room: RoomType
  needs: NeedType[]
  frameColors: ProductOption[]
  glassOptions: ProductOption[]
  priceHint: string
  beforeImage: string
  afterImage: string
  thumbnail: string
  features: string[]
  defaultFrameColorCode?: string
  defaultGlassCode?: string
}

/** 公开样例使用后端提供的尺寸和选区，不能在页面里硬编码某一张场景图。 */
export interface SampleScene {
  id: string
  name: string
  sceneType: RoomType
  thumbnailUrl: string
  width: number
  height: number
  defaultSelection: NormalizedRect
}

/** 元数据属于服务端纠正方向后的 JPEG；本地框选必须使用对应处理后图像。 */
export interface UploadedPhoto {
  photoId: string
  width: number
  height: number
  sizeBytes: number
  mimeType: string
  previewUrl: string
  previewUrlExpiresAt: string
  createdAt: string
}

export interface PhotoUploadOperation {
  result: Promise<UploadedPhoto>
  abort(): void
}

export interface DraftState {
  photo: PhotoDraft | null
  selection: NormalizedRect | null
  solution: WindowSolution | null
  frameColorCode: string
  glassCode: string
  taskId: string
}

export interface RenderTask {
  id: string
  status: RenderStatus
  progress: number
  stageText: string
  errorMessage?: string
  result?: RenderResult
}

export interface RenderResult {
  id: string
  taskId: string
  solutionId: string
  beforeImage: string
  afterImage: string
  isDemo: true
  createdAt: number
}

export interface LeadForm {
  contactName: string
  phone: string
  community: string
  preferredDate: string
  preferredTime: string
  note: string
}

export interface LocalHistoryItem extends RenderResult {
  solutionName: string
  thumbnail: string
}

export interface LocalLead extends LeadForm {
  id: string
  createdAt: number
  statusText: string
}

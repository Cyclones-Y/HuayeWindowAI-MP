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

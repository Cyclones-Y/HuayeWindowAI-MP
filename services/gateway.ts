import type { LeadForm, LocalLead, NormalizedRect, PhotoUploadOperation, RenderTask, RenderResult, RenderResultPage, SampleScene, WindowSolution } from '../types/index'

export interface CreateRenderTaskInput {
  sourceType: 'UPLOADED_PHOTO' | 'SAMPLE_SCENE'
  photoId?: string
  sampleSceneId?: string
  selection: NormalizedRect
  solutionId: string
  frameColorCode: string
  glassCode: string
  clientRequestId: string
}

export interface FrontendGateway {
  listSolutions(): Promise<WindowSolution[]>
  getSolution(solutionId: string): Promise<WindowSolution>
  listSampleScenes(): Promise<SampleScene[]>
  uploadPhoto(localPath: string, onProgress: (progress: number) => void): PhotoUploadOperation
  deletePhoto(photoId: string): Promise<void>
  createRenderTask(input: CreateRenderTaskInput, key: string, expectedUserId?: string): Promise<RenderTask>
  getRenderTask(taskId: string): Promise<RenderTask>
  retryRenderTask(taskId: string, key: string, expectedUserId?: string): Promise<RenderTask>
  getRenderResult(resultId: string): Promise<RenderResult>
  listRenderResults(page?: number): Promise<RenderResultPage>
  deleteRenderResult(resultId: string): Promise<void>
  deleteRenderTaskInput(taskId: string): Promise<void>
  favoriteSolution(solutionId: string): Promise<boolean>
  submitLead(form: LeadForm): Promise<LocalLead>
  clearUserData(): Promise<void>
}

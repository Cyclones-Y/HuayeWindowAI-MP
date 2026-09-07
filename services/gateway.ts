import type { LeadForm, LocalLead, PhotoUploadOperation, RenderTask, SampleScene, WindowSolution } from '../types/index'

export interface CreateRenderTaskInput {
  solution: WindowSolution
  forceFailure?: boolean
}

export interface FrontendGateway {
  listSolutions(): Promise<WindowSolution[]>
  getSolution(solutionId: string): Promise<WindowSolution>
  listSampleScenes(): Promise<SampleScene[]>
  uploadPhoto(localPath: string, onProgress: (progress: number) => void): PhotoUploadOperation
  deletePhoto(photoId: string): Promise<void>
  createRenderTask(input: CreateRenderTaskInput): Promise<RenderTask>
  getRenderTask(taskId: string): Promise<RenderTask>
  favoriteSolution(solutionId: string): Promise<boolean>
  submitLead(form: LeadForm): Promise<LocalLead>
  clearUserData(): Promise<void>
}

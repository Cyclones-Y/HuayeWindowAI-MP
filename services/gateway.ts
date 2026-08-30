import type { LeadForm, LocalLead, RenderTask, WindowSolution } from '../types/index'

export interface CreateRenderTaskInput {
  solution: WindowSolution
  forceFailure?: boolean
}

export interface FrontendGateway {
  login(): Promise<{ demoUserId: string }>
  listSolutions(): Promise<WindowSolution[]>
  createRenderTask(input: CreateRenderTaskInput): Promise<RenderTask>
  getRenderTask(taskId: string): Promise<RenderTask>
  favoriteSolution(solutionId: string): Promise<boolean>
  submitLead(form: LeadForm): Promise<LocalLead>
  clearUserData(): Promise<void>
}

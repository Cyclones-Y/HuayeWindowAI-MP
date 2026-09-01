import { WINDOW_SOLUTIONS } from '../data/solutions'
import { clearLocalUserData, saveLead, toggleFavorite } from '../store/session'
import type { CreateRenderTaskInput, FrontendGateway } from './gateway'
import type { LeadForm, LocalLead, RenderTask } from '../types/index'

interface InternalTask {
  input: CreateRenderTaskInput
  startedAt: number
}

export class MockGateway implements FrontendGateway {
  private readonly tasks = new Map<string, InternalTask>()

  async login(): Promise<{ demoUserId: string }> {
    return { demoUserId: 'demo-user-local' }
  }

  async listSolutions() {
    return WINDOW_SOLUTIONS
  }

  async createRenderTask(input: CreateRenderTaskInput): Promise<RenderTask> {
    const id = `demo-task-${Date.now()}`
    this.tasks.set(id, { input, startedAt: Date.now() })
    return { id, status: 'QUEUED', progress: 12, stageText: '方案已确认，正在排队' }
  }

  async getRenderTask(taskId: string): Promise<RenderTask> {
    const task = this.tasks.get(taskId)
    if (!task) {
      return { id: taskId, status: 'FAILED', progress: 0, stageText: '任务不存在', errorMessage: '演示任务已失效，请重新生成。' }
    }

    const elapsed = Date.now() - task.startedAt
    if (task.input.forceFailure && elapsed >= 1800) {
      return { id: taskId, status: 'FAILED', progress: 62, stageText: '生成未完成', errorMessage: '演示失败状态：可点击重试继续。' }
    }
    if (elapsed < 1000) return { id: taskId, status: 'QUEUED', progress: 18, stageText: '方案已确认，正在排队' }
    if (elapsed < 2300) return { id: taskId, status: 'PROCESSING', progress: 46, stageText: '正在保持房间结构' }
    if (elapsed < 3600) return { id: taskId, status: 'PROCESSING', progress: 78, stageText: '正在替换门窗方案' }

    const solution = task.input.solution
    return {
      id: taskId,
      status: 'SUCCEEDED',
      progress: 100,
      stageText: '演示效果已准备好',
      result: {
        id: `demo-result-${taskId}`,
        taskId,
        solutionId: solution.id,
        beforeImage: solution.beforeImage,
        afterImage: solution.afterImage,
        isDemo: true,
        createdAt: Date.now(),
      },
    }
  }

  async favoriteSolution(solutionId: string): Promise<boolean> {
    return toggleFavorite(solutionId)
  }

  async submitLead(form: LeadForm): Promise<LocalLead> {
    await this.delay(420)
    const lead: LocalLead = {
      ...form,
      id: `demo-lead-${Date.now()}`,
      createdAt: Date.now(),
      statusText: '演示预约已保存',
    }
    saveLead(lead)
    return lead
  }

  async clearUserData(): Promise<void> {
    clearLocalUserData()
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}

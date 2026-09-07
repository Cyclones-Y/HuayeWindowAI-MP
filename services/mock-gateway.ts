import { WINDOW_SOLUTIONS } from '../data/solutions'
import { clearLocalUserData, saveLead, toggleFavorite } from '../store/session'
import type { CreateRenderTaskInput } from './gateway'
import type { LeadForm, LocalLead, RenderTask } from '../types/index'

interface InternalTask {
  input: CreateRenderTaskInput
  startedAt: number
}

/** 仅保留尚未开发的生成、收藏、预约能力；目录和照片由 StageOneGateway 调真实接口。 */
export class MockGateway {
  private readonly tasks = new Map<string, InternalTask>()

  async createRenderTask(input: CreateRenderTaskInput): Promise<RenderTask> {
    if (!WINDOW_SOLUTIONS.some((solution) => solution.id === input.solution.id)) {
      throw new Error('该方案暂未提供参考效果图')
    }
    const id = `demo-task-${Date.now()}`
    this.tasks.set(id, { input, startedAt: Date.now() })
    return { id, status: 'QUEUED', progress: 12, stageText: '方案已确认，正在排队' }
  }

  async getRenderTask(taskId: string): Promise<RenderTask> {
    const task = this.tasks.get(taskId)
    if (!task) {
      return { id: taskId, status: 'FAILED', progress: 0, stageText: '任务不存在', errorMessage: '生成任务已失效，请重新生成。' }
    }

    const elapsed = Date.now() - task.startedAt
    if (task.input.forceFailure && elapsed >= 1800) {
      return { id: taskId, status: 'FAILED', progress: 62, stageText: '生成未完成', errorMessage: '生成过程中断，请重试。' }
    }
    if (elapsed < 1000) return { id: taskId, status: 'QUEUED', progress: 18, stageText: '方案已确认，正在排队' }
    if (elapsed < 2300) return { id: taskId, status: 'PROCESSING', progress: 46, stageText: '正在保持房间结构' }
    if (elapsed < 3600) return { id: taskId, status: 'PROCESSING', progress: 78, stageText: '正在替换门窗方案' }

    // 使用既有成对素材，不能把用户照片与任意目录图拼成貌似真实的 AI 结果。
    const reference = WINDOW_SOLUTIONS.find((solution) => solution.id === task.input.solution.id)!
    const solution = task.input.solution
    return {
      id: taskId,
      status: 'SUCCEEDED',
      progress: 100,
      stageText: '效果已生成',
      result: {
        id: `demo-result-${taskId}`,
        taskId,
        solutionId: solution.id,
        beforeImage: reference.beforeImage,
        afterImage: reference.afterImage,
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
      statusText: '已提交，等待确认',
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

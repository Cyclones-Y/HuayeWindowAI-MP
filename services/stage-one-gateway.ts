/** 目录、照片和生成使用真实接口；收藏、预约沿用已有本地实现。 */
import { getApiBaseUrl } from '../config/api'
import { forgetUploadedPhoto, getUploadedPhotoIds, rememberUploadedPhoto } from '../store/photos'
import { forgetDeviceResult, forgetSubmission, getDeviceResultIds, getSubmissions } from '../store/renders'
import type { LeadForm, PhotoUploadOperation, RenderResult, RenderResultPage, RenderTask, SampleScene, UploadedPhoto, WindowSolution } from '../types/index'
import { ensureSession, getSessionUserId, withAccessToken } from './auth'
import type { CreateRenderTaskInput, FrontendGateway } from './gateway'
import { ApiError, apiRequest, unwrapApiResponse } from './http-client'
import { MockGateway } from './mock-gateway'

interface SolutionSummaryDto {
  id: string
  thumbnailUrl: string
}

interface SolutionDetailDto {
  id: string
  name: string
  subtitle: string
  room: WindowSolution['room']
  needs: WindowSolution['needs']
  features: string[]
  pricingNote: string
  coverUrl: string
  available: boolean
  frameColors: Array<{ code: string; label: string; colorHex: string; available: boolean }>
  glassOptions: Array<{ code: string; label: string; available: boolean }>
  defaultFrameColorCode: string
  defaultGlassCode: string
}

interface SolutionPageDto {
  items: SolutionSummaryDto[]
  page: number
  hasNext: boolean
}

/** 分离 API DTO 与页面字段；galleryUrls 无前后图语义，不能猜测它是生成结果。 */
function mapSolution(dto: SolutionDetailDto): WindowSolution {
  if (!dto.available) throw new ApiError('RESOURCE_NOT_FOUND', '方案已下架，请重新选择', 404)
  const frameColors = dto.frameColors.filter((option) => option.available).map((option) => ({
    code: option.code, name: option.label, color: option.colorHex,
  }))
  const glassOptions = dto.glassOptions.filter((option) => option.available).map((option) => ({
    code: option.code, name: option.label,
  }))
  return {
    id: dto.id, name: dto.name, subtitle: dto.subtitle, room: dto.room, needs: dto.needs,
    features: dto.features, priceHint: dto.pricingNote, thumbnail: dto.coverUrl,
    frameColors, glassOptions, beforeImage: '', afterImage: '',
    defaultFrameColorCode: frameColors.find((option) => option.code === dto.defaultFrameColorCode)?.code || frameColors[0]?.code || '',
    defaultGlassCode: glassOptions.find((option) => option.code === dto.defaultGlassCode)?.code || glassOptions[0]?.code || '',
  }
}

interface RenderTaskDto extends Omit<RenderTask, 'id' | 'stageText'> { taskId: string; stageLabel: string }
interface RenderResultDto extends Omit<RenderResult, 'solutionId' | 'beforeImage' | 'afterImage' | 'createdAt'> {
  beforeImageUrl: string; afterImageUrl: string; createdAt: string
}
/** 服务端终态与配置快照直接映射，绝不回退到目录封面作为生成结果。 */
function mapTask(dto: RenderTaskDto): RenderTask { return { ...dto, id: dto.taskId, stageText: dto.stageLabel } }
function mapResult(dto: RenderResultDto): RenderResult {
  return { ...dto, solutionId: dto.solution.id, beforeImage: dto.beforeImageUrl, afterImage: dto.afterImageUrl, createdAt: Date.parse(dto.createdAt) }
}

export class StageOneGateway implements FrontendGateway {
  private readonly demo = new MockGateway()
  private readonly pendingDetails = new Map<string, Promise<WindowSolution>>()

  /**
   * 现有页面在客户端筛选并展示颜色，逐页读取目录后以最多 4 个并发补齐详情。
   * 只合并正在进行的详情请求，不长期缓存，保证重新进入页面能看到下架及配置变化。
   */
  async listSolutions(): Promise<WindowSolution[]> {
    const summaries: SolutionSummaryDto[] = []
    for (let page = 1; ; page += 1) {
      const data = await apiRequest<SolutionPageDto>(`/solutions?page=${page}&size=50`)
      if (data.page !== page || !Array.isArray(data.items) || (data.hasNext && !data.items.length)) {
        throw new ApiError('INVALID_RESPONSE', '方案分页数据异常，请重新加载', 200)
      }
      summaries.push(...data.items)
      if (!data.hasNext) break
    }
    const unique = [...new Map(summaries.map((summary) => [summary.id, summary])).values()]
    const solutions: WindowSolution[] = []
    for (let start = 0; start < unique.length; start += 4) {
      const batch = await Promise.all(unique.slice(start, start + 4).map(async (summary) => {
        try {
          return { ...await this.getSolution(summary.id), thumbnail: summary.thumbnailUrl }
        } catch (error) {
          // 目录读取期间被下架的条目不再显示；其他网络/服务错误应交给页面展示重试。
          if (error instanceof ApiError && error.code === 'RESOURCE_NOT_FOUND') return null
          throw error
        }
      }))
      solutions.push(...batch.filter((solution): solution is WindowSolution => solution !== null))
    }
    return solutions
  }

  getSolution(solutionId: string): Promise<WindowSolution> {
    const existing = this.pendingDetails.get(solutionId)
    if (existing) return existing
    const pending = apiRequest<SolutionDetailDto>(`/solutions/${encodeURIComponent(solutionId)}`)
      .then(mapSolution)
      .finally(() => this.pendingDetails.delete(solutionId))
    this.pendingDetails.set(solutionId, pending)
    return pending
  }

  async listSampleScenes(): Promise<SampleScene[]> {
    const data = await apiRequest<{ items: SampleScene[] }>('/sample-scenes')
    return data.items
  }

  /** multipart 自行生成 Content-Type 边界，不能沿用 JSON 请求头；取消只影响当前上传。 */
  uploadPhoto(localPath: string, onProgress: (progress: number) => void): PhotoUploadOperation {
    let task: WechatMiniprogram.UploadTask | undefined
    let cancelled = false
    const result = withAccessToken((token) => new Promise<UploadedPhoto>((resolve, reject) => {
      if (cancelled) { reject(new ApiError('UPLOAD_CANCELLED', '已取消上传', 0)); return }
      const userId = getSessionUserId()
      task = wx.uploadFile({
        url: `${getApiBaseUrl()}/photos`, filePath: localPath, name: 'file',
        formData: { purpose: 'WINDOW_PREVIEW' }, header: { Authorization: `Bearer ${token}` }, timeout: 60000,
        success: (response) => {
          try {
            const photo = unwrapApiResponse<UploadedPhoto>(response.data, response.statusCode)
            if (userId) rememberUploadedPhoto(userId, photo.photoId)
            resolve(photo)
          } catch (error) { reject(error) }
        },
        fail: () => reject(new ApiError(
          cancelled ? 'UPLOAD_CANCELLED' : 'NETWORK_ERROR',
          cancelled ? '已取消上传' : '照片上传失败，请检查网络后重试', 0,
        )),
      })
      task.onProgressUpdate(({ progress }) => { if (!cancelled) onProgress(progress) })
    }))
    return { result, abort: () => { cancelled = true; task?.abort() } }
  }

  async deletePhoto(photoId: string): Promise<void> {
    await withAccessToken(async (accessToken) => {
      try {
        await apiRequest<null>(`/photos/${encodeURIComponent(photoId)}`, { method: 'DELETE', accessToken })
      } catch (error) {
        // 已不存在也达成清理目标，权限不足或存储错误则保留索引供再次清理。
        if (!(error instanceof ApiError) || error.code !== 'RESOURCE_NOT_FOUND') throw error
      }
      const userId = getSessionUserId()
      if (userId) forgetUploadedPhoto(userId, photoId)
    })
  }

  async createRenderTask(input: CreateRenderTaskInput, key: string, expectedUserId = getSessionUserId()): Promise<RenderTask> {
    return withAccessToken(async (accessToken) => mapTask(await apiRequest<RenderTaskDto>('/render-tasks', {
      method: 'POST', data: input, accessToken, headers: { 'Idempotency-Key': key },
    })), expectedUserId)
  }
  async getRenderTask(taskId: string): Promise<RenderTask> {
    return withAccessToken(async (accessToken) => mapTask(await apiRequest<RenderTaskDto>(`/render-tasks/${encodeURIComponent(taskId)}`, { accessToken })))
  }
  async retryRenderTask(taskId: string, key: string, expectedUserId = getSessionUserId()): Promise<RenderTask> {
    return withAccessToken(async (accessToken) => mapTask(await apiRequest<RenderTaskDto>(`/render-tasks/${encodeURIComponent(taskId)}/retry`, {
      method: 'POST', accessToken, headers: { 'Idempotency-Key': key },
    })), expectedUserId)
  }
  async getRenderResult(resultId: string): Promise<RenderResult> {
    return withAccessToken(async (accessToken) => mapResult(await apiRequest<RenderResultDto>(`/render-results/${encodeURIComponent(resultId)}`, { accessToken })))
  }
  async listRenderResults(page = 1): Promise<RenderResultPage> {
    return withAccessToken(async (accessToken) => {
      const data = await apiRequest<Omit<RenderResultPage, 'items'> & { items: RenderResultDto[] }>(`/render-results?page=${page}&size=20`, { accessToken })
      return { ...data, items: data.items.map(mapResult) }
    })
  }
  async deleteRenderResult(resultId: string): Promise<void> {
    await withAccessToken(async (accessToken) => {
      try { await apiRequest<null>(`/render-results/${encodeURIComponent(resultId)}`, { method: 'DELETE', accessToken }) }
      catch (error) { if (!(error instanceof ApiError) || error.code !== 'RESOURCE_NOT_FOUND') throw error }
      const userId = getSessionUserId()
      if (userId) forgetDeviceResult(userId, resultId)
    })
  }
  favoriteSolution(solutionId: string) { return this.demo.favoriteSolution(solutionId) }
  async deleteRenderTaskInput(taskId: string): Promise<void> {
    await withAccessToken(async (accessToken) => {
      await apiRequest<null>(`/render-tasks/${encodeURIComponent(taskId)}`, { method: 'DELETE', accessToken })
    })
  }
  submitLead(form: LeadForm) { return this.demo.submitLead(form) }

  /** 仅清本设备已记录的照片；删除失败时不宣称全部清除，也不先丢掉本地索引。 */
  async clearUserData(): Promise<void> {
    if (!(await ensureSession())) throw new ApiError('UNAUTHORIZED', '请先登录后继续', 401)
    const userId = getSessionUserId()
    if (!userId) throw new ApiError('UNAUTHORIZED', '请重新登录', 401)
    // 响应不确定的提交必须先由用户恢复查询，清理动作绝不能重新发送创建/重试请求。
    for (const record of getSubmissions(userId)) {
      if (!record.taskId) {
        if (!record.attempted || record.rejected) { forgetSubmission(userId, record.key); continue }
        throw new ApiError('RENDER_SUBMISSION_UNCONFIRMED', '仍有未确认的提交，请先继续查看任务再清理', 409)
      }
      const task = await this.getRenderTask(record.taskId)
      if (task.status === 'QUEUED' || task.status === 'PROCESSING') throw new ApiError('PHOTO_IN_USE', '仍有生成任务，请完成后再清理', 409)
      if (task.resultId) await this.deleteRenderResult(task.resultId)
      else await this.deleteRenderTaskInput(task.id)
      forgetSubmission(userId, record.key)
    }
    for (const id of getDeviceResultIds(userId)) await this.deleteRenderResult(id)
    // 每个删除请求自行恢复会话一次，避免外层再重试整个批次而放大登录重试次数。
    for (const id of getUploadedPhotoIds(userId)) await this.deletePhoto(id)
    await this.demo.clearUserData()
  }
}

/** 阶段来自服务端；查询异常只改变连接提示，不能改写任务为生成失败。 */
import type { RenderStage, RenderStatus } from '../types/index'
const stages: RenderStage[] = ['QUEUED', 'PREPARING', 'GENERATING', 'SAVING']
export function stageSteps(stage: RenderStage, status: RenderStatus) {
  const current = status === 'DRAFT' ? -1 : stage === 'COMPLETED' ? 4 : stages.indexOf(stage)
  return stages.map((value, index) => ({ label: ['排队', '准备图片', 'AI 生成', '保存结果'][index],
    state: index < current ? 'done' : index === current ? (status === 'FAILED' ? 'failed' : 'active') : 'waiting', value }))
}

/** 单请求轮询器：隐藏使回调过期；重入等待旧请求结束，再立即查询同一任务。 */
export class RenderPoller<T extends { status: RenderStatus; pollAfterMs: number }> {
  private visible = false
  private inflight = false
  private epoch = 0
  private errors = 0
  private timer?: ReturnType<typeof setTimeout>
  constructor(private query: () => Promise<T>, private update: (value: T) => void,
    private error: (error: unknown, delay: number) => void, private backoff = (attempt: number) => [3000, 6000, 12000, 15000][Math.min(attempt, 3)]) {}
  resume(): void {
    if (this.visible) return
    this.visible = true; this.epoch++
    void this.poll()
  }
  pause(): void {
    this.visible = false; this.epoch++
    if (this.timer !== undefined) clearTimeout(this.timer)
    this.timer = undefined
  }
  private async poll(): Promise<void> {
    if (!this.visible || this.inflight) return
    this.inflight = true
    const epoch = this.epoch
    let delay = 3000, terminal = false
    try {
      const value = await this.query()
      if (epoch !== this.epoch || !this.visible) return
      this.errors = 0
      this.update(value)
      terminal = value.status === 'FAILED' || value.status === 'SUCCEEDED'
      delay = Math.max(500, value.pollAfterMs)
    } catch (error) {
      if (epoch !== this.epoch || !this.visible) return
      delay = this.backoff(this.errors++)
      this.error(error, delay)
    } finally {
      this.inflight = false
      if (this.visible) {
        if (epoch !== this.epoch) void this.poll()
        else if (!terminal) this.timer = setTimeout(() => { this.timer = undefined; void this.poll() }, delay)
      }
    }
  }
}

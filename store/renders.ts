/** 按账户登记本设备提交与结果；标识必须在发请求前持久化，响应丢失后才能安全恢复。 */
import type { CreateRenderTaskInput } from '../services/gateway'
import type { DraftState } from '../types/index'

export interface RenderSubmission {
  key: string; input: CreateRenderTaskInput; draft: DraftState | null
  taskId?: string; resultId?: string; retryOf?: string
  attempted?: boolean; rejected?: boolean
}
interface DeviceRenders { submissions: RenderSubmission[]; results: string[] }
const prefix = 'huaye_renders_v1_'

/** UUID 是去重标识而非凭据；不依赖浏览器 crypto，兼容小程序 JS 环境。 */
export function requestId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (character) => {
    const random = Math.floor(Math.random() * 16)
    return (character === 'x' ? random : (random & 3) | 8).toString(16)
  })
}
function read(userId: string): DeviceRenders {
  const value = wx.getStorageSync<DeviceRenders>(prefix + userId)
  return value && Array.isArray(value.submissions) && Array.isArray(value.results) ? value : { submissions: [], results: [] }
}
function write(userId: string, value: DeviceRenders): void {
  // 写入失败就不发送付费请求，不能以仅内存记录假装具备退出后恢复能力。
  wx.setStorageSync(prefix + userId, value)
}
export function getSubmissions(userId: string): RenderSubmission[] { return read(userId).submissions }
export function getDeviceResultIds(userId: string): string[] { return read(userId).results }

/** 每次明确的新生成动作创建一次标识；网络恢复复用记录，不调用此函数。 */
export function beginSubmission(userId: string, input: CreateRenderTaskInput, draft: DraftState | null, retryOf?: string): RenderSubmission {
  const record: RenderSubmission = { key: requestId(), input, draft, retryOf }
  const state = read(userId)
  state.submissions.unshift(record)
  write(userId, state)
  return record
}
export function updateSubmission(userId: string, key: string, patch: Partial<RenderSubmission>): RenderSubmission {
  const state = read(userId)
  const record = state.submissions.find((item) => item.key === key)
  if (!record) throw new Error('提交记录不存在')
  Object.assign(record, patch)
  if (record.resultId) state.results = [...new Set([...state.results, record.resultId])]
  write(userId, state)
  return record
}
export function forgetSubmission(userId: string, key: string): void {
  const state = read(userId)
  state.submissions = state.submissions.filter((item) => item.key !== key)
  write(userId, state)
}
export function forgetDeviceResult(userId: string, resultId: string): void {
  const state = read(userId)
  state.results = state.results.filter((id) => id !== resultId)
  state.submissions = state.submissions.filter((item) => item.resultId !== resultId)
  write(userId, state)
}

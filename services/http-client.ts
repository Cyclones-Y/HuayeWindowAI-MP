import { getApiBaseUrl } from '../config/api'

export interface ApiEnvelope<T> {
  code: string
  message: string
  data: T
  requestId: string
}

export class ApiError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly statusCode: number,
    readonly requestId?: string,
  ) {
    super(message)
  }
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: string | WechatMiniprogram.IAnyObject | ArrayBuffer
  accessToken?: string
  headers?: Record<string, string>
}

/** wx.request 返回对象，wx.uploadFile 返回 JSON 字符串；统一拒绝空响应与代理 HTML 错误页。 */
export function unwrapApiResponse<T>(payload: unknown, statusCode: number): T {
  let parsed: unknown = payload
  if (typeof payload === 'string') {
    try { parsed = JSON.parse(payload) } catch { parsed = null }
  }
  if (!parsed || typeof parsed !== 'object') {
    throw new ApiError('INVALID_RESPONSE', '服务器响应异常，请稍后重试', statusCode)
  }
  const body = parsed as Partial<ApiEnvelope<T>>
  if (statusCode >= 200 && statusCode < 300 && body.code === 'OK' && 'data' in body) return body.data as T
  throw new ApiError(
    typeof body.code === 'string' && body.code !== 'OK' ? body.code : 'INVALID_RESPONSE',
    typeof body.message === 'string' ? body.message : '服务器响应异常，请稍后重试',
    statusCode,
    typeof body.requestId === 'string' ? body.requestId : undefined,
  )
}

/**
 * 统一处理后端信封格式。请求体和认证令牌不得写入 console，避免微信临时码泄漏。
 */
export function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const header: Record<string, string> = { 'Content-Type': 'application/json', ...options.headers }
  if (options.accessToken) header.Authorization = `Bearer ${options.accessToken}`

  return new Promise((resolve, reject) => {
    wx.request<ApiEnvelope<T>>({
      url: `${getApiBaseUrl()}${path}`,
      method: options.method || 'GET',
      data: options.data,
      header,
      timeout: 10000,
      success: (response) => {
        try { resolve(unwrapApiResponse<T>(response.data, response.statusCode)) } catch (error) { reject(error) }
      },
      fail: () => reject(new ApiError('NETWORK_ERROR', '网络连接失败，请稍后重试', 0)),
    })
  })
}

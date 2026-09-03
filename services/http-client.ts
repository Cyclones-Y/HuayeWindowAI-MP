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

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: string | WechatMiniprogram.IAnyObject | ArrayBuffer
  accessToken?: string
}

/**
 * 统一处理后端信封格式。请求体和认证令牌不得写入 console，避免微信临时码泄漏。
 */
export function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const header: Record<string, string> = { 'Content-Type': 'application/json' }
  if (options.accessToken) header.Authorization = `Bearer ${options.accessToken}`

  return new Promise((resolve, reject) => {
    wx.request<ApiEnvelope<T>>({
      url: `${getApiBaseUrl()}${path}`,
      method: options.method || 'GET',
      data: options.data,
      header,
      timeout: 10000,
      success: (response) => {
        const body = response.data
        if (response.statusCode >= 200 && response.statusCode < 300 && body.code === 'OK') {
          resolve(body.data)
          return
        }
        reject(new ApiError(body.code || 'NETWORK_ERROR', body.message || '请求失败', response.statusCode, body.requestId))
      },
      fail: () => reject(new ApiError('NETWORK_ERROR', '网络连接失败，请稍后重试', 0)),
    })
  })
}

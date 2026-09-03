import { ApiError, apiRequest } from './http-client'

const AUTH_SESSION_KEY = 'huaye_auth_session_v1'
const DEVICE_ID_KEY = 'huaye_device_id_v1'
const EXPIRY_SAFETY_MS = 30 * 1000

export interface AuthSession {
  accessToken: string
  expiresAt: number
  isNewUser: boolean
  user: {
    id: string
    nickname: null
    avatarUrl: null
  }
}

interface LoginResponse {
  accessToken: string
  expiresIn: number
  isNewUser: boolean
  user: AuthSession['user']
}

let currentSession: AuthSession | null = null
let pendingEnsure: Promise<boolean> | null = null

function readStoredSession(): AuthSession | null {
  try {
    const stored = wx.getStorageSync<AuthSession>(AUTH_SESSION_KEY)
    return stored && stored.accessToken ? stored : null
  } catch {
    return null
  }
}

export function restoreSession(): void {
  currentSession = readStoredSession()
  if (currentSession && currentSession.expiresAt <= Date.now()) clearSession()
}

export function getAccessToken(): string | null {
  if (!currentSession) currentSession = readStoredSession()
  if (!currentSession || currentSession.expiresAt <= Date.now() + EXPIRY_SAFETY_MS) return null
  return currentSession.accessToken
}

export function clearSession(): void {
  currentSession = null
  try {
    wx.removeStorageSync(AUTH_SESSION_KEY)
  } catch {
    // 内存态仍然已经清空，存储异常不应阻断后续重新登录。
  }
}

function getDeviceId(): string {
  try {
    const stored = wx.getStorageSync<string>(DEVICE_ID_KEY)
    if (stored) return stored
  } catch {
    // 存储不可用时仍可使用本次进程生成的标识完成登录。
  }
  const deviceId = `mp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}_${Math.random().toString(36).slice(2)}`
  try {
    wx.setStorageSync(DEVICE_ID_KEY, deviceId)
  } catch {
    // deviceId 不是安全身份凭据，持久化失败不应阻断用户登录。
  }
  return deviceId
}

function wxLogin(): Promise<string> {
  return new Promise((resolve, reject) => {
    wx.login({
      success: ({ code }) => (code ? resolve(code) : reject(new ApiError('WECHAT_CODE_INVALID', '微信登录失败', 0))),
      fail: () => reject(new ApiError('WECHAT_CODE_INVALID', '微信登录失败，请重试', 0)),
    })
  })
}

async function exchangeSession(phoneCode?: string): Promise<AuthSession> {
  // 手机号授权码和 wx.login code 都是短时凭据，每次提交前现取，失败后由用户重新触发。
  const code = await wxLogin()
  const data = await apiRequest<LoginResponse>('/v1/auth/wechat/login', {
    method: 'POST',
    data: { code, phoneCode, deviceId: getDeviceId() },
  })
  const session: AuthSession = {
    accessToken: data.accessToken,
    expiresAt: Date.now() + data.expiresIn * 1000,
    isNewUser: data.isNewUser,
    user: data.user,
  }
  currentSession = session
  try {
    wx.setStorageSync(AUTH_SESSION_KEY, session)
  } catch {
    // 当前进程仍可使用内存会话；下次启动会重新走微信登录。
  }
  return session
}

export async function loginWithPhoneCode(phoneCode: string): Promise<AuthSession> {
  return exchangeSession(phoneCode)
}

async function trySilentLogin(): Promise<boolean> {
  if (getAccessToken()) return true
  try {
    await exchangeSession()
    return true
  } catch (error) {
    if (error instanceof ApiError && error.code === 'PHONE_AUTH_REQUIRED') return false
    throw error
  }
}

function openPhoneLoginPage(): Promise<boolean> {
  return new Promise((resolve) => {
    let settled = false
    const finish = (result: boolean) => {
      if (settled) return
      settled = true
      resolve(result)
    }
    wx.navigateTo({
      url: '/pages/login/index',
      events: {
        authorized: () => finish(true),
        cancelled: () => finish(false),
      },
      fail: () => finish(false),
    })
  })
}

/**
 * 受保护操作统一调用此函数：先静默恢复已绑定身份，仅在首次使用时展示手机号授权页。
 */
export function ensureSession(): Promise<boolean> {
  if (pendingEnsure) return pendingEnsure
  pendingEnsure = (async () => {
    try {
      if (await trySilentLogin()) return true
      return await openPhoneLoginPage()
    } catch (error) {
      const message = error instanceof ApiError ? error.message : '登录失败，请稍后重试'
      wx.showToast({ title: message, icon: 'none' })
      return false
    }
  })().finally(() => {
    pendingEnsure = null
  })
  return pendingEnsure
}

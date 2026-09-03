/**
 * 不同小程序版本的后端地址。
 * 真机调试和体验/正式版必须替换为已在微信公众平台配置的 HTTPS 业务域名。
 */
const API_BASE_URLS = {
  develop: 'http://192.168.43.4:8000',
  trial: 'https://api-trial.example.com',
  release: 'https://api.example.com',
} as const

export function getApiBaseUrl(): string {
  try {
    const version = wx.getAccountInfoSync().miniProgram.envVersion
    return API_BASE_URLS[version]
  } catch {
    return API_BASE_URLS.develop
  }
}

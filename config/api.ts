/**
 * origin 只包含主机地址，prefix 对应后端 API_PREFIX；业务调用一律传不带版本的路径。
 * 开发地址与后端 .env.development 的 API_PUBLIC_BASE_URL 一致，换网络后需同步更新。
 * 体验/正式版需替换为已在微信公众平台配置的 HTTPS 业务域名。
 */
export const API_CONFIG = {
  develop: { origin: 'http://192.168.155.188:8000', prefix: '/v1' },
  trial: { origin: 'https://api-trial.example.com', prefix: '/v1' },
  release: { origin: 'https://api.example.com', prefix: '/v1' },
} as const

/** 页面不自行拼接版本号，登录、查询和 multipart 上传共用同一入口。 */
export function getApiBaseUrl(): string {
  let version: keyof typeof API_CONFIG = 'develop'
  try {
    version = wx.getAccountInfoSync().miniProgram.envVersion
  } catch {
    // 开发工具尚未提供版本信息时使用开发环境。
  }
  const config = API_CONFIG[version] || API_CONFIG.develop
  return `${config.origin.replace(/\/+$/, '')}${config.prefix.replace(/\/+$/, '')}`
}

/** 与当前开发后端的 PHOTO_MAX_BYTES 一致；服务端仍执行最终可信校验。 */
export const PHOTO_MAX_BYTES = 10 * 1024 * 1024

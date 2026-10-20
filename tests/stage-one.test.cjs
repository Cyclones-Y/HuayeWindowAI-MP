/** 使用微信 API 替身验证请求协议和页面异步竞态，不访问微信账户或上传真实住宅照片。 */
const { test, beforeEach, afterEach } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const ts = require('typescript')
const root = path.resolve(__dirname, '..')

require.extensions['.ts'] = (module, filename) => {
  const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: filename,
  })
  module._compile(compiled.outputText, filename)
}

let storage, calls, app, handlers
const load = (file) => require(path.join(root, file))
const ok = (options, data) => options.success({ statusCode: 200, data: { code: 'OK', data } })
const fail = (options, code, statusCode = 500) => options.success({ statusCode, data: { code, message: code } })
const tick = () => new Promise((resolve) => setImmediate(resolve))
const photo = () => ({ photoId: 'new-photo', previewUrl: 'https://media.example.test/normalized.jpg',
  previewUrlExpiresAt: '2026-09-07T12:00:00Z', width: 900, height: 1200, sizeBytes: 12345 })
const detail = (id) => ({ id, name: id, subtitle: '说明', room: 'living', needs: [], features: [],
  pricingNote: '量尺为准', coverUrl: `https://media.example.test/${id}.jpg`, available: true,
  frameColors: [{ code: 'off', label: '下架色', colorHex: '#000000', available: false },
    { code: 'green', label: '墨绿', colorHex: '#244233', available: true }],
  glassOptions: [{ code: 'clear', label: '透明', available: true }],
  defaultFrameColorCode: 'off', defaultGlassCode: 'clear' })

function session(userId = 'user-1') {
  storage.set('huaye_auth_session_v1', { accessToken: 'synthetic-token', expiresAt: Date.now() + 3600000,
    isNewUser: false, user: { id: userId, nickname: null, avatarUrl: null } })
}

/** 每个测试重新加载业务模块，隔离内存会话、正在进行的请求和照片索引。 */
beforeEach(() => {
  for (const key of Object.keys(require.cache)) {
    if (key.startsWith(root + path.sep) && key.endsWith('.ts') && !key.includes('node_modules')) delete require.cache[key]
  }
  storage = new Map()
  calls = { requests: [], uploads: [], navigation: [], toasts: [], aborted: 0 }
  handlers = { request: () => { throw new Error('unexpected request') }, upload: () => {} }
  app = { globalData: { draft: { photo: null, selection: null, solution: null, frameColorCode: '', glassCode: '', taskId: '' } } }
  global.getApp = () => app
  global.getCurrentPages = () => []
  global.wx = {
    getAccountInfoSync: () => ({ miniProgram: { envVersion: 'develop' } }),
    getStorageSync: (key) => storage.get(key),
    setStorageSync: (key, value) => storage.set(key, value),
    removeStorageSync: (key) => storage.delete(key),
    showToast: (options) => calls.toasts.push(options),
    navigateTo: (options) => calls.navigation.push(options.url),
    switchTab: (options) => calls.navigation.push(options.url),
    login: (options) => queueMicrotask(() => options.success({ code: 'synthetic-wx-code' })),
    request: (options) => { calls.requests.push(options); queueMicrotask(() => handlers.request(options)) },
    uploadFile: (options) => {
      calls.uploads.push(options)
      queueMicrotask(() => handlers.upload(options))
      return {
        abort: () => { calls.aborted += 1; options.fail({ errMsg: 'uploadFile:fail abort' }) },
        onProgressUpdate: (callback) => queueMicrotask(() => callback({ progress: 42 })),
      }
    },
    chooseMedia: async () => ({ tempFiles: [{ tempFilePath: '/tmp/source.heic', size: 50000 }] }),
    getImageInfo: async () => ({ width: 1200, height: 900 }),
    downloadFile: (options) => queueMicrotask(() => options.success({ statusCode: 200, tempFilePath: '/tmp/normalized.jpg' })),
  }
})

afterEach(() => { delete global.Page; delete global.wx; delete global.getApp; delete global.getCurrentPages })

function page(file) {
  let instance
  global.Page = (definition) => { instance = { ...definition, data: structuredClone(definition.data),
    setData(patch) { Object.assign(this.data, patch) } } }
  load(file)
  return instance
}

test('统一前缀同时用于登录、目录、上传和删除，支持 /api/v1 与空前缀', async () => {
  const config = load('config/api.ts')
  config.API_CONFIG.develop.origin = 'https://backend.example.test/'
  config.API_CONFIG.develop.prefix = '/api/v1/'
  handlers.request = (options) => {
    if (options.url.endsWith('/auth/wechat/login')) ok(options, { accessToken: 'synthetic-token', expiresIn: 7200,
      isNewUser: false, user: { id: 'user-1' } })
    else if (options.method === 'DELETE') ok(options, null)
    else ok(options, { items: [] })
  }
  handlers.upload = (options) => options.success({ statusCode: 201, data: JSON.stringify({ code: 'OK', data: photo() }) })
  await load('services/auth.ts').loginWithPhoneCode('synthetic-phone-code')
  const gateway = new (load('services/stage-one-gateway.ts').StageOneGateway)()
  await gateway.listSampleScenes()
  await gateway.uploadPhoto('/tmp/test.jpg', () => {}).result
  await gateway.deletePhoto('new-photo')
  assert.deepEqual(calls.requests.map((item) => item.url), [
    'https://backend.example.test/api/v1/auth/wechat/login',
    'https://backend.example.test/api/v1/sample-scenes',
    'https://backend.example.test/api/v1/photos/new-photo',
  ])
  assert.equal(calls.uploads[0].url, 'https://backend.example.test/api/v1/photos')
  config.API_CONFIG.develop.prefix = ''
  assert.equal(config.getApiBaseUrl(), 'https://backend.example.test')
})

test('读取全部目录分页，映射可用配置并在默认颜色下架时选可用值', async () => {
  handlers.request = (options) => {
    if (options.url.includes('/solutions?')) {
      const number = Number(new URL(options.url).searchParams.get('page'))
      ok(options, { page: number, hasNext: number === 1, items: [{ id: `s${number}`, thumbnailUrl: `thumb${number}` }] })
    } else ok(options, detail(options.url.split('/').pop()))
  }
  const result = await new (load('services/stage-one-gateway.ts').StageOneGateway)().listSolutions()
  assert.deepEqual(result.map((item) => item.id), ['s1', 's2'])
  assert.deepEqual(result[0].frameColors, [{ code: 'green', name: '墨绿', color: '#244233' }])
  assert.equal(result[0].defaultFrameColorCode, 'green')
  assert.equal(result[0].thumbnail, 'thumb1')
  assert.equal(result[0].priceHint, '量尺为准')
  assert.equal(result[0].beforeImage, '')
})

test('目录故障不回退静态方案，无效分页终止，详情读取期间下架可跳过', async () => {
  const gateway = new (load('services/stage-one-gateway.ts').StageOneGateway)()
  handlers.request = (options) => options.fail({})
  await assert.rejects(gateway.listSolutions(), { code: 'NETWORK_ERROR' })
  handlers.request = (options) => ok(options, { page: 1, items: [], hasNext: true })
  await assert.rejects(gateway.listSolutions(), { code: 'INVALID_RESPONSE' })
  handlers.request = (options) => options.url.includes('?')
    ? ok(options, { page: 1, items: [{ id: 'gone' }], hasNext: false }) : fail(options, 'RESOURCE_NOT_FOUND', 404)
  assert.deepEqual(await gateway.listSolutions(), [])
})

test('上传为带 Bearer 的 multipart，解析 JSON 字符串、报告进度并按账户记录照片', async () => {
  session()
  handlers.upload = (options) => options.success({ statusCode: 201, data: JSON.stringify({ code: 'OK', data: photo() }) })
  const progress = []
  const gateway = new (load('services/stage-one-gateway.ts').StageOneGateway)()
  assert.equal((await gateway.uploadPhoto('/tmp/test.heic', (value) => progress.push(value)).result).photoId, 'new-photo')
  const request = calls.uploads[0]
  assert.equal(request.filePath, '/tmp/test.heic')
  assert.equal(request.name, 'file')
  assert.deepEqual(request.formData, { purpose: 'WINDOW_PREVIEW' })
  assert.deepEqual(request.header, { Authorization: 'Bearer synthetic-token' })
  assert.deepEqual(progress, [42])
  const registry = load('store/photos.ts')
  assert.deepEqual(registry.getUploadedPhotoIds('user-1'), ['new-photo'])
  assert.deepEqual(registry.getUploadedPhotoIds('user-2'), [])
})

test('上传取消会中止微信任务且不会重试', async () => {
  session()
  const operation = new (load('services/stage-one-gateway.ts').StageOneGateway)().uploadPhoto('/tmp/test.jpg', () => {})
  await tick()
  operation.abort()
  await assert.rejects(operation.result, { code: 'UPLOAD_CANCELLED' })
  assert.equal(calls.aborted, 1)
  assert.equal(calls.uploads.length, 1)
})

test('服务器明确返回 401 时只恢复一次会话，网络失败不重复上传', async () => {
  session()
  let uploads = 0
  handlers.upload = (options) => {
    uploads += 1
    options.success({ statusCode: 401, data: JSON.stringify({ code: 'UNAUTHORIZED', message: 'expired' }) })
  }
  handlers.request = (options) => ok(options, { accessToken: 'renewed-synthetic-token', expiresIn: 7200, user: { id: 'user-1' } })
  const gateway = new (load('services/stage-one-gateway.ts').StageOneGateway)()
  await assert.rejects(gateway.uploadPhoto('/tmp/test.jpg', () => {}).result, { code: 'UNAUTHORIZED' })
  assert.equal(uploads, 2)
  assert.equal(calls.requests.length, 1)
  assert.equal(calls.uploads[1].header.Authorization, 'Bearer renewed-synthetic-token')
  handlers.upload = (options) => options.fail({})
  await assert.rejects(gateway.uploadPhoto('/tmp/test.jpg', () => {}).result, { code: 'NETWORK_ERROR' })
  assert.equal(calls.uploads.length, 3)
})

test('HTML 或缺失数据的成功响应被拒绝，保留后端业务错误', () => {
  const { unwrapApiResponse } = load('services/http-client.ts')
  assert.throws(() => unwrapApiResponse('<html>bad gateway</html>', 502), { code: 'INVALID_RESPONSE' })
  assert.throws(() => unwrapApiResponse({ code: 'OK' }, 200), { code: 'INVALID_RESPONSE' })
  assert.throws(() => unwrapApiResponse('{"code":"PHOTO_TOO_LARGE","message":"过大"}', 413), { code: 'PHOTO_TOO_LARGE' })
})

test('部分照片删除失败保留索引和本地记录，重试遇到 404 视为已清理', async () => {
  session()
  const registry = load('store/photos.ts')
  registry.rememberUploadedPhoto('user-1', 'first')
  registry.rememberUploadedPhoto('user-1', 'second')
  registry.rememberUploadedPhoto('user-2', 'other-user-photo')
  storage.set('huaye_demo_favorites', ['s1'])
  const gateway = new (load('services/stage-one-gateway.ts').StageOneGateway)()
  handlers.request = (options) => options.url.endsWith('/first') ? ok(options, null) : fail(options, 'STORAGE_ERROR')
  await assert.rejects(gateway.clearUserData(), { code: 'STORAGE_ERROR' })
  assert.deepEqual(registry.getUploadedPhotoIds('user-1'), ['second'])
  assert.deepEqual(storage.get('huaye_demo_favorites'), ['s1'])
  handlers.request = (options) => fail(options, 'RESOURCE_NOT_FOUND', 404)
  await gateway.clearUserData()
  assert.deepEqual(registry.getUploadedPhotoIds('user-1'), [])
  assert.deepEqual(registry.getUploadedPhotoIds('user-2'), ['other-user-photo'])
  assert.equal(storage.has('huaye_demo_favorites'), false)
})

test('样例入口使用服务器尺寸和默认框选，无样例时保持当前草稿', async () => {
  const home = page('pages/home/index.ts')
  const gateway = load('services/index.ts').gateway
  const sample = { id: 'sample-server', thumbnailUrl: 'https://media.example.test/scene.jpg', width: 1800, height: 1200,
    defaultSelection: { x: 0.1, y: 0.2, width: 0.6, height: 0.5 } }
  gateway.listSampleScenes = async () => [sample]
  await home.trySample()
  assert.equal(app.globalData.draft.photo.sampleSceneId, sample.id)
  assert.equal(app.globalData.draft.photo.width, 1800)
  assert.deepEqual(app.globalData.draft.selection, sample.defaultSelection)
  const saved = app.globalData.draft
  gateway.listSampleScenes = async () => []
  await home.trySample()
  assert.equal(app.globalData.draft, saved)
  assert.equal(calls.navigation.length, 1)
  assert.equal(calls.requests.length, 0)
})

test('框选使用规范化预览和服务器宽高，替换旧图失败仍保留有效的新草稿', async () => {
  session()
  const upload = page('pages/upload/index.ts')
  const gateway = load('services/index.ts').gateway
  app.globalData.draft.photo = { photoId: 'old-photo' }
  gateway.uploadPhoto = () => ({ result: Promise.resolve(photo()), abort() {} })
  gateway.deletePhoto = async (id) => { assert.equal(id, 'old-photo'); throw new Error('storage unavailable') }
  await upload.choosePhoto(['album'])
  assert.equal(app.globalData.draft.photo.localPath, '/tmp/normalized.jpg')
  assert.equal(app.globalData.draft.photo.width, 900)
  assert.equal(app.globalData.draft.photo.height, 1200)
  assert.equal(app.globalData.draft.photo.photoId, 'new-photo')
  assert.deepEqual(calls.navigation, ['/pages/selection/index'])
  assert.equal(upload.data.choosing, false)
})

test('旧图回收期间离开页面不回滚为已删除旧图，也不删除已提交的新图', async () => {
  session()
  const upload = page('pages/upload/index.ts')
  const gateway = load('services/index.ts').gateway
  app.globalData.draft.photo = { photoId: 'old-photo' }
  gateway.uploadPhoto = () => ({ result: Promise.resolve(photo()), abort() {} })
  const deleted = []
  gateway.deletePhoto = async (id) => { deleted.push(id); upload.onUnload() }
  await upload.choosePhoto(['album'])
  assert.equal(app.globalData.draft.photo.photoId, 'new-photo')
  assert.deepEqual(deleted, ['old-photo'])
  assert.deepEqual(calls.navigation, [])
})

test('上传成功后预览下载失败会回收新图并保留旧草稿', async () => {
  session()
  const upload = page('pages/upload/index.ts')
  const gateway = load('services/index.ts').gateway
  app.globalData.draft.photo = { photoId: 'old-photo' }
  gateway.uploadPhoto = () => ({ result: Promise.resolve(photo()), abort() {} })
  const deleted = []
  gateway.deletePhoto = async (id) => { deleted.push(id) }
  wx.downloadFile = (options) => options.fail({})
  await upload.choosePhoto(['album'])
  assert.equal(app.globalData.draft.photo.photoId, 'old-photo')
  assert.deepEqual(deleted, ['new-photo'])
  assert.deepEqual(calls.navigation, [])
  assert.match(upload.data.uploadError, /预览加载失败/)
})

test('上传回调已成功但页面已离开时回收新照片', async () => {
  session()
  const upload = page('pages/upload/index.ts')
  const gateway = load('services/index.ts').gateway
  gateway.uploadPhoto = () => {
    const result = Promise.resolve().then(() => { upload.onUnload(); return photo() })
    return { result, abort() {} }
  }
  const deleted = []
  gateway.deletePhoto = async (id) => { deleted.push(id) }
  await upload.choosePhoto(['album'])
  assert.deepEqual(deleted, ['new-photo'])
  assert.equal(app.globalData.draft.photo, null)
  assert.deepEqual(calls.navigation, [])
})

test('超限照片在发起上传前被拒绝', async () => {
  session()
  const upload = page('pages/upload/index.ts')
  wx.chooseMedia = async () => ({ tempFiles: [{ tempFilePath: '/tmp/large.jpg', size: 11 * 1024 * 1024 }] })
  await upload.choosePhoto(['album'])
  assert.match(upload.data.uploadError, /10 MB/)
  assert.equal(calls.uploads.length, 0)
})

test('收藏读取失败显式展示错误，生成服务未启用时不能回退到静态素材', async () => {
  storage.set('huaye_demo_favorites', ['s1'])
  const profile = page('pages/profile/index.ts')
  const gateway = load('services/index.ts').gateway
  gateway.listSolutions = async () => { throw new Error('offline') }
  await profile.refreshData()
  assert.match(profile.data.favoritesError, /加载失败/)
  session()
  handlers.request = (options) => fail(options, 'RENDER_NOT_ENABLED', 503)
  await assert.rejects(gateway.createRenderTask({ clientRequestId: 'synthetic-id' }, 'stable-key'), (error) => error.code === 'RENDER_NOT_ENABLED')
  assert.equal(calls.requests.length, 1)
})

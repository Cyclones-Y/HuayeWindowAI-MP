/** 任务恢复与真实协议的回归测试；所有身份和图片均为合成数据。 */
const { test, beforeEach } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const ts = require('typescript')
const root = path.resolve(__dirname, '..')
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }, fileName: filename,
}).outputText, filename)
const load = (file) => require(path.join(root, file))
let storage, requests, handler
beforeEach(() => {
  for (const key of Object.keys(require.cache)) if (key.startsWith(root + path.sep) && key.endsWith('.ts') && !key.includes('node_modules')) delete require.cache[key]
  storage = new Map(); requests = []
  storage.set('huaye_auth_session_v1', { accessToken: 'synthetic-token', expiresAt: Date.now() + 3600000, user: { id: 'u1' } })
  global.wx = {
    getAccountInfoSync: () => ({ miniProgram: { envVersion: 'develop' } }),
    getStorageSync: (key) => storage.get(key), setStorageSync: (key, value) => storage.set(key, structuredClone(value)),
    removeStorageSync: (key) => storage.delete(key),
    request: (options) => { requests.push(options); queueMicrotask(() => handler(options)) },
  }
})
const input = () => ({ sourceType: 'SAMPLE_SCENE', sampleSceneId: 'sample', selection: { x: .1, y: .2, width: .6, height: .6 },
  solutionId: 's1', frameColorCode: 'GRAY', glassCode: 'CLEAR', clientRequestId: '00000000-0000-4000-8000-000000000001' })
test('未收到创建响应的提交保留原幂等标识，并按账户隔离', () => {
  const store = load('store/renders.ts')
  const record = store.beginSubmission('u1', input(), null)
  assert.equal(store.getSubmissions('u1')[0].key, record.key)
  assert.equal(store.getSubmissions('u2').length, 0)
  delete require.cache[require.resolve(path.join(root, 'store/renders.ts'))]
  assert.equal(load('store/renders.ts').getSubmissions('u1')[0].input.clientRequestId, record.input.clientRequestId)
})
test('生成请求使用真实接口、幂等头和阶段响应，禁止返回静态示例结果', async () => {
  handler = (options) => options.success({ statusCode: 202, data: { code: 'OK', data: {
    taskId: 'task1', status: 'PROCESSING', stage: 'GENERATING', stageLabel: 'AI 正在生成', progress: null, pollAfterMs: 3000, resultId: null, failure: null,
  } } })
  const gateway = new (load('services/stage-one-gateway.ts').StageOneGateway)()
  const task = await gateway.createRenderTask(input(), 'stable-key')
  assert.ok(requests[0].url.endsWith('/render-tasks'))
  assert.equal(requests[0].header['Idempotency-Key'], 'stable-key')
  assert.equal(requests[0].data.sampleSceneId, 'sample')
  assert.equal(task.id, 'task1'); assert.equal(task.progress, null); assert.equal(task.stage, 'GENERATING')
  assert.equal(task.result, undefined)
})
test('阶段只由服务端推进，失败不会点亮后续阶段', () => {
  const { stageSteps } = load('utils/render-poller.ts')
  assert.deepEqual(stageSteps('GENERATING', 'PROCESSING').map((step) => step.state), ['done', 'done', 'active', 'waiting'])
  assert.deepEqual(stageSteps('GENERATING', 'FAILED').map((step) => step.state), ['done', 'done', 'failed', 'waiting'])
  assert.deepEqual(stageSteps('QUEUED', 'DRAFT').map((step) => step.state), ['waiting', 'waiting', 'waiting', 'waiting'])
})
test('请求完成才调度下次查询，隐藏与重新显示不产生并发查询', async () => {
  const { RenderPoller } = load('utils/render-poller.ts')
  let complete, count = 0, updates = 0
  const poller = new RenderPoller(() => { count++; return new Promise((resolve) => { complete = resolve }) }, () => { updates++ }, () => {}, () => 0)
  poller.resume(); poller.pause(); poller.resume()
  assert.equal(count, 1)
  complete({ status: 'PROCESSING', pollAfterMs: 3000 })
  await new Promise((resolve) => setImmediate(resolve))
  assert.equal(updates, 0); assert.equal(count, 2)
  poller.pause()
  complete({ status: 'SUCCEEDED', pollAfterMs: 3000 })
  await new Promise((resolve) => setImmediate(resolve))
  assert.equal(updates, 0)
})

test('清理不重放尚未确认的创建请求，避免用户清理时意外启动计费生成', async () => {
  const store = load('store/renders.ts')
  const record = store.beginSubmission('u1', input(), null)
  store.updateSubmission('u1', record.key, { attempted: true })
  const gateway = new (load('services/stage-one-gateway.ts').StageOneGateway)()
  handler = () => { throw new Error('clear must not submit') }
  await assert.rejects(gateway.clearUserData(), (error) => error.code === 'RENDER_SUBMISSION_UNCONFIRMED')
  assert.equal(requests.length, 0)
  assert.equal(store.getSubmissions('u1').length, 1)
})

test('401 恢复时账户改变会阻止重发生成，避免使用另一账户的令牌计费', async () => {
  let generationCalls = 0
  wx.login = (options) => options.success({ code: 'synthetic-code' })
  wx.showToast = () => {}
  handler = (options) => {
    if (options.url.endsWith('/auth/wechat/login')) options.success({ statusCode: 200, data: { code: 'OK', data: {
      accessToken: 'token-u2', expiresIn: 7200, user: { id: 'u2' },
    } } })
    else { generationCalls++; options.success({ statusCode: 401, data: { code: 'UNAUTHORIZED', message: 'expired' } }) }
  }
  const gateway = new (load('services/stage-one-gateway.ts').StageOneGateway)()
  await assert.rejects(gateway.createRenderTask(input(), 'key-u1'), (error) => error.code === 'ACCOUNT_CHANGED')
  assert.equal(generationCalls, 1)
})

function resultPage() {
  let page
  global.Page = (definition) => { page = { ...definition, data: structuredClone(definition.data), setData(patch) { Object.assign(this.data, patch) } } }
  load('pages/result/index.ts')
  return page
}
test('切换账户重新显示结果页会立即清除旧账户的缓存图片', () => {
  const page = resultPage()
  page.onLoad({ resultId: 'result-u1' })
  page.data.result = { id: 'result-u1', afterImage: '/private/u1.png', imageUrlExpiresAt: new Date(Date.now() + 3600000).toISOString() }
  load('services/auth.ts').clearSession()
  storage.set('huaye_auth_session_v1', { accessToken: 'token-u2', expiresAt: Date.now() + 3600000, user: { id: 'u2' } })
  load('services/index.ts').gateway.getRenderResult = () => new Promise(() => {})
  page.onShow()
  assert.equal(page.data.result, null)
})
test('历史结果换方案不能复用另一任务的房间草稿', () => {
  const page = resultPage()
  page.data.result = { taskId: 'task-A' }
  const app = { globalData: { draft: { taskId: 'task-B', photo: { localPath: '/room-B' } } } }
  global.getApp = () => app
  let destination
  wx.navigateTo = (options) => { destination = options.url }
  wx.switchTab = (options) => { destination = options.url }
  page.regenerate()
  assert.equal(destination, '/pages/home/index')
})

test('创建响应丢失后重入复用原提交，网络错误不会展示生成失败', async () => {
  const { ApiError } = load('services/http-client.ts')
  const store = load('store/renders.ts')
  const record = store.beginSubmission('u1', input(), null)
  const gateway = load('services/index.ts').gateway
  const submitted = []
  gateway.createRenderTask = async (body, key) => {
    submitted.push({ body, key })
    if (submitted.length === 1) throw new ApiError('NETWORK_ERROR', 'offline', 0)
    return { id: 'accepted', status: 'QUEUED', stage: 'QUEUED', stageText: '等待生成', pollAfterMs: 3000, resultId: null, failure: null }
  }
  let page
  global.Page = (definition) => { page = { ...definition, data: structuredClone(definition.data), setData(patch) { Object.assign(this.data, patch) } } }
  load('pages/generating/index.ts')
  page.onLoad({ submissionKey: record.key }); page.onShow()
  await new Promise((resolve) => setImmediate(resolve))
  assert.notEqual(page.data.status, 'FAILED'); assert.match(page.data.connectionText, /连接暂时中断/)
  page.onHide(); page.onShow()
  await new Promise((resolve) => setImmediate(resolve))
  page.onUnload()
  assert.equal(submitted.length, 2); assert.deepEqual(submitted[0], submitted[1])
  assert.equal(store.getSubmissions('u1')[0].taskId, 'accepted')
})

test('弱网退避严格使用 3、6、12、15 秒，恢复后使用服务端轮询间隔', async () => {
  const { RenderPoller } = load('utils/render-poller.ts')
  const originalTimer = global.setTimeout, originalClear = global.clearTimeout
  const scheduled = [], delays = []
  let attempts = 0
  global.setTimeout = (callback, delay) => { scheduled.push(callback); delays.push(delay); return scheduled.length }
  global.clearTimeout = () => {}
  const poller = new RenderPoller(async () => {
    if (++attempts <= 4) throw new Error('offline')
    return { status: 'PROCESSING', pollAfterMs: 1500 }
  }, () => {}, () => {})
  try {
    poller.resume()
    for (let i = 0; i < 5; i++) {
      await new Promise((resolve) => setImmediate(resolve))
      if (i < 4) scheduled.shift()()
    }
    assert.deepEqual(delays, [3000, 6000, 12000, 15000, 1500])
  } finally { poller.pause(); global.setTimeout = originalTimer; global.clearTimeout = originalClear }
})

# 华业门窗小程序前端

微信原生小程序 + TypeScript 的首版可点击原型。

## 已实现

- 首页、方案、我的三个主导航页面。
- 相机/相册选择照片和可拖动缩放的矩形框选。
- 真实方案筛选、配置确认和 Seedream 5.0 Pro 生成任务。
- 生成失败重试、前后对比滑杆、收藏和预约表单。
- 服务端效果历史与回看、本地收藏和预约、按设备登记的数据清除。

登录、目录、照片、生成任务及结果历史已接入 FastAPI 后端。生成使用独立持久队列与 worker，进度仅展示真实阶段；收藏与预约沿用本地实现。后端未启用或未配置密钥时明确提示服务未启用。

## 后端接口联调

开发环境在 `config/api.ts` 配置 `origin` 和 `prefix`，当前分别为 `http://192.168.155.188:8000` 和 `/v1`。`prefix` 对应后端 `API_PREFIX`，可改为 `/api/v1` 或留空；业务调用路径不再硬编码版本号。换网络后需同步修改前端 origin 与后端 `.env.development` 的 `API_PUBLIC_BASE_URL`，然后重启后端、重新编译小程序。

具体接口、照片清理边界和开发者工具配置见 [首批接口联调说明](docs/backend-integration.md)。

## 本地运行

```powershell
npm install
npm run typecheck
npm test
```

使用微信开发者工具打开本目录：

```powershell
D:\微信web开发者工具\cli.bat open --project D:\Projects\HuayeWindowAI\code\HuayeWindowAI-MP
```

生成时间由真实排队与模型调用决定。页面隐藏停止查询，后台任务继续；在“我的”点击本设备任务可恢复。同一创建响应丢失时继续使用原幂等标识，不新增任务。

```text
pages/generating/index?submissionKey=本设备登记的提交标识
pages/result/index?resultId=当前账户结果ID
```

## 后端联调入口

业务能力统一由 `FrontendGateway` 暴露，`StageOneGateway` 调真实接口，`MockGateway` 只保留收藏/预约本地逻辑。账户提交记录在 `store/renders.ts`，单请求轮询在 `utils/render-poller.ts`。详情每次获取刷新图片签名，结果按原始宽高完整展示。

后端启动、字段和计费调用验收见后端 `docs/render-generation.md`。真实生成前需后端配置有模型权限的 `ARK_API_KEY`、开启 `RENDER_ENABLED` 并运行 worker。没有密钥时测试仍可用替身验证状态及页面，不会触发付费调用。隐私文案已更新，发布前需同步运营方备案的微信隐私指引。

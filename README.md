# 华业门窗小程序前端

微信原生小程序 + TypeScript 的首版可点击原型。

## 已实现

- 首页、方案、我的三个主导航页面。
- 相机/相册选择照片和可拖动缩放的矩形框选。
- 真实可生产方案筛选、配置确认和演示生成任务。
- 生成失败重试、前后对比滑杆、收藏和预约表单。
- 本地历史、收藏、预约记录与数据清除。

手机号登录、方案列表/详情、样例场景、照片上传和删除已接入真实 FastAPI 后端。AI 生图、收藏和预约仍使用本地实现；结果页明确标注“方案参考效果”，不会把住宅照片与方案图拼成真实生成结果。

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

正常流程约 4 秒进入结果页。需要检查失败状态时，可在微信开发者工具中直接编译页面：

```text
pages/generating/index?fail=1
```

## 后端联调入口

业务能力统一通过 `services/gateway.ts` 的 `FrontendGateway` 暴露，当前由 `StageOneGateway` 对接首批真实接口，并将尚未开发的生成、收藏和预约委托给 `MockGateway`。认证统一在 `services/auth.ts` 处理。

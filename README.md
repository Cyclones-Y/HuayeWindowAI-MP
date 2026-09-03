# 华业门窗小程序前端

微信原生小程序 + TypeScript 的首版可点击原型。

## 已实现

- 首页、方案、我的三个主导航页面。
- 相机/相册选择照片和可拖动缩放的矩形框选。
- 真实可生产方案筛选、配置确认和演示生成任务。
- 生成失败重试、前后对比滑杆、收藏和预约表单。
- 本地历史、收藏、预约记录与数据清除。

当前 AI 生图、照片上传和预约提交仍为本地演示；手机号登录已接入真实 FastAPI 后端。非真实结果会固定展示“演示效果”说明。

## 后端登录联调

开发者工具默认请求 `http://127.0.0.1:8000`。真机、体验版和正式版联调前，必须在 `config/api.ts` 中替换对应 HTTPS 地址，并在微信公众平台配置业务域名与隐私保护指引。

## 本地运行

```powershell
npm install
npm run typecheck
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

所有后端能力统一通过 `services/gateway.ts` 的 `FrontendGateway` 暴露。当前实现为 `MockGateway`；联调时新增 HTTP 实现并在 `services/index.ts` 切换，不需要修改页面调用方式。

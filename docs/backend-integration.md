# 首批接口联调（2026-09-07）

## 配置与启动

后端读取 `.env` 后再用 `.env.development` 覆盖。开发配置：

```dotenv
APP_HOST=0.0.0.0
APP_PORT=8000
API_PREFIX=/v1
API_PUBLIC_BASE_URL=http://192.168.155.188:8000
CATALOG_PUBLIC_BASE_URL=
PHOTO_STORAGE_BACKEND=local
PHOTO_LOCAL_DIRECTORY=data/photos
PHOTO_MAX_BYTES=10485760
PHOTO_MAX_PIXELS=40000000
PHOTO_THUMBNAIL_MAX_EDGE=512
PHOTO_PREVIEW_TTL_SECONDS=3600
```

`PHOTO_URL_SIGNING_KEY` 已在本地环境文件中配置，不能复制到前端或提交 Git。环境文件修改后需要重启后端；仅热重载代码不能保证重新读取环境文件。

前端 `config/api.ts` 的 `API_CONFIG.develop.origin` 对应 `API_PUBLIC_BASE_URL`，`prefix` 对应 `API_PREFIX`。例如后端改为 `API_PREFIX=/api/v1`，前端只改 `prefix: '/api/v1'`，登录和业务请求都会同步采用新前缀。origin 不包含版本路径。`CATALOG_PUBLIC_BASE_URL` 留空时由后端生成 `{API_PUBLIC_BASE_URL}/catalog`，公开素材路径不随接口前缀变化。

本机 `project.private.config.json` 已设置 `urlCheck: false`，供开发者工具进行局域网联调，该文件不提交 Git。其他开发者需在各自的本地设置中配置。手机需与电脑处于可互通网络，8000 端口需可访问。体验版/正式版的地址仍为占位值，上线时需替换为已配置的 HTTPS 服务地址；同时配置微信公众平台的 request、uploadFile、downloadFile 合法域名，照片及目录素材域名也需可访问。不要在页面中把服务端返回的图片地址替换成 localhost。

首次部署后端应按后端 README 完成数据库迁移和 `scripts/seed_catalog.py` 初始化。本次联调已确认开发服务能读取 3 个方案和 3 个样例；前端遇到空目录会展示空状态，服务错误会提示重试，不回退到静态目录。

## 已对接能力

以下路径均相对于配置的统一前缀：

| 接口 | 使用位置与行为 |
| --- | --- |
| `POST /auth/wechat/login` | 现有手机号登录和静默登录，移除重复 `/v1` |
| `GET /solutions` | 首页、方案页、方案选择与收藏展示；逐页读取，保持页面本地筛选 |
| `GET /solutions/{solutionId}` | 补全方案配置，最多 4 个并发；继续操作前重新确认可用配置 |
| `GET /sample-scenes` | 示例入口读取真实 ID、图片尺寸及默认框选，无需登录 |
| `POST /photos` | `wx.uploadFile` multipart 字段 `file`，purpose=`WINDOW_PREVIEW`，携带 Bearer |
| `DELETE /photos/{photoId}` | 替换/取消后清理照片，以及“我的”中清理本设备已记录的上传 |

上传后下载服务端规范化的预览图，再用服务端宽高进入框选，避免 HEIC/EXIF 方向差异。上传进度、取消、失败和下载失败均有处理。服务器明确返回 401 时恢复会话一次，网络失败不自动重传，避免重复创建照片。

本设备按登录用户记录已成功返回的照片 ID。删除失败会保留 ID 供重试；照片已不存在视为清理成功。所有登记照片删除成功后才清除本地历史、收藏和预约。其他设备的照片、上传响应丢失时未记录的照片以及账户本身不在此清理范围内；清理微信缓存不会删除服务器照片。当前没有服务端全量照片列表和账户注销接口。

## 生成与结果

`POST /render-tasks`、`GET /render-tasks/{id}`、`POST /render-tasks/{id}/retry`、`GET /render-results`、`GET /render-results/{id}`、`DELETE /render-results/{id}` 已对接真实生成。`DELETE /render-tasks/{id}` 用于回收失败输入快照。创建和重试携带 `Idempotency-Key`，样例生成也需要登录。后端配置及完整字段见后端 `docs/render-generation.md`。

任务按账户保存在设备，隐藏暂停轮询，显示立即查询；弱网按 3/6/12/15 秒退避，状态不改成生成失败。只有服务器报告 COMPLETED/SUCCEEDED 且详情可读取才跳转对比。结果拥有独立原图和配置快照，签名过期重新读取详情。历史从服务器分页读取，收藏与预约继续本地保存。

## 验证

```powershell
npm run typecheck
npm test
```

回归测试使用微信 API 替身验证前缀、分页、上传认证、401/网络错误、账户照片索引以及取消/替换竞态，不会上传真实住宅照片。真机照片选择、微信授权及手机网络访问仍需在实际设备上完成联调。

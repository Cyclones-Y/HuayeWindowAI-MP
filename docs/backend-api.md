# 门窗 AI 效果预览小程序后端接口文档

> 状态：登录、目录、照片、真实生成与结果历史已对接；收藏、预约和聚合清理接口仍为目标契约
>
> 版本：v1.2（2026-10-08）
>
> 适用前端：微信小程序
>
> 说明：`StageOneGateway` 已接入登录、方案、样例、照片、生成任务及结果接口。收藏与预约沿用本地实现；清理逐项删除本设备登记的资源，不调用尚未实现的 `/me/data`。本文中的 `/v1` 为可配置默认前缀。实际接入范围见 [接口联调说明](backend-integration.md)；生成部署与队列约束见后端 [真实生成文档](../../HuayeWindowAI-Backend/docs/render-generation.md)。第 9—13 节中未对接接口与 Spring Boot 建议保留作未来规划，当前后端为 FastAPI/MySQL 持久队列。

## 1. 范围

后端需要支撑以下完整链路：

1. 微信登录并建立用户身份。
2. 上传现场照片，保存为私有图片资产。
3. 查询可生产的门窗方案与配置项。
4. 提交框选区域和方案配置，异步生成效果图。
5. 查询生成进度、失败原因和最终结果。
6. 管理效果历史、收藏和预约量尺记录。
7. 查询个人中心概览并清除用户数据。

效果图和配置快照保存于服务端；本地保存任务恢复标识与本设备清理索引。收藏和预约本轮保留原有本地实现。

## 2. 通用约定

### 2.1 基础地址与认证

- 基础路径：`/v1`
- 认证方式：`Authorization: Bearer <accessToken>`
- JSON 请求：`Content-Type: application/json`
- 图片上传：`multipart/form-data`
- 幂等请求头：`Idempotency-Key: <uuid>`
- 链路标识：服务端响应 `requestId`，日志中必须可检索。

除登录、公开样例和公开方案查询外，其余接口要求登录，包括使用样例进行真实生成。

### 2.2 统一响应

成功响应：

```json
{
  "code": "OK",
  "message": "success",
  "data": {},
  "requestId": "req_01K..."
}
```

失败响应：

```json
{
  "code": "RENDER_TASK_FAILED",
  "message": "效果图生成失败，请重试",
  "data": {
    "reasonCode": "PROVIDER_TIMEOUT"
  },
  "requestId": "req_01K..."
}
```

### 2.3 数据格式

| 项目 | 约定 |
| --- | --- |
| ID | 所有主键、雪花 ID 均以字符串返回，禁止向前端返回 JavaScript `number` |
| 时间 | ISO 8601，例如 `2026-09-01T14:20:30+08:00` |
| 日期 | `YYYY-MM-DD` |
| 枚举 | 返回稳定英文代码；需要展示时同时返回 `label` |
| 空值 | 无数据使用 `null`；列表无数据使用 `[]`，不混用空字符串 |
| 坐标 | 相对原图的 `0~1` 归一化坐标 |
| 图片 URL | 私有对象存储的短时签名 HTTPS URL，过期后重新获取 |
| 分页 | 页码从 1 开始，默认 `size=20`，最大 `size=50` |

分页响应：

```json
{
  "items": [],
  "page": 1,
  "size": 20,
  "total": 0,
  "hasNext": false
}
```

### 2.4 三层契约边界

| 层级 | 本文约束 |
| --- | --- |
| HTTP 请求层 | 路径、方法、认证、参数名、必填性、状态码、幂等和错误响应 |
| Spring Boot 内部层 | Controller 参数校验、Service 事务和状态流转、DTO/Entity 映射、Mapper 条件、数据库字段类型 |
| 前端可见契约层 | 响应字段、字符串 ID、枚举代码、时间格式、分页、空值和图片 URL 有效期 |

内部类名和表结构可以按后端工程规范调整，但不得在未同步前端的情况下改变前端可见契约。

## 3. 接口清单

| 模块 | 方法 | 路径 | 用途 |
| --- | --- | --- | --- |
| 认证 | POST | `/v1/auth/wechat/login` | 微信登录 |
| 图片 | POST | `/v1/photos` | 上传现场照片 |
| 图片 | DELETE | `/v1/photos/{photoId}` | 删除未使用照片 |
| 样例 | GET | `/v1/sample-scenes` | 获取可体验的样例场景 |
| 方案 | GET | `/v1/solutions` | 获取门窗方案列表 |
| 方案 | GET | `/v1/solutions/{solutionId}` | 获取方案及可选配置 |
| 生成 | POST | `/v1/render-tasks` | 创建 AI 生成任务 |
| 生成 | GET | `/v1/render-tasks/{taskId}` | 查询任务状态 |
| 生成 | POST | `/v1/render-tasks/{taskId}/retry` | 重试失败任务 |
| 结果 | GET | `/v1/render-results` | 获取效果历史 |
| 结果 | GET | `/v1/render-results/{resultId}` | 获取效果详情 |
| 结果 | DELETE | `/v1/render-results/{resultId}` | 幂等清理本人结果及图片 |
| 生成 | DELETE | `/v1/render-tasks/{taskId}` | 清理终态任务输入，保留幂等记录 |
| 收藏 | GET | `/v1/favorites` | 获取收藏列表 |
| 收藏 | PUT | `/v1/favorites/{solutionId}` | 收藏方案 |
| 收藏 | DELETE | `/v1/favorites/{solutionId}` | 取消收藏 |
| 预约 | POST | `/v1/appointments` | 提交预约量尺 |
| 预约 | GET | `/v1/appointments` | 获取预约记录 |
| 用户 | GET | `/v1/me/summary` | 获取个人中心概览 |
| 隐私 | DELETE | `/v1/me/data` | 清除用户数据 |

## 4. 认证接口

### 4.1 微信登录

`POST /v1/auth/wechat/login`

请求：

```json
{
  "code": "wx.login 返回的临时登录 code",
  "phoneCode": "getPhoneNumber 返回的临时 code，已绑定微信身份可省略",
  "deviceId": "client_generated_device_id"
}
```

响应：

```json
{
  "code": "OK",
  "message": "success",
  "data": {
    "accessToken": "jwt_or_opaque_token",
    "expiresIn": 7200,
    "isNewUser": false,
    "user": {
      "id": "user_1048921180889999999",
      "nickname": null,
      "avatarUrl": null
    }
  },
  "requestId": "req_01K..."
}
```

服务端要求：

- 使用微信服务端接口换取 `openid`/`unionid`，不得信任客户端直接传入的身份字段。
- 首次出现的微信身份必须同时提交 `phoneCode`；未提交时返回 HTTP `428` 和 `PHONE_AUTH_REQUIRED`，由小程序展示手机号一键登录按钮。
- 手机号授权成功后自动建立业务用户，不提供注册页、密码、短信验证码或单独注册接口；后续同一微信身份只需新的 `wx.login` code 即可静默登录。
- 同一手机号通过新的微信身份登录时归并到同一业务用户；已绑定身份提交了其他账号的手机号时返回 `ACCOUNT_BINDING_CONFLICT`，不得静默切换账号。
- `accessToken` 是固定有效期 7200 秒的 Redis 随机会话令牌；同一设备重新登录轮换旧会话，其他设备会话不受影响。
- `session_key` 不返回前端，不写普通业务日志。
- 手机号按业务决定直接存储在 MySQL 中，并通过唯一索引完成账号归并；Redis、响应和日志中不得保存手机号。
- 登录应可重复调用，同一微信身份不能创建重复用户。

## 5. 图片与样例接口

### 5.1 上传现场照片

`POST /v1/photos`

表单字段：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `file` | File | 是 | JPG/PNG/HEIC，服务端统一转为可处理格式 |
| `purpose` | String | 是 | 固定为 `WINDOW_PREVIEW` |

响应：

```json
{
  "code": "OK",
  "message": "success",
  "data": {
    "photoId": "photo_01K...",
    "width": 3024,
    "height": 4032,
    "mimeType": "image/jpeg",
    "sizeBytes": 1482103,
    "previewUrl": "https://cdn.example.com/signed/...",
    "previewUrlExpiresAt": "2026-09-01T15:20:30+08:00",
    "createdAt": "2026-09-01T14:20:30+08:00"
  },
  "requestId": "req_01K..."
}
```

校验与处理：

- 文件大小上限建议 10 MB，最终值由 POC 确认。
- 校验真实 MIME 和图片解码结果，不能只看扩展名。
- 自动纠正 EXIF 方向并清除 EXIF/GPS。
- 原图和缩略图进入私有对象存储，禁止永久公开 URL。
- 返回可安全展示的错误，如 `PHOTO_TOO_LARGE`、`PHOTO_UNSUPPORTED`、`PHOTO_DECODE_FAILED`。

### 5.2 删除照片

`DELETE /v1/photos/{photoId}`

- 只能删除当前用户自己的照片。
- 已被有效生成结果引用的照片可改为逻辑删除，按数据保留策略异步清理。
- 重复删除返回成功，保持幂等。

### 5.3 样例场景

`GET /v1/sample-scenes`

响应 `data`：

```json
{
  "items": [
    {
      "id": "sample_living_room_01",
      "name": "客厅落地窗",
      "sceneType": "LIVING_ROOM",
      "thumbnailUrl": "https://cdn.example.com/samples/living-room.jpg",
      "width": 1280,
      "height": 1706,
      "defaultSelection": {
        "x": 0.12,
        "y": 0.16,
        "width": 0.76,
        "height": 0.66
      }
    }
  ]
}
```

## 6. 门窗方案接口

### 6.1 方案列表

`GET /v1/solutions?room=LIVING_ROOM&need=QUIET&page=1&size=20`

可选筛选：`room`、`need`、`keyword`。排序由服务端维护，前端不传任意 SQL 字段名。

- `room`：`LIVING_ROOM`、`BEDROOM`、`BALCONY`
- `need`：`QUIET`、`INSULATION`、`SAFETY`、`VENTILATION`

响应条目：

```json
{
  "id": "solution_living_panorama",
  "name": "全景推拉窗",
  "subtitle": "通透采光，开启灵活",
  "thumbnailUrl": "https://cdn.example.com/solutions/panorama.jpg",
  "room": "LIVING_ROOM",
  "needs": ["INSULATION", "VENTILATION"],
  "features": ["窄边大视野", "多道密封", "内开内倒"],
  "pricingNote": "量尺后按实际尺寸报价",
  "available": true
}
```

`pricingNote` 仅用于展示“量尺后报价”等说明，不得承载未经确认的价格。若后续支持真实价格，应新增结构化报价契约。

### 6.2 方案详情

`GET /v1/solutions/{solutionId}`

响应 `data`：

```json
{
  "id": "solution_living_panorama",
  "name": "全景推拉窗",
  "subtitle": "通透采光，开启灵活",
  "description": "适用于客厅和阳台的大面积采光场景",
  "coverUrl": "https://cdn.example.com/solutions/panorama.jpg",
  "galleryUrls": [],
  "room": "LIVING_ROOM",
  "needs": ["INSULATION", "VENTILATION"],
  "features": ["窄边大视野", "多道密封", "内开内倒"],
  "pricingNote": "量尺后按实际尺寸报价",
  "frameColors": [
    { "code": "SPACE_GRAY", "label": "太空灰", "colorHex": "#55595A", "available": true }
  ],
  "glassOptions": [
    { "code": "DOUBLE_HOLLOW", "label": "双层中空玻璃", "available": true }
  ],
  "defaultFrameColorCode": "SPACE_GRAY",
  "defaultGlassCode": "DOUBLE_HOLLOW",
  "available": true
}
```

服务端必须校验方案、颜色、玻璃组合是否仍可用，不能仅依赖前端列表。

## 7. AI 生成任务接口

### 7.1 创建任务

`POST /v1/render-tasks`

请求头必须包含 `Idempotency-Key`，请求体同时保留 `clientRequestId` 便于客户端恢复任务。

请求：

```json
{
  "sourceType": "UPLOADED_PHOTO",
  "photoId": "photo_01K...",
  "sampleSceneId": null,
  "selection": {
    "x": 0.12,
    "y": 0.12,
    "width": 0.76,
    "height": 0.70
  },
  "solutionId": "solution_living_panorama",
  "frameColorCode": "SPACE_GRAY",
  "glassCode": "DOUBLE_HOLLOW",
  "clientRequestId": "7d460f47-7cf8-49de-9b02-2a4b912e7bc8"
}
```

字段规则：

| 字段 | 规则 |
| --- | --- |
| `sourceType` | `UPLOADED_PHOTO` 或 `SAMPLE_SCENE` |
| `photoId` | 上传照片时必填，且必须属于当前用户 |
| `sampleSceneId` | 样例场景时必填；与 `photoId` 二选一 |
| `selection` | `x/y/width/height` 均在 `0~1`；不得超出图片；面积需达到服务端阈值 |
| `solutionId` | 必须为可用方案 |
| `frameColorCode` | 必须属于该方案的可用颜色 |
| `glassCode` | 必须属于该方案的可用玻璃配置 |
| `clientRequestId` | UUID，同一用户内唯一 |

响应：HTTP `202 Accepted`

```json
{
  "code": "OK",
  "message": "task accepted",
  "data": {
    "taskId": "task_01K...",
    "status": "QUEUED",
    "progress": null,
    "stage": "QUEUED",
    "stageLabel": "等待生成",
    "pollAfterMs": 3000,
    "resultId": null,
    "failure": null,
    "createdAt": "2026-09-01T14:20:30+08:00"
  },
  "requestId": "req_01K..."
}
```

### 7.2 查询任务

`GET /v1/render-tasks/{taskId}`

状态机：

```text
QUEUED -> PROCESSING -> SUCCEEDED
                     -> FAILED
```

前端类型中的 `DRAFT` 只表示尚未提交的本地草稿，不是服务端任务状态，也不能写入 `render_task.status`。

阶段为 `QUEUED → PREPARING → GENERATING → SAVING → COMPLETED`。阶段进度条只依据服务端阶段，`progress` 始终为 `null`；排队和 AI 生成轮询 3000ms，准备与保存 1500ms。失败保留发生阶段，不标记完成。网络查询失败不改写任务状态。

响应 `data`：

```json
{
  "taskId": "task_01K...",
  "status": "PROCESSING",
  "progress": null,
  "stage": "GENERATING",
  "stageLabel": "正在生成效果图",
  "pollAfterMs": 3000,
  "resultId": null,
  "failure": null,
  "createdAt": "2026-09-01T14:20:30+08:00",
  "updatedAt": "2026-09-01T14:20:36+08:00"
}
```

成功时 `resultId` 必填；失败时返回可展示和可诊断信息：

```json
{
  "status": "FAILED",
  "progress": null,
  "stage": "GENERATING",
  "failure": {
    "code": "RENDER_PROVIDER_TIMEOUT",
    "message": "生成超时，请重试",
    "retryable": true,
    "stage": "GENERATING"
  }
}
```

任务查询不得返回模型供应商 API Key、原始供应商报错或内部提示词。

### 7.3 重试任务

`POST /v1/render-tasks/{taskId}/retry`

- 仅允许重试当前用户的 `FAILED` 且 `retryable=true` 的任务。
- 请求头必须包含新的 `Idempotency-Key`。
- 返回新的 `taskId`，旧任务保留用于审计。
- 重试复制原任务图片、配置和模型版本；同 key 恢复原重试任务。模型请求发出后的超时或中断不自动重发，主动重试可能产生新的模型费用。

## 8. 效果结果接口

### 8.1 效果历史

`GET /v1/render-results?page=1&size=20`

条目使用效果详情字段，图片地址每次查询重新签发：

```json
{
  "id": "result_01K...",
  "taskId": "task_01K...",
  "resultType": "USER_GENERATED",
  "width": 1280,
  "height": 1706,
  "solution": {"id": "solution_living_panorama", "name": "全景推拉窗", "frameColorCode": "SPACE_GRAY", "frameColorLabel": "太空灰", "glassCode": "DOUBLE_HOLLOW", "glassLabel": "双层中空玻璃"},
  "beforeImageUrl": "https://cdn.example.com/signed/before.png",
  "afterImageUrl": "https://cdn.example.com/signed/after.png",
  "imageUrlExpiresAt": "2026-10-08T15:22:10+08:00",
  "disclaimer": "AI 生成效果仅供方案预览，实际效果以现场测量和施工为准",
  "createdAt": "2026-09-01T14:22:10+08:00"
}
```

`resultType`：`USER_GENERATED` 或 `SAMPLE_DEMO`。不要使用类型定义为字面量 `true` 的 `isDemo`。

两种类型均为真实模型生成，区别是上传照片或公开样例来源。详情额外返回原图 `width/height`，前后图同尺寸，`solution` 为配置快照。

### 8.2 效果详情

`GET /v1/render-results/{resultId}`

响应 `data`：

```json
{
  "id": "result_01K...",
  "taskId": "task_01K...",
  "resultType": "USER_GENERATED",
  "beforeImageUrl": "https://cdn.example.com/signed/before.jpg",
  "afterImageUrl": "https://cdn.example.com/signed/after.jpg",
  "imageUrlExpiresAt": "2026-09-01T15:22:10+08:00",
  "solution": {
    "id": "solution_living_panorama",
    "name": "全景推拉窗",
    "frameColorCode": "SPACE_GRAY",
    "frameColorLabel": "太空灰",
    "glassCode": "DOUBLE_HOLLOW",
    "glassLabel": "双层中空玻璃"
  },
  "disclaimer": "AI 生成效果仅供方案预览，实际效果以现场测量和施工为准",
  "createdAt": "2026-09-01T14:22:10+08:00"
}
```

## 9. 收藏接口

以下收藏接口仍为未来目标，本轮继续使用原有本地收藏。

### 9.1 收藏列表

`GET /v1/favorites?page=1&size=20`

返回分页方案摘要，并增加 `favoritedAt`。

### 9.2 收藏与取消收藏

- `PUT /v1/favorites/{solutionId}`
- `DELETE /v1/favorites/{solutionId}`

两者均为幂等接口。收藏已收藏的方案或取消未收藏的方案都返回成功，不能使用服务端 toggle，以避免并发或重试导致状态反转。

## 10. 预约接口

以下预约接口仍为未来目标，本轮继续使用原有本地预约。

### 10.1 提交预约量尺

`POST /v1/appointments`

请求头必须包含 `Idempotency-Key`。

请求：

```json
{
  "contactName": "张先生",
  "mobile": "13800138000",
  "cityCode": "待业务确认",
  "districtCode": "待业务确认",
  "address": "详细地址",
  "preferredDate": "2026-09-05",
  "preferredTimeCode": "AFTERNOON",
  "resultId": "result_01K...",
  "solutionId": "solution_living_panorama",
  "remark": "工作日联系"
}
```

响应 `data`：

```json
{
  "appointmentId": "appointment_01K...",
  "status": "SUBMITTED",
  "statusLabel": "已提交",
  "preferredDate": "2026-09-05",
  "preferredTimeCode": "AFTERNOON",
  "preferredTimeLabel": "下午 13:00-18:00",
  "createdAt": "2026-09-01T14:30:00+08:00"
}
```

规则：

- 服务端校验姓名、手机号、日期、时段和服务区域。
- `preferredTimeCode` 使用稳定代码，不接收显示文案作为业务值。
- `resultId` 和 `solutionId` 用于让工作人员了解用户意向；至少一个应存在，最终规则待业务确认。
- 手机号直接存储，日志只保留脱敏值，并限制仅授权服务访问该字段。

### 10.2 预约记录

`GET /v1/appointments?page=1&size=20`

返回分页预约摘要，状态建议包括：`SUBMITTED`、`CONTACTED`、`SCHEDULED`、`COMPLETED`、`CANCELLED`。本版本仅提供查询，不包含用户取消或改期接口。

## 11. 个人中心与数据清除

本轮历史通过 `/render-results` 查询；以下聚合接口尚未实现。清理只处理本设备登记的照片、结果与终态任务输入，部分失败保留索引以供再次清理。

### 11.1 个人概览

`GET /v1/me/summary`

响应 `data`：

```json
{
  "renderResultCount": 3,
  "favoriteCount": 2,
  "appointmentCount": 1,
  "latestAppointmentStatus": "SUBMITTED"
}
```

### 11.2 清除用户数据

`DELETE /v1/me/data`

请求：

```json
{
  "confirmation": "CLEAR_MY_DATA"
}
```

响应 `data`：

```json
{
  "requestId": "erase_01K...",
  "status": "ACCEPTED",
  "scope": ["PHOTOS", "RENDER_TASKS", "RENDER_RESULTS", "FAVORITES", "APPOINTMENTS"],
  "acceptedAt": "2026-09-01T14:40:00+08:00"
}
```

接口可先逻辑删除并异步清理对象存储，但必须明确响应表示“已受理”还是“已彻底删除”。法定或审计必须保留的数据应在隐私政策中单独说明，不能承诺无法执行的即时物理删除。

## 12. 错误码与 HTTP 状态

| HTTP | 错误码 | 使用场景 |
| --- | --- | --- |
| 400 | `INVALID_ARGUMENT` | 通用参数错误 |
| 400 | `INVALID_SELECTION` | 框选区域越界或过小 |
| 400 | `SOLUTION_OPTION_MISMATCH` | 方案、颜色、玻璃组合无效 |
| 400 | `APPOINTMENT_TIME_INVALID` | 预约日期或时段无效 |
| 401 | `UNAUTHORIZED` | 未登录或令牌失效 |
| 401 | `WECHAT_CODE_INVALID` | 微信临时登录码或手机号授权码无效 |
| 403 | `RESOURCE_FORBIDDEN` | 访问其他用户资源 |
| 404 | `RESOURCE_NOT_FOUND` | 资源不存在或已删除 |
| 409 | `IDEMPOTENCY_CONFLICT` | 同一幂等键对应不同请求 |
| 409 | `ACCOUNT_BINDING_CONFLICT` | 已绑定微信身份与本次授权手机号属于不同账号 |
| 413 | `PHOTO_TOO_LARGE` | 图片超过服务端限制 |
| 415 | `PHOTO_UNSUPPORTED` | 图片类型或编码不支持 |
| 422 | `PHOTO_DECODE_FAILED` | 图片无法解码 |
| 422 | `RENDER_CONTENT_REJECTED` | 图片不符合生成要求或内容安全拒绝 |
| 428 | `PHONE_AUTH_REQUIRED` | 首次微信身份尚未完成手机号授权 |
| 429 | `RATE_LIMITED` | 生成频率或接口频率超限 |
| 503 | `WECHAT_SERVICE_UNAVAILABLE` | 微信服务调用失败或响应异常 |
| 500 | `INTERNAL_ERROR` | 未分类服务端错误 |
| 502 | `RENDER_PROVIDER_ERROR` | 模型供应商错误 |
| 504 | `RENDER_PROVIDER_TIMEOUT` | 模型供应商超时 |

错误信息应面向用户给出可执行提示，同时保留 `requestId` 供排查。供应商原始错误仅进入受控审计日志。

## 13. Spring Boot 落地边界

### 13.1 模块建议

| 模块 | 主要职责 |
| --- | --- |
| `auth` | 微信登录、令牌签发、用户身份 |
| `user` | 用户资料、个人概览、数据清除 |
| `catalog` | 方案、颜色、玻璃和可用组合 |
| `media` | 上传校验、图片处理、对象存储、签名 URL |
| `render` | 任务状态机、队列、模型适配、结果入库 |
| `favorite` | 用户收藏关系 |
| `appointment` | 预约创建、查询和状态 |
| `privacy` | 数据保留、删除任务和审计 |

建议先采用模块化单体，外加 MySQL、Redis、消息队列和私有对象存储。模型调用使用供应商无关的 `ImageModelProvider` 接口，POC 完成前不在业务层绑定具体供应商。

### 13.2 数据表建议

- `user`
- `photo_asset`
- `window_solution`
- `solution_option`
- `render_task`
- `render_result`
- `user_favorite`
- `appointment`
- `provider_call_audit`
- `data_erasure_log`

Controller 仅处理协议转换、参数校验和认证上下文。生成任务创建、状态流转、预约创建、收藏写入和删除申请在 Service 层处理事务与幂等；Mapper 更新必须包含明确主键、所属用户和预期状态条件。

### 13.3 异步生成要求

- 创建任务事务提交后再投递队列，避免队列先消费而数据库未提交。
- 消费者按任务 ID 幂等执行，状态更新使用乐观锁或条件更新。
- 供应商返回的临时图片必须及时转存自有私有存储。
- 记录供应商请求耗时、响应码、计费量和失败类别，但不记录密钥、完整原图或敏感提示词。
- API Key 仅存后端密钥管理系统，不进入小程序代码、配置文件或客户端响应。

## 14. 前端联调改造清单

| 当前前端行为 | 联调目标 |
| --- | --- |
| 使用图片 `localPath` 贯穿流程 | 上传后保存 `photoId`，本地路径只用于即时预览 |
| 创建任务发送完整 `WindowSolution` | 只提交 `solutionId`、`frameColorCode`、`glassCode` |
| 方案使用 `thumbnail`、`priceHint`、`room`、`needs` | DTO 映射到 `thumbnailUrl`、`pricingNote`、`room`、`needs`，或在联调前统一字段名 |
| 框选数据只保存在页面状态 | 创建任务时提交归一化 `selection` |
| `RenderStatus` 包含本地 `DRAFT` | `DRAFT` 保留为前端草稿状态，服务端只返回四种任务状态 |
| `RenderResult.isDemo` 使用字面量 `true` | 改为普通布尔或推荐的 `resultType` 枚举 |
| 历史、收藏、预约依赖本地缓存 | 改为服务端分页接口，本地仅做短期缓存 |
| 收藏使用 toggle | 根据目标状态调用 `PUT` 或 `DELETE` |
| 预约只保存表单展示值 | 提交稳定时段代码，并关联 `resultId`/`solutionId` |
| 登录未形成统一初始化链路 | 应用启动时登录，令牌失效时统一刷新或重新登录 |
| 清除数据只清本地状态 | 后端受理成功后同步清理本地草稿和缓存 |

## 15. 页面与接口映射

| 页面 | 主要接口 |
| --- | --- |
| 首页 | `GET /sample-scenes`、`GET /solutions` |
| 上传照片 | `POST /photos`、`DELETE /photos/{photoId}` |
| 框选区域 | 本地交互；提交时由 `POST /render-tasks` 校验 |
| 选择方案 | `GET /solutions`、`GET /solutions/{solutionId}` |
| 确认生成 | `POST /render-tasks` |
| 生成中 | `GET /render-tasks/{taskId}`、`POST /render-tasks/{taskId}/retry` |
| 效果结果 | `GET /render-results/{resultId}`、收藏接口 |
| 方案/历史 | `GET /render-results`、`GET /favorites` |
| 预约量尺 | `POST /appointments`、`GET /appointments` |
| 个人中心 | `GET /me/summary`、`DELETE /me/data` |

## 16. 开发顺序建议

1. 登录、方案目录、图片上传。
2. 生成任务状态机、队列、模型适配器和结果存储。
3. 历史、结果详情与签名 URL 刷新。
4. 收藏、预约、个人概览。
5. 数据清除、审计、限流、监控与告警。

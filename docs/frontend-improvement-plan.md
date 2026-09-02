# 前端产品改造方案（2026-09-02）

> 基于当前工作区代码（含未提交的样板册精修）逐页审阅后给出。视角是产品经理：先看漏斗是否通、承诺是否可信、上线是否有阻塞，再看交互细节。视觉方向（住宅材料样板册）不变，本方案不讨论换风格。

## 一、总体判断

流程骨架已经成立：上传 → 框选 → 选方案 → 确认 → 生成 → 结果 → 预约，页面守卫、草稿状态和网关边界都做对了。当前主要问题不在"页面好不好看"，而在四件事：

1. **漏斗只有一条路。** 唯一的预约入口在结果页底部，不想上传家里照片的用户没有任何出口；方案页、收藏页点了只能进上传。
2. **预约线索和方案脱钩。** 预约表单不带方案、颜色、玻璃、结果 ID，工作人员拿到的只是"某人某小区某时间"，前面 6 步的信息全丢了。
3. **"我的"是只读页。** 历史、收藏、预约记录都点不动，用户回来后无法回看效果、无法从收藏继续。
4. **有一项确定的上线阻塞。** 小程序调用相机/相册前必须接入微信隐私授权机制，目前完全没有。

其余是一致性和细节问题，逐条列在第二节。

## 二、问题清单与改造方案

优先级定义：P0 = 不改不能上线或明显误导用户；P1 = 直接影响转化；P2 = 联调前必须补齐的结构准备；P3 = 后续版本。

### P0-1 微信隐私授权缺失（上线阻塞）

- **现状**：`pages/upload` 直接调用 `wx.chooseMedia`，`app.json` 没有 `__usePrivacyCheck__`，代码里没有 `wx.requirePrivacyAuthorize` / `onNeedPrivacyAuthorization` 处理。
- **影响**：基础库 2.32.3 之后，未配置隐私保护指引时相机、相册接口在真机上会直接失败，用户看到的是"暂时无法读取照片"弹窗。
- **改造**：
  1. `app.json` 增加 `"__usePrivacyCheck__": true`；在小程序后台填写《用户隐私保护指引》，勾选相机、相册、手机号。
  2. 上传页 `choosePhoto` 前先 `wx.requirePrivacyAuthorize()`，拒绝时留在本页并给出可重新触发的说明，不要弹系统错误。
  3. 上传页现有的"照片仅用于生成门窗效果图"说明保留，作为授权前的解释层。
- **涉及**：`app.json`、`pages/upload/index.ts`、`pages/upload/index.wxml`。

### P0-2 页面栈会叠到上限

- **现状**：结果页"换个方案"用 `wx.navigateTo` 打开选方案页，走完一轮后栈变成 home → upload → selection → solution-select → confirm → result → solution-select → confirm → result……第二轮就接近 10 层上限，第三轮 `navigateTo` 静默失败。
- **改造**：结果页"换个方案"改为 `wx.navigateBack({ delta })`，delta 通过 `getCurrentPages()` 定位到 solution-select；如果栈里找不到，再 `redirectTo`。生成页成功后已经用 `redirectTo`，保持。
- **涉及**：`pages/result/index.ts`。

### P0-3 预约不携带方案与结果

- **现状**：`LeadForm` 只有联系人、手机、小区、日期、时段、备注。预约页顶部也不显示用户刚看过的方案。
- **影响**：线索质量差，工作人员上门前不知道用户倾向；后端契约第 14 节也明确要求关联 `resultId` / `solutionId`。
- **改造**：
  1. 预约页顶部增加"本次预约的方案"摘要块：方案缩略图、名称、已选颜色、已选玻璃，从 draft 读取；来自收藏或方案详情的入口只显示方案名。
  2. `LeadForm` 增加 `solutionId`、`resultId?`、`frameColorCode?`、`glassCode?`；`LocalLead` 增加 `solutionName` 用于"我的"页展示。
  3. 时段从展示字符串改为 `{ code, label }`，提交 code，展示 label（契约要求稳定时段代码）。
- **涉及**：`types/index.ts`、`pages/appointment/*`、`services/gateway.ts`、`services/mock-gateway.ts`、`store/session.ts`。

### P0-4 结果页对比图不按照片比例显示

- **现状**：`.compare-stage` 固定 760rpx 高、`aspectFill` 裁切。三张内置方案图是竖图勉强可用，真实用户照片横竖比例不定，接入真实生图后门窗会被裁掉。
- **改造**：结果页 `onReady` 用 `utils/selection-overlay.ts` 里已有的 `fitStageHeight` 按结果图尺寸算高度，`aspectFit` 显示；改造前/后两张图必须同宽同高、左上对齐，滑杆逻辑不变。`RenderResult` 需要带 `width` / `height`（见 P2-1）。
- **涉及**：`pages/result/index.ts`、`pages/result/index.wxss`、`types/index.ts`。

### P0-5 首页"你最想改善什么"与方案数据不一致

- **现状**：四宫格是通风、隔音、采光、安全，但 `NeedType` 只有 QUIET / INSULATION / SAFETY / VENTILATION，没有"采光"；四个格子点击都只是 `switchTab` 到方案页，不带任何筛选。
- **影响**：用户点"采光明亮"进去看到的是全部方案，找不到对应关系；"保温"这个真实存在的需求在首页反而没有入口。
- **改造**：
  1. 宫格改为 隔音降噪 / 保温节能 / 安全安心 / 通风舒适，与 `NeedType` 一一对应。
  2. `switchTab` 不能带参数，在 `app.globalData` 增加 `pendingSolutionFilter: { need?: NeedType; room?: RoomType }`，首页点击时写入，方案页 `onShow` 读取并消费后清空。
- **涉及**：`pages/home/*`、`pages/solutions/index.ts`、`app.ts`、`store/session.ts`。

### P0-6 预期管理文案漂移

- **现状**：同一句边界说明在首页、方案页、确认页、结果页、预约页有五种写法（"以上门量尺为准" / "以现场量尺、选材和施工结果为准" / "以现场沟通为准"……）。
- **改造**：在 `data/copy.ts` 定义一条标准句 `DISCLAIMER = '效果图仅供参考，尺寸、价格与施工方式以上门量尺为准。'`，所有页面引用同一常量；页面局部可以在前面加一句情境说明，但标准句不再改写。同时预约成功页"预约信息已保存"改为"预约已提交"，"保存"会让用户以为没有发出去。
- **涉及**：新增 `data/copy.ts`，五个页面的 wxml/ts。

### P0-7 筛选组合 25% 会落空

- **现状**：方案页空间 × 需求两层筛选，3 套方案下 12 种组合里有 3 种为空（卧室+通风、客厅+安全、阳台+隔音），用户很容易看到"没有完全匹配的方案"。同时右上角"3 套可选"这个数字反而削弱可信度。
- **改造**：
  1. 筛选逻辑改为"匹配的排前面，不匹配的保留在下方并标注'其他空间方案'"，不再出现空态；空态样式保留给加载失败。
  2. 去掉"N 套可选"计数，等方案库扩到两位数再考虑恢复。
- **涉及**：`pages/solutions/*`、`pages/solution-select/*`。

### P1-1 增加方案详情页，形成第二条漏斗

- **现状**：方案卡片只有名称、副标题、三个词的特性、色块、报价说明；点击直接 `resetDraft` 进上传页。没有地方能看到方案的同场景改造前后对比、适用空间、能改善什么、玻璃配置区别。
- **改造**：新增 `pages/solution-detail`，内容自上而下：
  1. 该方案自带的同场景改造前后对比（`beforeImage` / `afterImage`，复用结果页滑杆，抽成 `components/compare-slider`）。
  2. 适用空间、解决的问题（需求标签展开为一句话说明，来自 `data/solutions.ts` 新增字段 `needNotes`）。
  3. 边框颜色与玻璃配置，只展示不选择。
  4. 报价说明 + 标准边界句。
  5. 底部双按钮："用我家照片预览"（主按钮，走现有流程）和"直接预约量尺"（次按钮，进预约页，draft 只带 solution）。
- 首页横滑卡片、方案页列表、收藏列表统一改为进入详情页；只有流程内的 `solution-select` 保持"点选即选中"。
- **涉及**：新增页面、`components/compare-slider`、`app.json`、`data/solutions.ts`、三个列表页。

### P1-2 "我的"页三类记录可点击、可继续

- **现状**：历史只显示方案缩略图和"效果已生成"，无时间、不可点；收藏不可点；预约只有一行。
- **改造**：
  1. 历史项显示生成时间（`createdAt`），点击进入结果页。结果页 `onLoad` 改为支持从历史加载：通过 `pendingResultId` 写入 draft，而不是只匹配 `draft.taskId`；在历史模式下隐藏"换个方案"，保留收藏与预约。
  2. 收藏项点击进方案详情页；列表项右侧提供"预约"快捷按钮。
  3. 预约项显示方案名、提交时间、状态说明文字（"工作人员会在 1 个工作日内联系你"这类承诺需业务确认后再写，未确认前只写"等待工作人员确认"）。
- **涉及**：`pages/profile/*`、`pages/result/index.ts`、`types/index.ts`。

### P1-3 示例照片流程绕过了框选

- **现状**：`trySample` 直接写死客厅照片和选区，跳到选方案页；用户没有体验到框选这一步，选了卧室方案后看到的又是卧室图，前后不连贯。
- **改造**：示例入口进入框选页（带预置选区），框选页顶部显示"示例照片"小标签；示例照片跟随用户后续选择的方案空间切换（`solution.beforeImage`），保证结果页前后图同场景。
- **涉及**：`pages/home/*`、`pages/selection/*`、`pages/generating/index.ts`。

### P1-4 框选默认值与校验

- **现状**：默认框占 76% × 70%，大多数用户不调整直接"选好了"，选区约等于整张照片；只有四角手柄，单向调整要拖两次。
- **改造**：
  1. 默认框改为居中 52% × 46%。
  2. 增加四条边中点手柄（n / s / e / w），`calculateBox` 已支持按 mode 字符判断，只需补 wxml 与样式。
  3. 确认时若选区面积 > 85% 弹出确认："选框几乎覆盖整张照片，确认只框门窗区域吗？"，可继续。
- **涉及**：`pages/selection/*`。

### P1-5 方案卡片信息重排

- **现状**：卡片 footer 显示 `priceHint`，三张卡都是"量尺后……报价"，重复且无信息量；卡片没有显示适用空间，`solution-select` 页又没有空间筛选，用户不知道这套窗是给客厅还是卧室的。
- **改造**：footer 左侧改为空间标签（客厅 / 卧室 / 阳台）+ 需求标签，右侧保留色块；`priceHint` 只在详情页和结果页出现。
- **涉及**：`components/solution-card/*`。

### P1-6 大标题硬换行

- **现状**：`page-title` 用两个 `<text>` 强制拆行（"先拍下你家 / 现在的门窗"），微信字体放大或窄屏时会出现三行、孤字。
- **改造**：改为单个文本自然换行，需要控制断句处用 `\n` 只在宽屏不溢出时保留；PRD 8.4 要求字体放大不遮挡操作，需在开发者工具"字体放大"模式下过一遍全部标题。
- **涉及**：全部流程页 wxml。

### P2-1 数据模型对齐后端契约

按 `docs/backend-api.md` 第 14 节，前端现在就可以先改结构，Mock 同步适配，避免联调时页面大改：

| 项 | 改法 |
| --- | --- |
| `PhotoDraft` | 增加 `photoId?: string`，`localPath` 只用于预览 |
| `CreateRenderTaskInput` | 改为 `{ photoId, solutionId, frameColorCode, glassCode, selection }`，Mock 内部再查方案 |
| `RenderResult` | `isDemo: true` 改为 `resultType: 'AI' / 'REFERENCE'`；增加 `width`、`height`、`sourcePhotoId`、`selection` |
| `LocalHistoryItem` | 增加 `frameColorCode`、`glassCode`，历史回看时能还原配置 |
| 收藏 | `favoriteSolution(id, next: boolean)`，Mock 内部仍用 toggle 存储 |
| `LeadForm` | 见 P0-3 |

### P2-2 启动登录链路

- **现状**：`gateway.login` 从未被调用，`app.ts` 只初始化 draft。
- **改造**：`app.onLaunch` 调用 `gateway.login()`，结果放 `globalData.session`；提供 `ensureSession()` 供预约提交、收藏前调用；令牌失效的统一处理留到 HTTP 网关实现时补。
- **涉及**：`app.ts`、`services/*`。

### P2-3 埋点封装

- **现状**：PRD 第 9 节定义了 14 个事件，前端没有任何埋点调用点。
- **改造**：新增 `utils/track.ts`，`track(event, props)` 当前只 `console.debug`；在 PRD 列出的节点各加一行调用。特别注意 `selection_confirmed` 只上报面积区间，`appointment_submitted` 不上报手机号与地址。
- **涉及**：`utils/track.ts`、各页面 ts。

### P2-4 生成页与结果页的健壮性

- 生成页 `disableScroll: true`，失败态多出失败面板和两个按钮，在 iPhone SE 尺寸下需实测是否被截断；不通过则失败态允许滚动。
- 轮询失败（`getRenderTask` 抛错）目前没有 catch，一次网络抖动会让页面卡在中间进度；补 catch，连续失败 3 次转失败态。
- 结果页 `onShareAppMessage` 分享的是首页与方案缩略图，符合隐私要求，但按钮文案是"分享效果"，改为"分享方案"避免用户以为分享的是自家效果图。

### P3 后续版本候选

- 预约提交后 `wx.requestSubscribeMessage` 订阅"上门时间确认"通知，把"工作人员会与你确认"做成闭环。
- 结果页"保存对比图"：canvas 合成前后图 + 方案名 + 标准边界句，保存到相册。
- 生成中任务在"我的"页可见、可回到生成页（依赖后端任务持久化）。
- 企业认证后，预约页手机号用 `getPhoneNumber` 一键填充。
- 支持同一张照片多个选框（双窗户）。

## 三、实施顺序

| 迭代 | 内容 | 目标 |
| --- | --- | --- |
| 第 1 轮（1 周内） | P0 全部：隐私授权、页面栈、预约关联方案、结果页比例、首页宫格一致、文案常量、筛选不落空 | 可提交审核的最小可信版本 |
| 第 2 轮（1–2 周） | P1-1 方案详情页 + compare-slider 组件、P1-2 我的页可点、P1-5 卡片重排 | 打通第二条预约漏斗 |
| 第 3 轮（与第 2 轮并行） | P1-3、P1-4、P1-6 交互细节；P2-1 ~ P2-4 结构准备 | 联调零页面改动 |
| 联调后 | P3 | 视业务确认情况排期 |

每轮结束的验收方式：`npm run typecheck` 通过；开发者工具 iPhone 15 Pro 与一台安卓机型各截一遍全流程；字体放大模式过一遍标题与底部按钮；上一轮精修尚未做截图验证，第 1 轮开始前先把这笔账补上。

## 四、需要业务侧拍板的事项

这些不是前端能自己决定的，第 1 轮开始前给答案，否则相关文案只能留白：

1. 预约成功后工作人员的响应时限，能否写进成功页与预约记录。
2. 首发服务城市：预约页"小区或所在区域"是否要加城市选择并拦截不服务区域。
3. 预约是否允许不关联任何方案（纯咨询）；如允许，方案详情页"直接预约"之外是否还需首页入口。
4. 游客能否使用真实照片生成，还是必须先登录。
5. 方案库近期是否会从 3 套扩充；决定方案页筛选的复杂度和是否恢复计数。
6. 是否已有企业主体认证，决定手机号一键填充和订阅消息能否上。

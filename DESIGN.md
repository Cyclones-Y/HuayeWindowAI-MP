---
name: 门窗效果预览小程序
description: 住宅建筑杂志与材料样板册气质的微信小程序设计系统
colors:
  forest-action: "#244233"
  forest-secondary: "#375345"
  paper-ground: "#F8F5F0"
  paper-surface: "#FFFEFA"
  paper-muted: "#E4E4DC"
  ink-primary: "#262C23"
  line-neutral: "#D8D5CE"
  clay-accent: "#C07048"
  error-muted: "#A6433B"
typography:
  display:
    fontFamily: '-apple-system, "Helvetica Neue", "PingFang SC", "Microsoft YaHei", sans-serif'
    fontSize: "56rpx"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "0"
  headline:
    fontFamily: '-apple-system, "Helvetica Neue", "PingFang SC", "Microsoft YaHei", sans-serif'
    fontSize: "50rpx"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0"
  title:
    fontFamily: '-apple-system, "Helvetica Neue", "PingFang SC", "Microsoft YaHei", sans-serif'
    fontSize: "34rpx"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "0"
  body:
    fontFamily: '-apple-system, "Helvetica Neue", "PingFang SC", "Microsoft YaHei", sans-serif'
    fontSize: "26rpx"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "0"
  label:
    fontFamily: '-apple-system, "Helvetica Neue", "PingFang SC", "Microsoft YaHei", sans-serif'
    fontSize: "22rpx"
    fontWeight: 600
    lineHeight: 1.45
    letterSpacing: "0"
rounded:
  surface: "16rpx"
  control: "24rpx"
  button: "28rpx"
  success: "32rpx"
spacing:
  xs: "8rpx"
  sm: "16rpx"
  md: "24rpx"
  lg: "32rpx"
  xl: "48rpx"
components:
  button-primary:
    backgroundColor: "{colors.forest-action}"
    textColor: "#FFFFFF"
    rounded: "{rounded.button}"
    height: "104rpx"
    padding: "0 32rpx"
  button-secondary:
    backgroundColor: "{colors.paper-surface}"
    textColor: "{colors.forest-action}"
    rounded: "{rounded.button}"
    height: "104rpx"
    padding: "0 32rpx"
  input:
    backgroundColor: "{colors.paper-surface}"
    textColor: "{colors.ink-primary}"
    rounded: "{rounded.control}"
    height: "96rpx"
    padding: "0 24rpx"
  solution-card:
    backgroundColor: "{colors.paper-surface}"
    textColor: "{colors.ink-primary}"
    rounded: "{rounded.surface}"
    padding: "28rpx"
---

# Design System: 门窗效果预览小程序

## Overview

**Creative North Star: "住宅材料样板册"**

界面把住宅摄影当作第一视觉层，把操作界面处理成一册冷静、可信的建筑材料样本。冷白纸面、深绿操作色、深色文字和少量陶土橙标线共同建立正式感；控件使用类似 Apple 的连续圆角和轻微按压反馈，但保留微信小程序的导航、表单和触控习惯。

系统服务于“上传照片、框选门窗、选择方案、查看效果、预约量尺”的连续任务。页面不靠卡片堆叠制造层级，而是用大图、细分隔线、留白和清楚的标题尺寸组织信息。

**Key Characteristics:**

- 真实住宅图像优先，界面退居为精确的说明与操作层。
- 冷白纸面与深绿操作色贯穿全流程，陶土橙只用于少量导览标记。
- 控件圆润但不胶囊化；重复实体卡片保持克制的小圆角。
- 所有文案明确区分演示效果、真实 AI 能力与最终上门量尺结果。

## Colors

调色以冷白纸面和低饱和森林绿为主，正式、住宅化，不使用高饱和互联网渐变。

### Primary

- **深林操作绿：** 仅用于主要操作、选中态、进度与关键状态，形成稳定的行动锚点。
- **次级建筑绿：** 用于需要更柔和的深色区域或辅助状态，不与主按钮争夺注意力。

### Tertiary

- **陶土标记橙：** 用于短标线、序号和少量导览点，不作为大面积按钮底色。
- **低饱和错误红：** 只表达错误、失败或危险操作。

### Neutral

- **冷白纸面：** 页面主背景。
- **洁白纸张：** 输入框、按钮和重复实体卡片的承载面。
- **样本灰纸：** 信任说明、分段选择器和骨架状态。
- **墨黑绿：** 主标题和正文的最高层级。
- **中性分隔线：** 章节、列表和材料选项之间的结构线。

**The One Action Color Rule.** 同一屏幕中深绿只集中在主操作和当前选中状态，避免每个图标、标签和标题都染成品牌色。

## Typography

**Display Font:** 系统中文无衬线字体栈
**Body Font:** 系统中文无衬线字体栈

**Character:** 使用微信和移动系统可稳定渲染的中文字体，通过字号、粗细、行距和留白建立建筑杂志式层级，不依赖远程字体或人为字距。

### Hierarchy

- **Display**（700，56rpx，1.4）：首页叠加在住宅墙面安全区的三行主标题。
- **Headline**（700，50rpx，1.2）：任务页面的两行标题。
- **Title**（700，34rpx，1.25）：章节标题、方案名称和结果标题。
- **Body**（400，26rpx，1.6）：说明、表单帮助和预期管理文案。
- **Label**（600，22rpx，1.45）：步骤、筛选、状态、按钮辅助文字和小型说明。

**The Zero Tracking Rule.** 中文界面不通过加大字距制造“高级感”，所有层级保持零字距。

## Layout

使用单列纵向滚动与 Flexbox。页面左右基础内边距为 32rpx，标题、说明、图片与操作按 8rpx 倍数形成节奏。首页允许住宅图全宽铺开；列表、表单和配置页回到稳定的内容边界。固定底部操作区必须叠加 `env(safe-area-inset-bottom)`，主要触控目标不小于 88rpx，标准按钮高度为 104rpx。

全流程优先让用户一次只做一个决策：横向滚动承载筛选条件，纵向列表承载方案实体，双列仅用于少量材料选项。不要使用 CSS Grid；小程序页面采用 Flexbox 和明确宽度完成响应布局。

## Elevation & Depth

系统默认扁平，通过纸面色阶、细边线和图像裁切表现层次。阴影不是常驻装饰，只在首页悬浮主操作、选中方案或对比滑块等需要强调可触控性的地方使用低透明度环境阴影。

**The Flat by Default Rule.** 静止内容不浮起；只有状态和交互需要时才出现柔和阴影。

## Shapes

主要按钮使用 28rpx 连续圆角，输入、筛选、分段控件和说明面板使用 24rpx，重复实体卡片和图片裁切使用 16rpx。圆形仅用于颜色样本、状态点、对比拖动手柄和确有语义的成功标记。短标签使用 14rpx 圆角，不使用无边界的超长胶囊形。

## Components

### Buttons

- **Shape:** 104rpx 高、28rpx 连续圆角，主按钮深绿实底，次按钮洁白纸面配中性细边线。
- **Pressed:** 160ms 内缩放到 0.985 并降低少量透明度；只动画 `transform` 和 `opacity`。
- **Disabled:** 保留原有结构，整体透明度降至 0.42，不额外引入新的禁用颜色。

### Chips

- **Style:** 最小高度 88rpx、24rpx 圆角；未选中为洁白纸面和中性描边。
- **State:** 选中后使用深绿实底和白字，同时通过字重变化表达状态，不能只依赖颜色。

### Cards / Containers

- **Corner Style:** 16rpx，仅用于方案等重复实体。
- **Background:** 洁白纸张承载图片和内容，默认使用细边线而非阴影。
- **Content:** 图片是卡片第一层，名称与说明第二层，特征和材料色板在细分隔线后出现。

### Inputs / Fields

- **Style:** 最小高度 96rpx、24rpx 圆角、洁白纸面和 1rpx 中性描边。
- **Focus:** 描边切换为深绿；错误文案使用低饱和红，不能隐藏或静默吞掉校验失败。
- **Textarea:** 保持同一圆角语言，顶部内边距 22rpx，正文行高 1.55。

### Navigation

首页使用自定义顶栏策略，让住宅主图直接延伸到系统安全区下方，不再额外放置页面标题块。底部采用微信 `custom-tab-bar`：左右留白、46rpx 大圆角、半透明米纸色背景、柔和环境阴影和选中项白色内层高亮；支持 `backdrop-filter` 的设备使用轻度背景模糊，不支持时保留半透明纯色降级。图标轮廓和占位尺寸在选中前后保持一致，方案页与我的页预留悬浮导航安全距离。

### Home Hero

- 首页使用 `assets/generated/home-hero-before.jpg` 与 `assets/generated/home-hero-mobile.jpg` 组成同机位前后对比，容器保持 `760rpx` 高并统一使用 `aspectFill`。
- 改造前图覆盖在改造后图上方，通过裁切宽度和垂直分隔线形成可拖动对比；初始位置偏左，首次进入只做一次轻量往返提示，不循环播放。
- 大图只显示“改造前 / 改造后”状态标签和 88rpx 圆形拖动手柄，不显示页面标题、`AI PREVIEW` 标签或装饰性取景框。
- 主标题与演示边界移到图片下方，避免文字遮挡门窗差异；标题使用系统可用中文衬线字体栈，正文使用系统无衬线字体栈。
- 主操作位于图片下方，使用图片图标与“用我家照片预览”的任务文案，不把 `AI` 当作按钮动作；样例入口降级为轻量文字按钮。
- 主操作下方使用“三步完成门窗预览”流程带说明预览路径；需求入口采用 2 × 2 可读控制项，使用 `assets/icons/needs/` 中统一 48px 画布、1.8px 圆角线条的 SVG 源稿，小程序运行时加载对应 `@3x PNG`，保持浅绿、浅陶土、浅金与灰绿的低饱和圆形底色。

### Before/After Comparison

前后图必须来自同一场景和机位。拖动手柄直径为 88rpx，白色分隔线贯穿图片；前后标签保持小型圆角矩形，不能把控制器烘焙进图片。

### Profile Archive

- “我的”页是本机方案档案，不使用虚构头像、会员等级或用户身份信息；顶部直接说明记录用途和本地体验边界。
- 效果、收藏和预约数量合并为一个可切换的分段概览，不再额外重复一组页签；选中态同时使用纸面、字重和颜色表达。
- 三类空状态分别解释下一步并提供对应入口；已有记录使用图片、方案名称和状态组成易扫读列表，不制造无法恢复的详情入口。
- 隐私与数据管理放在内容末尾，明确住宅照片不上传、演示记录仅存本机，并把清除操作保持为低权重危险动作。

## Do's and Don'ts

### Do:

- **Do** 让住宅照片先说明产品，再让界面解释下一步操作。
- **Do** 保持主操作、输入框、筛选和底部操作区的统一圆角与按压反馈。
- **Do** 用分隔线、留白和纸面色阶组织内容，保证 88rpx 以上触控目标和安全区留白。
- **Do** 始终显示“演示效果仅供沟通参考”和“最终以上门量尺为准”的边界。

### Don't:

- **Don't** 重新使用旧截图、从设计参考稿裁图或把生成素材表述为真实客户案例。
- **Don't** 使用卡片套卡片、粗侧边提示条、渐变、玻璃拟态或大面积高饱和色。
- **Don't** 使用 CSS Grid、远程 Web 字体、过小字号和小于 88rpx 的主要触控区域。
- **Don't** 为装饰添加无业务含义的 eyebrow/kicker、小胶囊标签或编造的经营数据。

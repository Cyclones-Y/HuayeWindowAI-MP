---
name: 门窗效果预览小程序
description: 住宅建筑杂志与材料样板册气质的微信小程序设计系统
colors:
  forest-action: "#244233"
  forest-secondary: "#375345"
  paper-ground: "#F8F5F0"
  paper-surface: "#FFFEFA"
  paper-muted: "#EFEBE3"
  paper-tint: "#E8E5DC"
  ink-primary: "#262C23"
  ink-secondary: "#5A615A"
  line-neutral: "#D8D5CE"
  clay-accent: "#C07048"
  error-muted: "#A6433B"
  stage-dark: "#1F2521"
  stage-accent: "#B7D7C0"
typography:
  display:
    fontFamily: '"Songti SC", STSong, "Noto Serif CJK SC", "Source Han Serif SC", serif'
    fontSize: "56rpx"
    fontWeight: 700
    lineHeight: 1.3
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
- 所有文案以正式服务口吻书写，只保留“效果图仅供参考、最终以上门量尺为准”这一层边界说明。

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

**Display Font:** 系统中文衬线字体栈（仅首页主标题与首页章节标题）
**Body Font:** 系统中文无衬线字体栈

**Character:** 使用微信和移动系统可稳定渲染的中文字体，通过字号、粗细、行距和留白建立建筑杂志式层级，不依赖远程字体或人为字距。衬线只出现在首页这一处杂志式展示时刻；iOS 上渲染为宋体，安卓缺少中文衬线时自然退回无衬线粗体，两端都成立。任务页、列表和表单全部使用无衬线。

### Hierarchy

- **Display**（700，56rpx，1.3，衬线）：首页图片下方的主标题；`.t-display`。
- **Headline**（700，50rpx，1.2）：任务页面的两行标题；`.page-title`。
- **Title**（700，34rpx，1.25）：章节标题、方案名称和结果标题；`.t-title`。
- **Subtitle**（700，28rpx，1.4）：列表行标题、选项组标题；`.t-subtitle`。
- **Body**（400，26rpx，1.6）：说明、表单帮助和预期管理文案；`.t-body`。
- **Label**（600，22rpx，1.45）：步骤、筛选、状态、按钮辅助文字；`.t-label`。
- **Caption**（400，22rpx，1.5）：次要说明；`.t-caption`。

**The Seven Sizes Rule.** 全项目只使用 22 / 24 / 26 / 28 / 34 / 50 / 56rpx 七档字号和 400 / 600 / 700 三档字重。安卓微信对 650、720 这类非标准字重会随机落到 400 或 700，任何中间值都不允许出现。

**The Zero Tracking Rule.** 中文界面不通过加大字距制造“高级感”，所有层级保持零字距。

## Layout

使用单列纵向滚动与 Flexbox。页面左右基础内边距为 32rpx，标题、说明、图片与操作按 8rpx 倍数形成节奏。首页允许住宅图全宽铺开；列表、表单和配置页回到稳定的内容边界。固定底部操作区必须叠加 `env(safe-area-inset-bottom)`，主要触控目标不小于 88rpx，标准按钮高度为 104rpx。

全流程优先让用户一次只做一个决策：横向滚动承载筛选条件，纵向列表承载方案实体，双列仅用于少量材料选项。不要使用 CSS Grid；小程序页面采用 Flexbox 和明确宽度完成响应布局。

**The 1px Hairline Rule.** 分隔线与描边一律写 `1px`，不写 `1rpx`。1rpx 在二倍屏折算不足半个物理像素，部分安卓机型会直接不渲染，整页的结构线就会消失。

所有颜色、字体栈与缓动曲线以 CSS 变量的形式定义在 `app.wxss` 的 `page {}` 中（`--paper-ground`、`--green`、`--stage` 等），页面样式只引用变量，不再散落十六进制色值。页面底色最多三层：冷白纸面为地，样本灰纸作为唯一的横向色带，洁白纸张承接需要收口的说明区。

## Elevation & Depth

系统默认扁平，通过纸面色阶、细边线和图像裁切表现层次。阴影不是常驻装饰，只在首页悬浮主操作、选中方案或对比滑块等需要强调可触控性的地方使用低透明度环境阴影。

**The Flat by Default Rule.** 静止内容不浮起；只有状态和交互需要时才出现柔和阴影。

## Shapes

主要按钮使用 28rpx 连续圆角，输入、筛选、分段控件和说明面板使用 24rpx，重复实体卡片和图片裁切使用 16rpx。圆形仅用于颜色样本、状态点、对比拖动手柄和确有语义的成功标记。短标签使用 14rpx 圆角，不使用无边界的超长胶囊形。

## Components

### Buttons

- **Shape:** 104rpx 高、28rpx 连续圆角，主按钮深绿实底，次按钮洁白纸面配中性细边线。
- **Width:** 新版基础库给 `button` 注入了默认宽度，class 里的 `width` 压不过它，必须同时写 `min-width`（撑满用 `min-width: 100%`，定宽用 `min-width` 与 `max-width` 同值）；`.action-bar button` 这类 Flex 子项写 `min-width: 0` 并用 `flex` 分配宽度。
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

- **Style:** 最小高度 96rpx、24rpx 圆角、洁白纸面和 1px 中性描边；占位文字通过 `placeholder-class="form-placeholder"` 使用可读的中性墨色。
- **Focus:** 描边切换为深绿；校验失败时字段加 `form-field--error`，描边与错误文案同时使用低饱和红，不能隐藏或静默吞掉校验失败。
- **Textarea:** 保持同一圆角语言，顶部内边距 22rpx，正文行高 1.55。

### Navigation

首页使用自定义顶栏策略，让住宅主图直接延伸到系统安全区下方，不再额外放置页面标题块；叠在图上的状态标签用 `wx.getMenuButtonBoundingClientRect()` 的底边定位，避开右上角胶囊。底部采用微信 `custom-tab-bar`：左右留白 24rpx、36rpx 圆角、接近不透明的洁白纸张、1px 中性描边和一层带偏移的柔和环境阴影；选中项使用浅绿纸面加深绿文字，同时改变字重。不使用背景模糊、内高光或半透明玻璃效果。图标轮廓和占位尺寸在选中前后保持一致，方案页与我的页预留悬浮导航安全距离。

框选页与生成页在页面 `json` 中把导航栏设为 `#1F2521` 白字，让系统导航和暗房舞台连成一体，不出现浅色导航压在深色页面上的接缝。

### Home Hero

- 首页使用 `assets/generated/home-hero-before.jpg` 与 `assets/generated/home-hero-mobile.jpg` 组成同机位前后对比，容器保持 `760rpx` 高并统一使用 `aspectFill`。
- 改造前图覆盖在改造后图上方，通过裁切宽度和垂直分隔线形成可拖动对比；初始位置偏左，首次进入只做一次轻量往返提示，不循环播放。
- 大图只显示“改造前 / 改造后”状态标签和 88rpx 圆形拖动手柄，不显示页面标题、`AI PREVIEW` 标签或装饰性取景框。
- 主标题与演示边界移到图片下方，避免文字遮挡门窗差异；标题使用系统可用中文衬线字体栈，正文使用系统无衬线字体栈。
- 主操作位于图片下方，使用图片图标与“用我家照片预览”的任务文案，不把 `AI` 当作按钮动作；样例入口降级为轻量文字按钮。
- 主操作下方是一条上下细线框住的四步流程条（上传照片、框选门窗、选择方案、对比效果），序号用陶土橙，说明预览路径后不再重复解释“下一步”；需求入口采用 2 × 2 可读控制项，使用 `assets/icons/needs/` 中统一 48px 画布、1.8px 圆角线条的 SVG 源稿，小程序运行时加载对应 `@3x PNG`，保持浅绿、浅陶土、浅金与灰绿的低饱和圆形底色。
- 首页只有三个底色层：冷白纸面承载英雄区、主操作、流程条和需求入口；样本灰纸只出现一次，承载横向滚动的精选方案；“为什么不是随便生成”与页脚边界一起落在洁白纸张上收口。

### Before/After Comparison

前后图必须来自同一场景和机位。标签、分隔线与手柄的样式统一定义在 `app.wxss`（`.compare-label`、`.compare-divider`、`.compare-handle`），首页和结果页共用：拖动手柄直径 88rpx、洁白纸面圆形、墨色双向箭头，白色分隔线贯穿图片；前后标签保持小型圆角矩形，不能把控制器烘焙进图片。结果页整体是纵向 Flex，深色预约带用 `margin-top: auto` 贴住底部，安全区由预约带自身内边距承接，页面不再额外留底部空白。

### Dark Room（暗房）

框选门窗、生成效果两页共用 `--stage`（#1F2521）深色工作台：用户照片是唯一的亮部，选框用 `--stage-accent` 浅绿描边，框外用半透明遮罩压暗。生成页不再展示方案效果图替代用户照片，而是在用户自己的照片上标出框选区域，扫描线只在框内往返，左下角以小缩略图注明“替换为 × 方案名”。结果页回到冷白纸面，形成“进暗房、冲洗、亮起来”的节奏。暗房内的主按钮使用浅绿纸面配深绿文字，次按钮使用 `--stage-2`。

确认页在浅色纸面上复用同一套“照片 + 选框”舞台（`utils/selection-overlay.ts` 负责把归一化选框换算到 `aspectFit` 容器内），让用户在生成前再确认一次将替换的位置。

### Icons

- 界面线性图标以内联 SVG data URI 的形式定义在 `app.wxss` 的 `.ic--*` 类中：24 网格、1.8 描边、圆角端点，与 `assets/icons/needs/` 的源稿同一套笔触。默认墨绿 `#375345`，`.ic--white` 用于深色底与主按钮，尺寸 `.ic--sm` 40rpx、默认 48rpx、`.ic--lg` 72rpx。
- 不再用 CSS 伪元素和旋转边框拼画图标；安卓上这类手绘在缩放后会糊边或错位。只有箭头 chevron 允许用两条边框旋转实现。
- 需求入口与底部导航继续使用既有 PNG 资源。

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
- **Do** 始终显示“效果图仅供沟通参考”和“最终以上门量尺为准”的边界；界面按正式上线产品书写，不出现“演示 / 体验版 / 测试 / 本机”字样。

### Don't:

- **Don't** 重新使用旧截图、从设计参考稿裁图或把生成素材表述为真实客户案例。
- **Don't** 使用卡片套卡片、粗侧边提示条、渐变、玻璃拟态或大面积高饱和色。
- **Don't** 使用 CSS Grid、远程 Web 字体、过小字号和小于 88rpx 的主要触控区域。
- **Don't** 为装饰添加无业务含义的 eyebrow/kicker、小胶囊标签或编造的经营数据。
- **Don't** 使用 1rpx 细线、七档以外的字号、400/600/700 以外的字重，或在任务页使用衬线字体。
- **Don't** 在同一页面堆叠三种以上底色，或让浅色系统导航栏压在暗房页面上。

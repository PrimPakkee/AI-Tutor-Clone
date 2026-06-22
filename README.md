# AI Tutor — SAT 数学演示课

基于 Next.js 构建的 AI 辅导产品，包含数字人讲师、预录讲解内容和实时 RTC 互动。

## 产品功能

三栏布局：
- **左侧 70%** — 幻灯片面板，支持 KaTeX 公式、交互式可视化、动画图表、课件联动和手写体注释
- **右上 15%** — 数字人讲师（预录视频 + 直播 AIGC 流）
- **右下 15%** — 学生摄像头，含麦克风/摄像头/音量控制和互动时长倒计时

课程由 JSON 时间轴驱动。预录片段自动播放；到达配置的触发点时，讲师头像切换为 OmniRTC + AIGC `avatarchat` 实时对话模式。

**播放起点：** 所有音视频均在用户点击 **Start Lesson** 后才开始，开播前不加载任何媒体，符合浏览器自动播放策略。

**计时原理：** 视频的 `currentTime` + 当前片段的 `startTime` = 课程绝对时间，状态机用此值判断何时切换片段、何时触发直播。所有直播触发点均位于录播段边界处，视频不会中途暂停。

### 课件增强功能

以下三项功能均通过 JSON 时间轴的 `at`（绝对秒数）字段配置，与数字人讲解内容精准同步：

**① 圈重点（highlights）**
幻灯片内容按时间点高亮，呈现金色光晕动画，与数字人讲解同步触发。在 segment 的 `slide.highlights` 数组中配置 `{ text, at }`。

**② 联动动图（scene events）**
数字人讲到特定内容时，幻灯片中的交互可视化组件自动联动——抛物线滑块移动、判别式 c 值变化、公式参数高亮。在 `slide.scene` 数组中配置 `{ at, state: { ... } }`，state 键与各组件的 prop 对应。用户仍可手动操作滑块。

**③ 手写体注释（annotations）**
在幻灯片上叠加手写风格文字（Caveat 字体），按时间点从左到右写入。支持位置（x/y 百分比）、颜色、大小、旋转角度配置。在 `slide.annotations` 数组中配置。

---

## 快速上手

```bash
npm install
cp .env.local.example .env.local   # 填写 OMNIRTC_TOKEN
npm run dev
```

打开 [http://localhost:3000/lesson/sat-math-quadratic-01](http://localhost:3000/lesson/sat-math-quadratic-01)。

**开发调试快捷键**（开发模式下左下角）：
- `DEV: Jump to Live` — 跳转至第一个直播触发点
- `DEV: End Live` — 立即退出直播模式

---

## 环境变量

| 变量 | 是否必填 | 说明 |
|------|----------|------|
| `OMNIRTC_TOKEN` | 直播模式必填 | OmniRTC 预签发 core token（type 7），从 OmniRTC 控制台获取 |
| `ANTHROPIC_API_KEY` | 仅内容生成时 | `generate-lesson.mjs` 通过 Claude API 生成课程 JSON 时使用 |

---

## 页面路由

| 路由 | 说明 |
|------|------|
| `/lesson/[lessonId]` | 完整课程播放页 |
| `/slides` | 独立幻灯片查看器（带自动旁白） |
| `/api/rtc/token` | GET — 从环境变量返回 `{ token }` |

---

## 项目结构

```
app/
  lesson/[lessonId]/        课程播放页
  slides/                   独立幻灯片查看器
  api/rtc/token/            RTC Token 接口

components/LessonPlayer/
  index.tsx                 根组件，串联所有面板；ResizeObserver 计算 4:3 卡片尺寸
  SlidePanel.tsx            幻灯片渲染（封面 / 概念课 / 练习题 / 解析 / 总结）；含幻灯片切换动画、高亮、联动、手写体注释
  AvatarPanel.tsx           讲师视频（预录 + OmniRTC 直播流）；双 video 槽 ping-pong 交叉淡入，段间切换无静态图闪烁
  StudentPanel.tsx          学生摄像头、控件、互动时长倒计时
  LiveControls.tsx          直播覆盖层（倒计时、结束按钮、文字输入）
  TopBar.tsx
  ParabolaGraph.tsx         SVG 抛物线，支持顶点/对称轴高亮
  AnnotatedParabola.tsx     抛物线解剖图（顶点/对称轴/y截距/零点标注），focus prop 驱动高亮/淡出；axisLabel prop 支持自定义对称轴标注
  QuadraticIntroSlide.tsx   "What is a Quadratic Function?" 双栏幻灯片，消费 AnnotatedParabola
  StandardFormSlide.tsx     "Standard Form" 双栏幻灯片：左侧 a/b/c 系数卡片 + SAT 提示；右侧 AnnotatedParabola；sceneState.focus('a'|'b'|'c') 驱动高亮
  InteractiveParabola.tsx   滑块驱动的顶点式探索器；支持 sceneState 联动
  DiscriminantViz.tsx       判别式滑块可视化；支持 sceneState 联动
  CompletingSquare.tsx      配方法四步动画演示

lib/
  use-timeline.ts           时间轴状态机（STREAMING / LIVE_INSTRUCTOR / LIVE_STUDENT）；计算 activeHighlights / activeScene / activeAnnotations
  use-live-session.ts       OmniRTC 生命周期：加入、发布、AIGC、清理
  use-tts-session.ts        /slides 页专用 TTS 会话（AIGC voicechat，不发布本地流）
  quota.ts                  直播互动时长配额追踪
  types.ts                  共享 TypeScript 类型定义（含 Highlight / SceneEvent / Annotation）

data/lessons/
  sat-math-quadratic-01.json    课程内容、片段、旁白脚本

public/content/
  seg-xx[a|b].txt           录播脚本（每个录播片段一份，共 17 个）
  seg-xx[a|b].webm           数字人视频（通过下方流程生成）
  timeline.md               完整课程时间轴及互动设计说明

scripts/
  generate-lesson.mjs       通过 Claude API 从主题生成课程 JSON 草稿
  generate-avatar.mjs       批量生成数字人视频的脚本（当前为存根）
```

---

## 课程 JSON 格式

```jsonc
{
  "lessonId": "sat-math-quadratic-01",
  "title": "...",
  "totalDuration": 2700,
  "maxLiveSeconds": 900,        // 全课互动配额上限（秒）
  "slides": [ ... ],
  "segments": [
    {
      "id": "seg-01",
      "type": "stream",
      "startTime": 0,           // 相对课程起点的秒数
      "duration": 300,
      "avatarVideoUrl": "/content/seg-01.webm",
      "slide": {
        "index": 1,
        "highlights": [         // ① 圈重点：按绝对时间触发高亮
          { "text": "顶点式", "at": 12 }
        ],
        "scene": [              // ② 联动动图：按时间驱动组件状态
          { "at": 20, "state": { "h": 2, "k": -3, "aUp": true } }
        ],
        "annotations": [        // ③ 手写体注释：按时间叠加手写文字
          { "at": 35, "text": "记住这个！", "x": 60, "y": 40, "color": "#d97706", "rotate": -3 }
        ]
      }
    },
    {
      "id": "live-01",
      "type": "live",
      "mode": "instructor-initiated",
      "trigger": { "at": 780 }, // elapsed 达到此值时触发
      "timeout": 120,           // 本次直播最长时长（秒）
      "prompt": "...",          // 头像开场白/提问内容
      "slide": { "index": 3 }
    }
  ]
}
```

### 当前演示课互动计划

8 个直播节点，触发时间与实际 .webm 视频时长对齐（所有触发点在录播段边界处）：

| 触发时间 | 节点 | 类型 | 内容 | 配额 |
|----------|------|------|------|------|
| 1:27 (87s) | live-00 | ⚡ 概念 | 识别顶点式，读出顶点坐标 | 60s |
| 4:05 (245s) | live-01 | ⚡ 概念 | y 截距 + a 的方向判断 | 60s |
| 10:05 (605s) | live-02 | ⚡ 概念 | 顶点式速读：顶点 + 开口方向 | 60s |
| 17:05 (1025s) | live-03 | ⚡ 概念 | 对称轴 + 最值 | 60s |
| 23:05 (1385s) | live-04 | ⚡ 概念 | 判别式计算 + 根的个数 | 90s |
| 28:05 (1685s) | live-05 | 📝 题目 | Q1 独立解题：2(x+3)²−8 最小值 | 210s |
| 35:35 (2135s) | live-06 | 📝 题目 | Q3 独立解题：抛物线模型最大高度 | 210s |
| 42:05 (2525s) | live-07 | ⚡ 反思 | 收尾反思：一个收获，一个疑问 | 90s |

---

## 内容制作流程

```
文字脚本(.txt) → TTS 音频(.mp3) → 数字人工作台 → 视频(.webm) → public/content/
```

1. **文字脚本** — `public/content/seg-xx[a|b].txt`（英文，SAT 数学，面向 16–18 岁用户）共 **17 个**
2. **TTS 生成音频** — 将每个 `.txt` 转为同名 `.mp3`
3. **数字人视频** — 将音频上传至数字人供应商工作台，下载对应 `.webm`
4. **放置文件** — 将 `.webm` 放入 `public/content/`，文件名与 JSON 中 `avatarVideoUrl` 保持一致
5. **更新时间轴** — 用实际视频时长更新 JSON 中各段的 `duration`，确保直播触发点对齐段边界（floor 取整避免 `onEnded` elapsed 不足）
6. **验证** — `npm run dev` → 打开 `/lesson/sat-math-quadratic-01`，点击 **DEV: Jump to Live** 测试直播流程

详见 `public/content/timeline.md`，包含字数统计、预估时长和完整片段时间表。

> **分离原则：** 录播脚本（`.txt` 文件）只用于 TTS pipeline；直播引导脚本（`prompt` / `systemPrompt`）只存在于课程 JSON 的 live 段中，二者不混用。

---

## 直播互动（OmniRTC）

直播使用 OmniRTC Web SDK，结合 AIGC `avatarchat` 服务。

**数字人配置：**
- `avatarConfig: 78` — 腾讯·伴学营·外国女
- `ttsConfig: 42` — TTS 音色
- `llmConfig: 15` — DeepSeek-V3

**会话流程：**
1. 播放器在触发点进入 `LIVE_INSTRUCTOR` 状态
2. `use-live-session.ts` 从 `/api/rtc/token` 获取 token
3. 学生通过 OmniRTC 发布麦克风和摄像头
4. AIGC 服务将实时 AI 头像视频流推送给学生（`user-published` 事件）
5. 头像朗读片段配置的 `prompt`（欢迎语），学生语音作答
6. 学生点击"说完了"发送语音，或达到 `timeout` 自动结束会话

**Token 说明：** 当前使用单一预签发 `OMNIRTC_TOKEN`。生产环境请将 `app/api/rtc/token/route.ts` 替换为逐会话服务端签发逻辑。

---

## 学生控件说明

| 控件 | 录播模式 | 直播模式 |
|------|----------|----------|
| ✋ 举手发言 | ✓（配额未耗尽时可用） | 不可用 |
| 🎤 麦克风 | 仅 UI 状态 | 静音 OmniRTC 音频轨道 |
| 📷 摄像头 | 禁用 getUserMedia 轨道 + 显示关闭遮罩 | 静音 OmniRTC 视频轨道 |
| 🔊 音量 | 静音讲师视频音频 | 静音讲师视频音频 |

剩余互动配额实时显示在学生面板底部，颜色随时长变化：绿色 → 橙色 → 红色 → "互动已用完"。

---

## 幻灯片变体

| `content.variant` | 组件 | 说明 |
|-------------------|------|------|
| `cover` | `CoverSlide` | 深色渐变背景、SVG 抛物线动画、课程目标列表 |
| `quadratic-intro` | `QuadraticIntroSlide` | 双栏布局：左侧标准式/顶点式公式卡片 + 关键事实行 + SAT 策略提示；右侧带标注的 SVG 抛物线解剖图；`sceneState.focus` 驱动分区高亮 |
| `standard-form` | `StandardFormSlide` | 双栏布局：左侧 a/b/c 三张系数卡片 + SAT 策略提示；右侧 `AnnotatedParabola`；`sceneState.focus('a'\|'b'\|'c')` 驱动对应卡片 + 图示高亮 |
| `vertex-explorer` | `InteractiveParabola` | h / k / a 三个滑块，实时更新图像 |
| `formula-highlight` | KaTeX + `ParabolaGraph` | 点击公式中的参数高亮对应图像元素 |
| `discriminant` | `DiscriminantViz` | c 滑块动态展示零点出现/消失 |
| `completing-square` | `CompletingSquare` | 配方法四步自动推进演示 |
| *(不设置)* | Concept / Question / Solution / Summary | 根据幻灯片标题自动识别布局 |

---

## 开发命令

```bash
npm test            # Jest，50 个测试
npm run test:watch  # 监听模式
npx tsc --noEmit    # TypeScript 类型检查
npm run lint        # ESLint
npm run build       # 生产构建
```

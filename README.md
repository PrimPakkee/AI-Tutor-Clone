# AI Tutor — SAT 数学演示课

基于 Next.js 构建的 AI 辅导产品，包含数字人讲师、预录讲解内容和实时 RTC 互动。

## 产品功能

三栏布局：
- **左侧 70%** — 幻灯片面板，支持 KaTeX 公式、交互式可视化和动画图表
- **右上 15%** — 数字人讲师（预录视频 + 直播 AIGC 流）
- **右下 15%** — 学生摄像头，含麦克风/摄像头/音量控制和互动时长倒计时

课程由 JSON 时间轴驱动。预录片段自动播放；到达配置的触发点时，讲师头像切换为 OmniRTC + AIGC `avatarchat` 实时对话模式。

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
  index.tsx                 根组件，串联所有面板
  SlidePanel.tsx            幻灯片渲染（概念课 / 练习题 / 解析 / 封面）
  AvatarPanel.tsx           讲师视频（预录 + OmniRTC 直播流）
  StudentPanel.tsx          学生摄像头、控件、互动时长倒计时
  LiveControls.tsx          直播覆盖层（倒计时、结束按钮、文字输入）
  TopBar.tsx
  ParabolaGraph.tsx         SVG 抛物线，支持顶点/对称轴高亮
  InteractiveParabola.tsx   滑块驱动的顶点式探索器
  DiscriminantViz.tsx       判别式滑块可视化
  CompletingSquare.tsx      配方法四步动画演示

lib/
  use-timeline.ts           时间轴状态机（STREAMING / LIVE_INSTRUCTOR / LIVE_STUDENT）
  use-live-session.ts       OmniRTC 生命周期：加入、发布、AIGC、清理
  quota.ts                  直播互动时长配额追踪
  types.ts                  共享 TypeScript 类型定义

data/lessons/
  sat-math-quadratic-01.json    课程内容、片段、旁白脚本

public/content/
  seg-xx.txt                旁白文字稿（每个 stream 片段一份）
  seg-xx.mp4                数字人视频（通过下方流程生成）
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
      "avatarVideoUrl": "/content/seg-01.mp4",
      "slide": { "index": 1, "highlights": [] },
      "script": "..."           // 旁白文字稿
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

4 个直播节点，间隔约 10–11 分钟，合计 15 分钟配额：

| 触发时间 | 任务设计 | 配额 |
|----------|----------|------|
| 13:00 | 即时计算：对称轴公式快测（有标准答案） | 2 min |
| 24:00 | 速读顶点式：快速报顶点坐标 | 3 min |
| 35:00 | 独立解题：学生在解析播放前自己解 Q2 | 4 min |
| 45:00 | 开放答疑 + 课后反思 | 6 min |

---

## 内容制作流程

```
文字脚本 → TTS 音频 → 数字人工作台 → .mp4 → public/content/
```

1. **文字脚本** — `public/content/seg-xx.txt`（英文，SAT 数学，面向 16–18 岁用户）
2. **TTS 生成音频** — 将每个 `.txt` 转为 `seg-xx.mp3`
3. **数字人视频** — 将音频上传至数字人供应商工作台，下载 `seg-xx.mp4`
4. **放置文件** — 将 `.mp4` 放入 `public/content/`
5. **验证** — `npm run dev` → 打开 `/lesson/sat-math-quadratic-01`

详见 `public/content/timeline.md`，包含字数统计、预估音频时长和完整片段时间表。

---

## 直播互动（OmniRTC）

直播使用 OmniRTC Web SDK，结合 AIGC `avatarchat` 服务。

**会话流程：**
1. 播放器在触发点进入 `LIVE_INSTRUCTOR` 状态
2. `use-live-session.ts` 从 `/api/rtc/token` 获取 token
3. 学生通过 OmniRTC 发布麦克风和摄像头
4. AIGC 服务将实时 AI 头像视频流推送给学生
5. 头像朗读片段配置的 `prompt`，学生语音作答
6. 学生点击"结束回答"或达到 `timeout` 后会话结束

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
| `vertex-explorer` | `InteractiveParabola` | h / k / a 三个滑块，实时更新图像 |
| `formula-highlight` | KaTeX + `ParabolaGraph` | 点击公式中的参数高亮对应图像元素 |
| `discriminant` | `DiscriminantViz` | c 滑块动态展示零点出现/消失 |
| `completing-square` | `CompletingSquare` | 配方法四步自动推进演示 |
| *(不设置)* | Concept / Question / Solution / Summary | 根据幻灯片标题自动识别布局 |

---

## 开发命令

```bash
npm test            # Jest，23 个测试
npm run test:watch  # 监听模式
npx tsc --noEmit    # TypeScript 类型检查
npm run lint        # ESLint
npm run build       # 生产构建
```

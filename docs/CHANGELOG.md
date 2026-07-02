# Changelog

---

## v0.2.0 — 2026-07-02

### 新增功能

#### AI 问答系统（课堂互动）
- 新增 `lib/use-tutor-qa.ts`：完整的问答状态机（idle → recording → thinking → speaking）
- 新增 `/app/api/asr/`：本地 mlx-whisper ASR 语音转文字接口（Apple Silicon）
- 新增 `/app/api/tts/`：edge-tts 文字转语音接口（en-US-JennyNeural）
- 新增 `/app/api/tutor/`：GPT-5.5 AI 家教接口，Ms. Emily 角色，支持 judge / answer 两种模式
- 新增 `components/LessonPlayer/RecordingBar.tsx`：录音 UI，含实时波形可视化（28根动态柱）
- 新增 `components/LessonPlayer/TutorSubtitle.tsx`：TTS 播放时显示的字幕条

#### 做题系统
- 新增 `components/LessonPlayer/QuestionSlide.tsx`：SAT 做题幻灯片，隐藏倒计时，预加载 TTS 音频反馈
- 新增 `components/LessonPlayer/SolutionModal.tsx`：解题步骤弹窗，KaTeX 公式 + 分步时间线
- 新增 `components/LessonPlayer/quiz-utils.tsx`：做题辅助工具函数

#### 新课程内容
- 新增 `data/lessons/sat-linear-word-equations-01.json`：线性方程应用题课程（多/少关系建方程）
- 新增 `public/content/lwe-01.mp3` ~ `lwe-11.mp3`：配套课程音频
- 新增 `public/content/maya-savings.png`：课程配图

#### 脚本工具
- 新增 `scripts/generate-narration.mjs`：批量生成课程旁白音频
- 新增 `scripts/generate-image.mjs`：课程配图生成脚本
- 新增 `scripts/transcribe.py`：本地 mlx-whisper 转录脚本

---

### 功能改进

#### 数字人视频（AvatarPanel）
- 实现 ping-pong 双槽位无缝切换：两个 `<video>` 元素交替预加载，消除片段切换时的黑帧闪烁
- 修复片段切换时音频重叠问题（切换前暂停输出视频）

#### 课堂播放器（LessonPlayer index）
- 接入 AI 问答系统：老师提问 → 学生录音 → ASR → GPT 判题 → TTS 语音反馈
- 接入举手功能：学生举手 → 录音 → ASR → GPT 回答 → TTS 播放
- 新增做题暂停流程：遇到 quiz 幻灯片自动暂停，答题完成后续讲
- 新增全局进度条 scrubber 拖拽跳转
- 新增开始界面 overlay，点击后才开始播放

#### 幻灯片路由（SlidePanel）
- 重构幻灯片分发逻辑，支持更多 variant 类型
- 新增 QuestionSlide 路由支持

#### 学生面板（StudentPanel）
- 新增摄像头开关、麦克风静音控制
- 新增配额倒计时（绿/橙/红三色预警）
- 新增摄像头关闭遮罩

#### TopBar
- 新增实时时钟（中文星期格式）
- 新增 LIVE 徽标 + 红点动画 + 观看人数

#### 类型系统（lib/types.ts）
- 新增 `InstructorLiveSegment`、`TeacherAsk`、`QuizFeedback`、`SolutionData` 等类型
- 完善 `Segment` 联合类型

#### 时间线 Hook（lib/use-timeline.ts）
- 新增 `TRIGGER_QUIZ` / `RESUME_FROM_QUIZ` action
- 新增 `PAUSED_FOR_QUIZ` 状态

---

### Bug 修复
- 修复数字人静态图片在视频片段切换时闪现的问题
- 修复 seg-02a/02b 场景事件时间与旁白脚本不对齐的问题
- 修复 OmniRTC 会话使用 mode:live + AIGC staging 环境配置
- 修复 StandardFormSlide 轴标签公式显示错误（x=-b/2a）

---

### 依赖变更
- 新增 `@anthropic-ai/sdk ^0.104.1`

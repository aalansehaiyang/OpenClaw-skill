# OpenClaw Skills

> 为 OpenClaw AI Agent 精心打造的一系列技能（Skills），覆盖内容创作、社交媒体发布、图像处理、知识管理等多个领域。

## 📦 技能列表

### 📝 内容创作与处理

| 技能 | 说明 |
|------|------|
| **baoyu-translate** | 多模式翻译（快速/标准/精翻），支持自定义术语库 |
| **baoyu-format-markdown** | 格式化 Markdown 文档，添加 frontmatter、标题、加粗、列表等 |
| **baoyu-url-to-markdown** | 将任意网页 URL 转换为 Markdown，支持登录态页面 |
| **web-content-download** | 网页内容下载为 Markdown（含图片），支持反爬（微信公众号、Cloudflare 等） |
| **zsxq-to-markdown** | 知识星球文章下载并转为 Markdown |
| **baoyu-danger-x-to-markdown** | X (Twitter) 推文和文章转为 Markdown |
| **summarize** | 总结 URL 或文件（网页、PDF、图片、音频、YouTube 等） |

### 🖼️ 图像生成与处理

| 技能 | 说明 |
|------|------|
| **ali-image** | 通义万相（Qwen Image）API 图像生成 |
| **baoyu-image-gen** | AI 图像生成（支持 OpenAI、Google、DashScope、Replicate） |
| **baoyu-danger-gemini-web** | Gemini Web API 逆向调用（图像+文本生成） |
| **nano-banana-pro** | Gemini 3 Pro 图像生成/编辑（1K/2K/4K） |
| **baoyu-compress-image** | 图片压缩（WebP/PNG 自动选择） |
| **baoyu-cover-image** | 文章封面图生成（5 维度：类型/色调/渲染/文字/氛围） |
| **baoyu-article-illustrator** | 文章配图：分析文章结构，自动在合适位置生成插图 |
| **baoyu-infographic** | 专业信息图生成（21 种布局 × 20 种风格） |
| **baoyu-xhs-images** | 小红书信息图系列（11 种视觉风格 × 8 种布局） |
| **baoyu-slide-deck** | 专业幻灯片图片生成（大纲 → 逐页生成） |
| **baoyu-comic** | 知识漫画创作（多艺术风格、分镜布局） |

### 📢 社交媒体发布

| 技能 | 说明 |
|------|------|
| **baoyu-post-to-wechat** | 微信公众号发布（文章/贴图），支持 Markdown/HTML 转微信格式 |
| **baoyu-post-to-x** | X (Twitter) 发布（推文/文章），Chrome CDP 防反爬 |
| **baoyu-post-to-weibo** | 微博发布（普通帖/头条文章） |
| **baoyu-markdown-to-html** | Markdown 转微信兼容 HTML（代码高亮、数学公式、PlantUML 等） |

### 🔍 搜索与信息查询

| 技能 | 说明 |
|------|------|
| **multi-search-engine** | 多引擎搜索集成（17 个引擎：8 国内 + 9 国际） |
| **tavily-search** | Tavily LLM 优化搜索 API |
| **agent-browser** | 基于 Rust 的无头浏览器自动化 CLI（导航、点击、输入、截图） |

### 🧠 知识管理与记忆

| 技能 | 说明 |
|------|------|
| **memory-manager** | 多 Agent 三层记忆系统管理（NOW.md / 每日日志 / MEMORY.md） |
| **ontology** | 知识图谱：结构化 Agent 记忆与可组合技能 |
| **self-improving** | 自我改进系统：记录偏好、工作流、风格模式、改进结果 |

### 🛠️ 工具与辅助

| 技能 | 说明 |
|------|------|
| **skill-vetter** | 技能安全审查（安装前检查风险、权限范围、可疑模式） |
| **claude-code-1.0.0** | Claude Code 集成 |
| **jmagar** | （待补充） |

### 💡 生活与效率

| 技能 | 说明 |
|------|------|
| **overcome-problem** | 结构化问题分析与行动计划 |
| **portfolio-watcher** | 股票/加密货币持仓监控与价格提醒 |
| **pregnancy-tracker** | 孕期追踪（每周更新、症状记录、里程碑倒计时） |
| **procrastination-buster** | 克服拖延（任务分解、2 分钟起步、问责追踪） |
| **thinking-partner** | 协作式思维伙伴（通过提问探索复杂问题） |

---

## 🚀 快速开始

### 安装技能

```bash
# 使用 clawhub 安装
clawhub install <skill-name>

# 或手动复制到 skills 目录
cp -r <skill-folder> ~/.openclaw/workspace/skills/
```

### 使用方式

在 OpenClaw 对话中，技能会根据触发词自动激活。例如：

- "下载这个网页" → `web-content-download`
- "发一篇公众号" → `baoyu-post-to-wechat`
- "生成一张图" → `baoyu-image-gen`
- "总结这篇文章" → `summarize`

---

## 📁 目录结构

```
OpenClaw-skill/
├── README.md                    # 本文件
├── agent-browser/               # 浏览器自动化
├── ali-image/                   # 通义万相图像生成
├── baoyu-article-illustrator/   # 文章配图
├── baoyu-comic/                 # 知识漫画
├── baoyu-compress-image/        # 图片压缩
├── baoyu-cover-image/           # 封面图生成
├── baoyu-danger-gemini-web/     # Gemini Web API
├── baoyu-danger-x-to-markdown/  # X 推文转 Markdown
├── baoyu-format-markdown/       # Markdown 格式化
├── baoyu-image-gen/             # AI 图像生成
├── baoyu-infographic/           # 信息图
├── baoyu-markdown-to-html/      # Markdown 转 HTML
├── baoyu-post-to-wechat/        # 微信公众号发布
├── baoyu-post-to-weibo/         # 微博发布
├── baoyu-post-to-x/             # X 发布
├── baoyu-slide-deck/            # 幻灯片生成
├── baoyu-translate/             # 翻译
├── baoyu-url-to-markdown/       # URL 转 Markdown
├── baoyu-xhs-images/            # 小红书图片
├── claude-code-1.0.0/           # Claude Code
├── jmagar/                      # （待补充）
├── memory-manager/              # 记忆管理
├── multi-search-engine/         # 多引擎搜索
├── nano-banana-pro/             # Gemini 3 Pro 图像
├── ontology/                    # 知识图谱
├── overcome-problem/            # 问题解决
├── portfolio-watcher/           # 持仓监控
├── pregnancy-tracker/           # 孕期追踪
├── procrastination-buster/      # 克服拖延
├── self-improving/              # 自我改进
├── skill-vetter/                # 技能审查
├── summarize/                   # 内容总结
├── tavily-search/               # Tavily 搜索
├── thinking-partner/            # 思维伙伴
├── web-content-download/        # 网页内容下载
└── zsxq-to-markdown/            # 知识星球下载
```

---

## 📝 技能开发

每个技能包含以下文件：

- `SKILL.md` — 技能描述、触发词、工作流程
- `EXTEND.md`（可选）— 扩展配置、术语表、自定义规则
- `scripts/`（可选）— 辅助脚本
- `references/`（可选）— 参考资料

---

## ⚠️ 注意事项

- 部分技能涉及第三方 API 逆向（标注为 `danger`），使用前请确认风险
- 社交媒体发布类技能需要登录态浏览器，请确保浏览器已登录对应平台
- 图像生成类技能可能需要 API Key 或额外配置

---

*最后更新: 2026-05-03*

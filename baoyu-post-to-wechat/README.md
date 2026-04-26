# baoyu-post-to-wechat 技能深度分析

## 一、核心功能概述

**baoyu-post-to-wechat** 是一个微信公众号文章发布工具，支持三种发布方式：

| 功能 | 脚本 | 适用场景 |
|------|------|----------|
| **贴图发表** (图文) | `wechat-browser.ts` | 短内容 + 多图（最多 9 张） |
| **文章发表** (API) | `wechat-api.ts` | 快速发布，需要 API 凭证 |
| **文章发表** (浏览器) | `wechat-article.ts` | 慢速，需要 Chrome 登录 |

---

## 二、目录结构

```
baoyu-post-to-wechat/
├── SKILL.md                          # 主技能说明
├── package.json                      # 包配置
├── references/                       # 参考文档
│   ├── config/
│   │   └── first-time-setup.md       # 首次设置流程
│   ├── article-posting.md            # 文章发表参考
│   └── image-text-posting.md         # 贴图发表参考
└── scripts/                          # 核心脚本
    ├── wechat-browser.ts             # 浏览器方式发布贴图
    ├── wechat-article.ts             # 浏览器方式发布文章
    ├── wechat-api.ts                 # API 方式发布文章
    ├── md-to-wechat.ts               # Markdown 转 HTML 带占位符
    ├── cdp.ts                        # Chrome DevTools Protocol 工具
    ├── check-permissions.ts          # 环境权限检查
    ├── copy-to-clipboard.ts          # 复制图片/HTML 到剪贴板
    ├── paste-from-clipboard.ts       # 发送粘贴 keystroke
    └── md/                           # Markdown 渲染引擎
        ├── render.ts                 # 渲染入口
        ├── renderer.ts               # 渲染器配置
        ├── themes.ts                 # 主题 CSS 加载
        ├── types.ts                  # 类型定义
        ├── constants.ts              # 常量定义
        ├── extend-config.ts          # 扩展配置加载
        ├── html-builder.ts           # HTML 构建
        ├── cli.ts                    # CLI 参数解析
        ├── themes/                   # 4 种主题 CSS
        │   ├── base.css              # 基础样式
        │   ├── default.css           # 经典主题
        │   ├── grace.css             # 优雅主题
        │   ├── simple.css            # 简洁主题
        │   └── modern.css            # 现代主题
        ├── code-themes/              # 82 种代码高亮主题
        └── extensions/               # Markdown 扩展
            ├── alert.ts              # GFM Alert 支持
            ├── footnotes.ts          # 脚注支持
            ├── katex.ts              # LaTeX 公式
            ├── toc.ts                # 目录生成
            ├── slider.ts             # 滑块组件
            ├── markup.ts             # 标记高亮
            ├── ruby.ts               # Ruby 注音
            ├── infographic.ts        # 信息图
            └── plantuml.ts           # PlantUML 图
```

---

## 三、文章发布提示词系统

### 3.1 提示词生成流程

**核心文件**: `scripts/md/renderer.ts` + `scripts/md/render.ts`

1. **解析 Frontmatter** - 从 Markdown 提取元数据：
```yaml
---
title: 文章标题
author: 作者名
summary: 文章摘要
coverImage: ./cover.png
---
```

2. **渲染 Markdown** - 使用自定义渲染器：
   - 标题层级处理 (h1-h6)
   - 段落格式化
   - 图片提取与占位符替换
   - 链接转换为底部引用 (默认行为)

3. **生成 HTML** - 带主题样式和内联 CSS

### 3.2 提示词模板位置

**文章生成提示词** 在 `references/article-posting.md` 中定义，主要包括：

```markdown
# Title (成为文章标题)

Regular paragraph with **bold** and *italic*.

## Section Header

![Image description](./image.png)

- List item 1
- List item 2

> Blockquote text

[Link text](https://example.com)
```

### 3.3 链接引用行为

**Markdown 模式默认行为**: 普通外部链接自动转换为底部引用 (citation)

**禁用引用**: 使用 `--no-cite` 参数保持链接内联

---

## 四、页面风格系统

### 4.1 4 种内置主题

| 主题 | 特点 | 默认色 | 适用场景 |
|------|------|--------|----------|
| **default** | 经典布局，居中标题带边框 | 蓝色 (#0F4C81) | 技术文章、正式文档 |
| **grace** | 优雅风格，文字阴影，圆角卡片 | 紫色 (#92617E) | 文学、艺术、生活类 |
| **simple** | 极简现代，非对称圆角 | 绿色 (#009874) | 简约风格、博客 |
| **modern** | 大圆角，药丸标题，宽松行距 | 橙色 (#D97757) | 现代感、创意设计 |

### 4.2 主题样式详解

#### default.css (经典主题)
```css
/* 一级标题：表格形式，居中，底部边框 */
h1 {
  display: table;
  padding: 0 1em;
  border-bottom: 2px solid var(--md-primary-color);
  margin: 2em auto 1em;
  text-align: center;
}

/* 二级标题：背景色块，白色文字 */
h2 {
  background: var(--md-primary-color);
  color: #fff;
  text-align: center;
}

/* 三级标题：左侧边框 */
h3 {
  border-left: 3px solid var(--md-primary-color);
  padding-left: 8px;
}
```

#### grace.css (优雅主题)
```css
/* 所有标题带阴影和圆角 */
h1, h2 {
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
}

/* 引用块带阴影 */
blockquote {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  font-style: italic;
}

/* 图片带圆角和阴影 */
img {
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}
```

### 4.3 13 种颜色预设

```typescript
const COLOR_PRESETS = {
  blue: "#0F4C81",        // 默认
  green: "#009874",
  vermilion: "#FA5151",
  yellow: "#FECE00",
  purple: "#92617E",
  sky: "#55C9EA",
  rose: "#B76E79",
  olive: "#556B2F",
  black: "#333333",
  gray: "#A9A9A9",
  pink: "#FFB7C5",
  red: "#A93226",
  orange: "#D97757",
};
```

### 4.4 82 种代码高亮主题

基于 highlight.js，包括:
- GitHub 系列：`github`, `github-dark`, `github-dark-dimmed`
- Atom 系列：`atom-one-dark`, `atom-one-light`
- 暗色主题：`monokai`, `nord`, `obsidian`, `tokyo-night-dark`
- 亮色主题：`vs`, `xcode`, `intellij-light`
- 等等...

---

## 五、核心技术实现

### 5.1 Chrome DevTools Protocol (cdp.ts)

核心功能函数：
```typescript
- launchChrome(): 启动 Chrome 带调试端口
- getPageSession(): 获取页面会话
- waitForNewTab(): 等待新标签页
- clickElement(): 点击元素
- typeText(): 输入文本
- evaluate(): 执行 JS
```

### 5.2 图片处理流程

1. **解析阶段**: 提取 Markdown 中的图片路径
2. **渲染阶段**: 替换为占位符 `WECHATIMGPH_N`
3. **粘贴阶段**: HTML 内容粘贴到编辑器
4. **替换阶段**:
   - 查找占位符文本
   - 滚动到可视区域
   - 按 Backspace 删除
   - 粘贴实际图片

### 5.3 剪贴板操作

**copy-to-clipboard.ts**:
- macOS: 使用 Swift/AppKit
- Linux: wl-clipboard 或 xclip
- Windows: PowerShell

**paste-from-clipboard.ts**:
- macOS: osascript (System Events)
- Linux: xdotool (X11) 或 ydotool (Wayland)
- Windows: PowerShell SendKeys

---

## 六、扩展配置 (EXTEND.md)

### 6.1 配置文件位置

```bash
# 项目级
.baoyu-skills/baoyu-post-to-wechat/EXTEND.md

# 用户级
~/.baoyu-skills/baoyu-post-to-wechat/EXTEND.md
```

### 6.2 支持的配置项

```yaml
default_theme: default/grace/simple/modern
default_color: blue/green/vermilion/yellow/purple/sky/rose/olive/black/gray/pink/red/orange
default_publish_method: api/browser
default_author: 作者名
need_open_comment: 1/0
only_fans_can_comment: 1/0
chrome_profile_path: /path/to/chrome/profile
```

### 6.3 配置优先级

```
CLI 参数 > Frontmatter > EXTEND.md > 技能默认值
```

---

## 七、使用示例

### 7.1 发布文章

```bash
# 发布 Markdown 文章
npx -y bun ./scripts/wechat-article.ts --markdown article.md

# 指定主题和颜色
npx -y bun ./scripts/wechat-article.ts --markdown article.md --theme grace --color purple

# 禁用底部引用
npx -y bun ./scripts/wechat-article.ts --markdown article.md --no-cite

# API 方式（快速）
npx -y bun ./scripts/wechat-api.ts article.md --theme modern --cover cover.png
```

### 7.2 发布贴图（图文）

```bash
# 从 Markdown 自动提取标题/内容
npx -y bun ./scripts/wechat-browser.ts --markdown source.md --images ./images/

# 显式指定标题内容
npx -y bun ./scripts/wechat-browser.ts --title "标题" --content "内容" --image img1.png --image img2.png
```

---

## 八、二次开发指南

### 8.1 修改主题样式

1. 编辑 `scripts/md/themes/default.css` 或其他主题文件
2. 使用 `var(--md-primary-color)` 引用主题色
3. 添加新的颜色预设到 `constants.ts`

### 8.2 添加 Markdown 扩展

在 `scripts/md/extensions/` 添加新的 `.ts` 文件：
```typescript
// 示例：添加新的扩展
import type { MarkdownRenderer } from '../renderer';

export function myExtension(renderer: MarkdownRenderer) {
  // 注册自定义语法
}
```

### 8.3 自定义渲染逻辑

修改 `scripts/md/renderer.ts`：
```typescript
// 自定义 heading 渲染
renderer.heading = (text, level) => {
  return `<h${level} class="custom-heading">${text}</h${level}>`;
};
```

### 8.4 添加新的发布渠道

参考 `wechat-browser.ts` 结构：
1. 实现 CDP 连接逻辑
2. 实现内容粘贴逻辑
3. 实现图片上传逻辑

---

## 九、关键文件路径

| 用途 | 文件路径 |
|------|----------|
| 主入口 | `scripts/wechat-article.ts` |
| 渲染引擎 | `scripts/md/render.ts` |
| 主题样式 | `scripts/md/themes/*.css` |
| 常量定义 | `scripts/md/constants.ts` |
| HTML 构建 | `scripts/md/html-builder.ts` |
| CDP 工具 | `scripts/cdp.ts` |

---

## 十、调试与测试

### 10.1 环境检查

```bash
npx -y bun ./scripts/check-permissions.ts
```

检查项目：
- Chrome 浏览器
- 配置文件隔离
- Bun 运行时
- macOS Accessibility 权限
- 剪贴板复制能力
- 粘贴 keystroke
- API 凭证
- Chrome 进程冲突

### 10.2 日志输出

脚本运行时输出详细日志：
```
[wechat] Parsing markdown: article.md
[wechat] Title: 文章标题
[wechat] Found 5 images to insert
[wechat] Copying HTML content...
[wechat] Pasting into editor...
[wechat] Inserting 5 images...
```

---

## 参考资料

- GitHub 仓库：https://github.com/JimLiu/baoyu-skills
- 技能位置：`/Users/onlyone/.openclaw/skills/baoyu-post-to-wechat/`

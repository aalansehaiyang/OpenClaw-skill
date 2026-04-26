---
name: web-content-download
version: 4.0.0
description: **Download web pages as Markdown with images**. Auto-saves to `/Users/onlyone/ai_code/data/web-content-download/<文章标题>_<timestamp>/`. Supports anti-scraping (WeChat MP, Cloudflare, etc.). **DEFAULT TOOL for web extraction**.
---

# Web Content Download - 网页内容下载器

**自动下载网页内容为 Markdown，包含图片**。支持微信公众号、反爬网站。

## 🚀 快速开始

### 默认用法（推荐）

```bash
# 自动保存到 /Users/onlyone/ai_code/data/web-content-download/<文章标题>_<时间戳>/
./scripts/web-content-download.sh "https://mp.weixin.qq.com/s/xxx"

# 或直接用 Python
python3 scripts/web-content-download.py "https://mp.weixin.qq.com/s/xxx"
```

### 输出结构

```
/Users/onlyone/ai_code/data/web-content-download/
└── 2026-03-10_如何从 CRUD 开发转型为 AI Agent 工程师/
    ├── article.md          # Markdown 文件（含原文标题和图片引用）
    └── images/             # 下载的图片
        ├── img_001.jpg
        ├── img_002.jpg
        └── ...
```

**命名格式**: `YYYY-MM-DD_文章标题`

**图片引用**: 使用相对路径 `![](./images/img_001.jpg)`

### 高级选项

```bash
# 指定字符限制
./scripts/web-content-download.sh "https://example.com" 50000

# 不下载图片
./scripts/web-content-download.sh "https://example.com" --no-images

# 指定下载基础目录（覆盖默认路径）
./scripts/web-content-download.sh "https://example.com" --output-base ./my_downloads

# 安静模式
./scripts/web-content-download.sh "https://example.com" -q
```

## 📊 特性

| 特性 | 说明 |
|------|------|
| **自动保存** | 默认保存到 `/Users/onlyone/ai_code/data/web-content-download/<时间戳>_<标题>/` |
| **原文标题** | Markdown 以 `# 原文标题` 开头 |
| **图片下载** | 自动下载所有图片到 `images/` 目录 |
| **图片引用** | Markdown 中引用本地图片路径 |
| **反爬绕过** | 支持微信公众号、Cloudflare 等 |
| **格式保留** | 标题、列表、链接、代码块 |

## 🎯 使用场景

- ✅ 微信公众号文章下载
- ✅ 技术博客内容保存
- ✅ 文档页面归档
- ✅ 新闻文章采集
- ✅ AI 写作素材收集

## 🔧 安装依赖

```bash
# 使用官方 PyPI（不要用清华源）
pip install -i https://pypi.org/simple git+https://github.com/D4Vinci/Scrapling.git html2text requests

# 或使用一键安装脚本
./install.sh
```

## 📝 Markdown 输出示例

```markdown
# 如何从 CRUD 开发转型为 AI Agent 工程师

# 一、为什么你需要这门课？

技术圈最大的焦虑不是"AI 会取代程序员"，而是"**会 AI 的程序员将取代不会 AI 的程序员**"。

![](./images/img_001.jpg)

你是否正面临这些困惑：

  * AI 使用经验仅限于聊天、写代码？
  * 只会调大模型的 API 写个聊天 Demo？
  * 听说过 RAG、Agent、LangChain，但不知道怎么用？
```

## ⚠️ 注意事项

1. **文件夹命名**: 格式为 `YYYY-MM-DD_文章标题`（如：`2026-03-07_如何从 CRUD 开发转型为 AI Agent 工程师`）
2. **标题 sanitization**: 自动移除非法字符（`<>:"/\|?*`）
3. **图片格式**: 保存为 `.jpg`，统一命名 `img_001.jpg`, `img_002.jpg`...
4. **图片引用**: Markdown 中使用相对路径 `![](./images/img_001.jpg)`
5. **默认下载图片**: 使用 `--no-images` 跳过

## 📚 相关技能

- **web-content-fetcher**: 轻量级文字提取（不下载图片）
- **wechat-mp**: 微信公众号专用提取

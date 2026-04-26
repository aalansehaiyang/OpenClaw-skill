# Web Content Download - 网页内容下载器

> 永久免费的网页内容下载终极方案，支持微信公众号、反爬网站，自动下载图片

## 🚀 快速开始

### 1. 安装依赖

**方式 1: 从 GitHub 安装（推荐）**
```bash
pip install git+https://github.com/D4Vinci/Scrapling.git html2text
```

**方式 2: 使用 requirements.txt**
```bash
pip install -r requirements.txt
```

**方式 3: 如果 GitHub 无法访问**
```bash
# 手动克隆并安装
git clone https://github.com/D4Vinci/Scrapling.git
cd Scrapling
pip install -e .
pip install html2text
```

> ⚠️ 注意：scrapling 不在 PyPI 上，必须从 GitHub 安装

### 2. 提取网页内容

```bash
# 基础用法 - 只提取文字
./scripts/scrapling-fetch.sh "https://mp.weixin.qq.com/s/xxxxx"

# 普通网页
./scripts/scrapling-fetch.sh "https://example.com/article"

# 自定义字符限制
./scripts/scrapling-fetch.sh "https://example.com" 15000

# 下载图片到本地
./scripts/scrapling-fetch.sh "https://example.com" --download-images

# 指定图片保存目录
./scripts/scrapling-fetch.sh "https://example.com" --download-images --output-dir ./imgs
```

## 📊 与其他方案对比

| 方案 | 微信公众号 | 反爬网站 | 免费限额 | 输出质量 |
|------|-----------|---------|---------|---------|
| **Scrapling** | ✅ 完整内容 | ✅ 自动绕过 | 无限制 | ⭐⭐⭐⭐⭐ |
| Jina Reader | ❌ 403 拦截 | ⚠️ 部分支持 | 200 次/天 | ⭐⭐⭐⭐⭐ |
| web_fetch | ❌ 请求中断 | ❌ 无法访问 | 无限制 | ⭐⭐⭐ |

## 🎯 推荐使用策略

**Scrapling 现在是默认首选工具！**

```
优先级 1: ✅ Scrapling (所有网站，默认选择)
优先级 2: Jina Reader (Scrapling 失败时的备选)
优先级 3: web_fetch (简单静态页面)
```

### 为什么优先用 Scrapling？

1. ✅ **无限制** - 没有请求次数限制
2. ✅ **反爬绕过** - 支持微信公众号、Cloudflare 等
3. ✅ **干净输出** - 只要正文，不要导航/广告
4. ✅ **图片下载** - 可以下载图片到本地
5. ✅ **格式保留** - Markdown 格式，保留链接、标题、列表

### 自动识别

```bash
# 微信公众号、Substack、Medium、GitHub 等 → 全部默认用 Scrapling
./scripts/scrapling-fetch.sh "$url"
```

## 📝 输出格式

Scrapling 返回干净的 Markdown，保留：
- ✅ 标题层级 (H1, H2, H3...)
- ✅ 段落格式
- ✅ 链接：`[text](url)`
- ✅ 图片：`![alt](url)`
- ✅ 列表（有序/无序）
- ✅ 代码块

移除：
- ❌ 导航栏
- ❌ 侧边栏
- ❌ 广告
- ❌ 页脚
- ❌ "相关推荐"

## 🔧 高级用法

### Python API

```python
from scrapling import Fetcher
import html2text

fetcher = Fetcher()
response = fetcher.get('https://example.com')

h = html2text.HTML2Text()
h.ignore_links = False
h.ignore_images = False
h.body_width = 0
markdown = h.handle(response.html)
print(markdown)
```

### 批量提取

```bash
while read url; do
  ./scripts/scrapling-fetch.sh "$url" 30000 > "$(echo $url | md5).md"
done < urls.txt
```

## ⚠️ 注意事项

1. **maxChars 设置**: 推荐 30000，既保证完整正文，又不会塞爆 context
2. **速度**: 约 3 秒/页（比 Jina 慢，但无限制）
3. **JavaScript 渲染**: 纯 JS 渲染的页面可能需要浏览器方案

## 📚 参考

- Scrapling GitHub: https://github.com/D4Vinci/Scrapling
- html2text: https://pypi.org/project/html2text/

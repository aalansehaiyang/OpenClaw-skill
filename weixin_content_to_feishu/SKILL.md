---
name: weixin_content_to_feishu
version: 1.0.0
description: 下载微信公众号文章并上传到飞书文档。一键将微信文章内容（含标题、段落、列表）导入到指定飞书文档。
---

# weixin_content_to_feishu — 微信公众号文章 → 飞书文档

**一键下载微信公众号文章并写入飞书文档**，自动处理标题提取和内容格式。

## 🚀 快速开始

```bash
# 基本用法
./scripts/weixin_content_to_feishu.sh \
  "https://mp.weixin.qq.com/s/xxx" \
  "https://offer-come.feishu.cn/wiki/xxx"

# 或传文档 token
./scripts/weixin_content_to_feishu.sh \
  "https://mp.weixin.qq.com/s/xxx" \
  "doxcnXXXX"

# 安静模式
./scripts/weixin_content_to_feishu.sh -q \
  "https://mp.weixin.qq.com/s/xxx" \
  "https://xxx.feishu.cn/wiki/xxx"
```

## 📋 参数

| 参数 | 说明 | 示例 |
|------|------|------|
| **第 1 个参数** | 微信公众号文章 URL | `https://mp.weixin.qq.com/s/xxx` |
| **第 2 个参数** | 飞书文档 URL 或 token | `https://xxx.feishu.cn/wiki/xxx` 或 `doxcnXXXX` |
| `-q` / `--quiet` | 安静模式（不输出进度信息） | — |

## 📊 工作流程

1. **下载** — 调用 `web-content-download` 下载微信文章，保存为 Markdown
2. **写入** — 使用 `lark-cli docs +update --command overwrite` 将 Markdown 全文覆盖到飞书文档
3. **修复标题** — 自动提取文章标题并替换默认 "Untitled"

## ⚠️ 注意事项

- 依赖 `web-content-download` skill（同级目录）
- 依赖 `lark-cli` 且已认证（`lark-cli auth login`）
- 目标飞书文档会被**全文覆盖**，原有内容会丢失
- 文章中的图片需要单独处理（当前版本不自动上传图片到飞书）

---
domain: zsxq.com
aliases: [知识星球, zsxq]
updated: 2026-06-01
---

## 平台特征

- 群组页面使用**滚动懒加载**，无传统分页按钮
- 文章详情页位于 `articles.zsxq.com/id_XXXX.html`
- 文章内通常嵌入飞书文档链接作为完整内容来源
- **必须登录**才能访问内容，使用用户已打开的 Chrome（CDP 代理自动携带登录态）
- 群组成页面 URL 格式：`https://wx.zsxq.com/group/{group_id}`
- 静态 HTTP 请求会被重定向到登录页，必须使用 CDP 浏览器

## 有效模式

### 选择器（发现日期：2026-06-01）

| 用途 | 选择器 | 备注 |
|------|--------|------|
| 文章链接 | `a.link-of-topic` | 主选择器 |
| 兜底选择器 | `a[href*="articles.zsxq.com/id_"]` | 主选择器失效时使用 |
| 通用兜底 | 所有 `a` 标签 + href 过滤 | 最终兜底 |

### URL 模式

| 类型 | 模式 |
|------|------|
| 群组页 | `https://wx.zsxq.com/group/{group_id}` |
| 文章页 | `https://articles.zsxq.com/id_{article_id}.html` |
| 飞书文档 | `https://*.feishu.cn/docx/{token}` 或 `https://*.feishu.cn/wiki/{token}` |

### 提取策略

1. 滚动到底部触发懒加载（`window.scrollTo(0, document.body.scrollHeight)`）
2. 等待 3 秒让新内容渲染
3. 提取 `a` 标签中 href 包含 `articles.zsxq.com/id_` 的元素
4. 过滤掉标题以 `http` 开头、长度 < 5 的无效链接
5. 按 URL 去重
6. 重复直到连续 2 次滚动无新内容，或达到 20 次上限

### 飞书内容拉取

文章页通常只展示摘要，完整内容在嵌入的飞书文档中。检测正文中 `feishu.cn` 域名链接，使用 `lark-cli docs +fetch --api-version v2` 获取完整文档内容。

## 已知陷阱

1. **非文章链接混入**：群组页面包含官网等非文章链接。过滤规则：URL 必须包含 `articles.zsxq.com/id_`，标题不能以 `http` 开头，标题长度至少 5 字符。

2. **懒加载需要充分等待**：滚动后至少等待 3 秒，网络慢时需要更长。等待时间不足会导致文章漏抓。

3. **文章摘要 vs 完整内容**：`articles.zsxq.com` 页面可能只展示摘要。必须检查并拉取飞书嵌入文档才能获得完整内容。

4. **飞书链接格式多样**：可能以纯文本或可点击超链接出现。提取时需同时检查 `innerText` 和 `a` 标签。

5. **图片可能需要认证**：zsxq 文章中的图片 URL 可能需要登录态才能下载。

6. **反爬风控**：短时间内密集导航到大量文章页可能触发限流。文章间保持 2 秒间隔。

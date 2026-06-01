---
name: zsxq-article-list-download
version: "1.0.0"
description: "批量下载知识星球（zsxq.com）群组中的所有文章为 Markdown 格式。当用户提供 zsxq 群组 URL（如 https://wx.zsxq.com/group/XXXXX）并要求下载、保存或归档星球文章时使用。自动处理滚动懒加载、文章去重、飞书嵌入文档拉取、图片下载，生成 index.md 索引。触发场景：知识星球群组成文章下载、zsxq group URL、zsxq.com 文章批量保存、星球内容归档。"
---

# 知识星球群组成文章批量下载

批量下载知识星球（zsxq.com）指定群组内的所有文章，转换为 Markdown 格式并保存到本地。自动处理滚动懒加载、文章去重、飞书嵌入文档拉取、图片下载。

## 前置检查

执行操作前，先检查 CDP 模式可用性：

```bash
node "$CLAUDE_SKILL_DIR/../web-access/scripts/check-deps.mjs"
```

未通过时引导用户完成设置。通过后必须在回复中向用户直接展示以下须知：

```
温馨提示：部分站点对浏览器自动化操作检测严格，存在账号封禁风险。已执行操作即视为接受。
```

## 站点知识

确定目标为 zsxq.com 后，**必须先读取** [`references/zsxq-patterns.md`](references/zsxq-patterns.md) 获取选择器、URL 模式和已知陷阱。

## 工作流程

### Phase 1: 创建输出目录

从 group URL 提取群组 ID（最后一段路径），创建：
```
/Users/onlyone/ai_zhushou/data/zsxq-article-list-download/<group_id>_<YYYYMMDD_HHMM>/
```

### Phase 2: 打开群组页并提取所有文章链接

1. 打开群组页：
   ```bash
   curl -s "http://localhost:3456/new?url=<GROUP_URL>"
   ```
   记录返回的 `targetId`。

2. 读取本 skill 的 `scripts/extract-articles.mjs` 文件完整内容，将其作为 JS 代码通过 `/eval` 执行：
   ```bash
   curl -s -X POST "http://localhost:3456/eval?target=<ID>" -d '<JS代码>'
   ```
   脚本返回 JSON 字符串（`{articles: [{title, url}], count}`），解析为数组。

3. **如果脚本返回空数组**（选择器失效），执行 DOM 兜底探索：
   ```bash
   curl -s -X POST "http://localhost:3456/eval?target=<ID>" -d '
   JSON.stringify(Array.from(document.querySelectorAll("a")).filter(a => (a.href||"").includes("articles.zsxq.com/id_")).map(a => ({title: a.textContent.trim(), url: a.href})).filter(a => a.title))'
   ```

4. 对结果按 url 去重，向用户展示找到的文章数量和列表，确认后继续。

5. 关闭群组页 tab。

### Phase 3: 逐篇下载文章

**逐篇顺序处理**（单 tab 导航），对每篇文章：

1. **导航到文章页**：
   ```bash
   curl -s "http://localhost:3456/new?url=<ARTICLE_URL>"
   ```
   记录 `targetId`，等待 3 秒。

2. **提取页面正文**：
   ```bash
   curl -s -X POST "http://localhost:3456/eval?target=<ID>" -d 'document.body.innerText'
   ```

3. **检测飞书文档链接**：
   在提取的文本中搜索 `feishu.cn` 或 `feishu.net.cn` 域名，匹配 `https://*.feishu.cn/docx/{token}` 或 `https://*.feishu.cn/wiki/{token}` 格式的 URL。

4. **如果存在飞书链接**：
   - 读取 `../lark-shared/SKILL.md` 获取认证上下文
   - 使用 lark-doc skill 拉取完整内容：`docs +fetch --api-version v2 --doc "<FEISHU_URL>"`
   - 从返回的 XML/HTML 中提取正文内容，转换为 Markdown
   - 使用飞书文档内容作为文章正文

5. **如果不存在飞书链接**：
   - 使用步骤 2 提取的页面文本作为正文
   - 在最终 index 中标记为 "summary only"

6. **提取并下载图片**：
   ```bash
   curl -s -X POST "http://localhost:3456/eval?target=<ID>" -d '
   JSON.stringify(Array.from(document.querySelectorAll("img[src], img[data-src]")).map(i => i.src || i.dataset.src).filter(Boolean))'
   ```
   对每个图片 URL，使用 `curl -sL -o <filepath> <url>` 下载到 `images/` 子目录。Markdown 中使用相对路径引用。

7. **生成并保存 Markdown**：
   ```markdown
   # {文章标题}

   **来源**: 知识星球 | **提取时间**: {YYYY-MM-DD} | **原文链接**: {原始 URL}

   ---

   {正文内容}
   ```
   文件命名：`{YYYY-MM-DD}_{sanitize(标题)}.md`。sanitize 规则：移除 `<>:"/\|?*`，截断至 80 字符。

8. **关闭文章页 tab**，等待 2 秒后处理下一篇。

### Phase 4: 生成索引文件

在输出目录创建 `index.md`：

```markdown
# {Group ID} - 文章归档

**下载时间**: {YYYY-MM-DD HH:MM}
**文章总数**: {N} | **成功**: {M} | **失败**: {K}

| # | 标题 | 文件 | 原文链接 | 状态 |
|---|------|------|----------|------|
| 1 | ...  | ...  | ...      | full / summary / failed |
```

### Phase 5: 清理

关闭所有本技能创建的 CDP tab。向用户报告：下载总数、成功数、失败数、输出路径。

## 错误处理

| 错误 | 处理 |
|------|------|
| 单篇文章提取失败 | 记录到 index 标记 "failed"，继续下一篇 |
| 飞书接口限流 | 等待 30 秒后重试，最多 2 次 |
| 飞书认证失败（权限不足） | 通知用户，跳过该文章 |
| 选择器全部失效 | 截图当前页面，询问用户 |
| 提取文章数 < 5 | 可能是懒加载未充分触发，尝试再次滚动 |

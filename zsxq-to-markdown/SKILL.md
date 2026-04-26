---
name: zsxq-to-markdown
description: "Download and convert 知识星球 (zsxq.com) articles to clean Markdown format. Use when user provides a zsxq.com or 知识星球 URL and asks to download, save, extract, or convert the content. Triggers on URLs containing articles.zsxq.com, wx.zsxq.com, or zsxq.com/id_."
---

# 知识星球文章转 Markdown

从知识星球私密文章下载内容并转换为结构化的 Markdown 文件。

## 工作流程

### 1. 提取文章 ID

从 URL 中提取文章 ID，格式如 `id_q74wm2gzfzr8`。
文章标题可从浏览器 snapshot 中获取。

### 2. 用浏览器打开（需登录态）

知识星球文章需要登录才能访问，必须使用 `browser` 工具 + `profile="user"`：

```
browser open "https://articles.zsxq.com/id_xxx.html" profile="user"
browser snapshot targetId=<返回的 targetId>
```

> 如果 browser 工具超时，改用 agent-browser CLI + CDP 模式：
> ```bash
> agent-browser --cdp 18801 open "https://articles.zsxq.com/id_xxx.html"
> agent-browser snapshot -i
> ```

### 3. 从 snapshot 提取内容

从 snapshot 的 aria tree 中提取：
- **文章标题**：第一个 `heading` 元素
- **来源/作者**：包含"来自："的 statictext
- **发布时间**：日期时间格式的 statictext
- **正文内容**：各 heading 之间的 statictext 段落

### 4. 生成 Markdown

按以下模板组织内容：

```markdown
# {文章标题}

**来源**: {来源/作者} | **发布时间**: {时间} | **提取时间**: {YYYY-MM-DD}

---

{正文内容，按 heading 层级组织}

---

*原文链接*: {原始 URL}
```

正文处理规则：
- 将 aria tree 中的 `heading` 转为 `##` / `###` 等标题
- `statictext` 段落用空行分隔
- 去除重复的换行符
- 保留原有的列表、引用等结构

### 5. 保存文件

保存目录：`/Users/onlyone/ai_zhushou/data/zsxq-to-markdown/`

文件命名：`{YYYY-MM-DD}_{文章标题}.md`

如果标题过长或含特殊字符，用简短关键词替代。

## 注意事项

- 知识星球是付费私密社群，**必须**使用 `profile="user"` 借用用户已登录的浏览器会话
- 不要对 zsxq.com 使用 `web_fetch`，它会被重定向到登录页
- 如果文章有图片，snapshot 中会包含 `image` 元素，可在 Markdown 中用 `![描述](占位)` 标注
- 文章可能包含外部链接（如语雀专栏），一并保留

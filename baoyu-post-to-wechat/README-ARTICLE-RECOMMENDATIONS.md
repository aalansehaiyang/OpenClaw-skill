# 公众号文章末尾推荐功能

## 功能说明

在发布公众号文章时，自动在文章末尾添加最新发布的 6 篇文章推荐，引导读者阅读更多历史文章，增加公众号粘性。

## 效果展示

文章末尾会显示一个精美的推荐区域：

```
━━━━━━━━━━━━━━━━━━━━━━━━━
      📚 破局哥聊职场 · 精选文章
      
点击下方文章，阅读更多职场干货

┌─────────────────────────────────────┐
│ ① 公司里，告诉你一个面试的真相...    │
│   面试不是能力比赛，是价格谈判...    │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ ② 单位里，能力越强越容易被利用...    │
│   当你成功的时候，你做什么都是对的... │
└─────────────────────────────────────┘

... (最多 6 篇)

━━━━━━━━━━━━━━━━━━━━━━━━━
关注公众号 破局哥聊职场，获取更多精彩内容
```

## 使用方法

### 方法一：使用 wechat-api.ts 脚本

```bash
npx -y bun ~/.openclaw/skills/baoyu-post-to-wechat/scripts/wechat-api.ts \
    <文章路径> \
    --theme default \
    --latest-articles \
    --latest-articles-count 6 \
    --latest-articles-account "破局哥聊职场"
```

### 方法二：使用写手三号的发布脚本

```bash
cd /Users/onlyone/.openclaw/workspace/agents/公众号/写手三号
./scripts/publish-with-recommendations.sh outputs/2026-03-30_职场真相.md
```

### 方法三：单独获取推荐文章列表

```bash
# JSON 格式
npx -y bun ~/.openclaw/skills/baoyu-post-to-wechat/scripts/fetch-latest-articles.ts \
    --count 6 \
    --format json

# HTML 格式（可直接插入文章）
npx -y bun ~/.openclaw/skills/baoyu-post-to-wechat/scripts/fetch-latest-articles.ts \
    --count 6 \
    --format html \
    --account "破局哥聊职场"

# Markdown 格式
npx -y bun ~/.openclaw/skills/baoyu-post-to-wechat/scripts/fetch-latest-articles.ts \
    --count 6 \
    --format markdown
```

## 配置要求

### 1. 微信公众号 API 凭证

必须配置 API 凭证才能使用此功能：

**步骤：**
1. 访问 https://mp.weixin.qq.com
2. 进入 开发 → 基本配置
3. 复制 AppID 和 AppSecret
4. 创建配置文件（二选一）：

   **项目级配置**：
   ```bash
   mkdir -p ~/.openclaw/workspace/.baoyu-skills
   cat > ~/.openclaw/workspace/.baoyu-skills/.env << EOF
   WECHAT_APP_ID=你的 AppID
   WECHAT_APP_SECRET=你的 AppSecret
   EOF
   ```

   **用户级配置**：
   ```bash
   mkdir -p ~/.baoyu-skills
   cat > ~/.baoyu-skills/.env << EOF
   WECHAT_APP_ID=你的 AppID
   WECHAT_APP_SECRET=你的 AppSecret
   EOF
   ```

### 2. 验证配置

```bash
npx -y bun ~/.openclaw/skills/baoyu-post-to-wechat/scripts/test-fetch-articles.sh
```

## 参数说明

| 参数 | 说明 | 默认值 |
|------|------|--------|
| `--latest-articles` | 启用推荐文章功能 | 关闭 |
| `--latest-articles-count` | 获取文章数量 | 6 |
| `--latest-articles-account` | 公众号名称（显示在底部） | "破局哥聊职场" |

## 注意事项

1. **API 权限**：需要微信公众号的 API 调用权限
2. **失败处理**：如果获取推荐文章失败，文章仍会正常发布，只是不包含推荐区域
3. **文章数量**：如果公众号文章少于指定数量，会返回所有可用文章
4. **样式定制**：推荐区域的 HTML 样式可以在 `fetch-latest-articles.ts` 中修改

## 技术实现

### 核心文件

- `fetch-latest-articles.ts`: 获取并格式化推荐文章
- `wechat-api.ts`: 发布文章时调用推荐功能
- `publish-with-recommendations.sh`: 快捷发布脚本

### API 接口

使用微信公众号 API：
- `GET /cgi-bin/token`: 获取访问令牌
- `POST /cgi-bin/collection/list`: 获取已发布文章列表

### 推荐区域 HTML 结构

```html
<section style="margin-top: 40px; padding-top: 30px; border-top: 2px dashed #e0e0e0;">
  <section style="text-align: center; margin-bottom: 20px;">
    <span style="...">📚 破局哥聊职场 · 精选文章</span>
  </section>
  <section style="padding: 0 10px;">
    <!-- 文章列表 -->
  </section>
  <section style="text-align: center; margin-top: 20px;">
    <!-- 关注提示 -->
  </section>
</section>
```

## 常见问题

### Q: 获取推荐文章失败怎么办？
A: 检查 API 凭证是否正确，网络是否畅通。失败不会影响文章正常发布。

### Q: 可以自定义推荐文章的样式吗？
A: 可以，修改 `fetch-latest-articles.ts` 中的 `formatArticlesForFooter` 函数。

### Q: 能指定推荐特定的文章吗？
A: 当前版本自动获取最新的 N 篇文章。如需指定，需要修改代码逻辑。

### Q: 推荐区域会影响文章排版吗？
A: 不会，推荐区域使用独立的 section，与正文内容分离。

## 更新日志

- **2026-03-30**: 初始版本，支持自动获取最新文章并添加到文章末尾
- **2026-03-30**: 添加快捷发布脚本和测试脚本

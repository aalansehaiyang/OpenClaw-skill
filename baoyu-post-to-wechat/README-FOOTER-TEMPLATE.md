# 公众号文章末尾固定模板

## 功能说明

在每篇公众号文章末尾自动添加固定的公众号名片模板，包含：
- ✅ 点赞/在看提示语
- ✅ 公众号名片卡片（头像 + 名称 + 简介）
- ✅ 置顶标星提示
- ✅ 转载说明

## 效果展示

```
━━━━━━━━━━━━━━━━━━━━━━━━━

全文完，如果喜欢，就点个"赞"或者"在看"关注吧。↓↓↓

┌─────────────────────────────────────┐
│ [头像] 破局哥聊职场                 │
│        破局哥聊职场，洞察体制内...  │
│        公众号                    ›  │
└─────────────────────────────────────┘

公众号的推送算法改变，建议置顶标星，
否则可能收不到文章；转载请注明出处，
感谢您。
```

## 使用方法

### 方法一：自动添加（推荐）

使用写手三号发布文章时，自动添加：

```bash
cd /Users/onlyone/.openclaw/workspace/agents/公众号/写手三号
./scripts/publish-with-recommendations.sh outputs/2026-03-30_职场真相.md
```

### 方法二：手动添加

```bash
npx -y bun ~/.openclaw/skills/baoyu-post-to-wechat/scripts/add-footer-to-article.ts \
    <文章路径>
```

### 方法三：直接复制 HTML

复制 `article-footer-template.html` 文件内容，粘贴到文章末尾。

## 文件位置

- **模板文件**: `~/.openclaw/skills/baoyu-post-to-wechat/scripts/article-footer-template.html`
- **添加脚本**: `~/.openclaw/skills/baoyu-post-to-wechat/scripts/add-footer-to-article.ts`
- **发布脚本**: `~/workspace/agents/公众号/写手三号/scripts/publish-with-recommendations.sh`

## 自定义修改

如需修改公众号信息（头像、名称、简介等），编辑模板文件：

```bash
vim ~/.openclaw/skills/baoyu-post-to-wechat/scripts/article-footer-template.html
```

### 可修改的内容

1. **公众号头像**：
   ```html
   <img src="你的头像 URL" ... />
   ```

2. **公众号名称**：
   ```html
   <h3>你的公众号名称</h3>
   ```

3. **公众号简介**：
   ```html
   <p>你的公众号简介</p>
   ```

4. **提示语文案**：
   根据需要修改点赞、置顶、转载等提示语

## 注意事项

1. **头像 URL**：使用微信公众号后台的图片链接，确保稳定可用
2. **样式保持**：不要删除关键样式，确保在微信内正常显示
3. **重复检测**：脚本会自动检测是否已添加，避免重复
4. **发布顺序**：先添加模板，再发布到公众号

## 完整工作流程

```
写作完成
    ↓
清理分隔符（clean-separators.sh）
    ↓
添加名片模板（add-footer-to-article.ts）
    ↓
发布到公众号（wechat-api.ts）
    ↓
完成 ✓
```

## 更新日志

- **2026-03-30**: 初始版本，创建固定模板和自动添加脚本
- **2026-03-30**: 集成到写手三号发布流程

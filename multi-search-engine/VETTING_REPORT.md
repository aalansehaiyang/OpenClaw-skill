# SKILL VETTING REPORT

**Skill**: multi-search-engine  
**Source**: ClawHub (via convex.site CDN)  
**Author**: @gpyAngyoujun  
**Version**: 2.0.1  
**Published**: 2026-02-05 (from timestamp 1770313848158)

---

## METRICS

| Metric | Value |
|--------|-------|
| Downloads/Views | 59.2k |
| Stars | ⭐299 |
| Version | v2.0.1 |
| Files Reviewed | 7 |

---

## FILES REVIEWED

1. `SKILL.md` - 3.4 KB - 主文档
2. `_meta.json` - 138 B - 元数据
3. `metadata.json` - 239 B - 技能描述
4. `config.json` - 1.7 KB - 配置文件
5. `CHANGELOG.md` - 376 B - 变更日志
6. `CHANNELLOG.md` - 1.1 KB - 频道日志
7. `references/international-search.md` - 23 KB - 国际搜索指南

---

## RED FLAGS CHECK

| Red Flag | Status |
|----------|--------|
| curl/wget to unknown URLs | ✅ None (仅使用公开搜索引擎 URL) |
| Sends data to external servers | ✅ None |
| Requests credentials/tokens/API keys | ✅ None (明确标注无需 API 密钥) |
| Reads ~/.ssh, ~/.aws, ~/.config | ✅ None |
| Accesses MEMORY.md, USER.md, SOUL.md | ✅ None |
| Uses base64 decode | ✅ None |
| Uses eval() or exec() | ✅ None |
| Modifies system files outside workspace | ✅ None |
| Installs packages without listing | ✅ None |
| Network calls to IPs instead of domains | ✅ None (全部使用域名) |
| Obfuscated code | ✅ None |
| Requests elevated/sudo permissions | ✅ None |
| Accesses browser cookies/sessions | ✅ None |
| Touches credential files | ✅ None |

---

## PERMISSIONS NEEDED

| Category | Details |
|----------|---------|
| **Files** | 仅读取自身目录文件 |
| **Network** | 公开搜索引擎 URL（Google/Baidu/DuckDuckGo 等） |
| **Commands** | web_fetch（OpenClaw 原生工具） |

---

## RISK LEVEL: 🟢 LOW

**Reasoning**:
- 仅使用公开搜索引擎 URL
- 无需 API 密钥
- 无凭证/敏感数据访问
- 无代码执行
- 使用 OpenClaw 原生 web_fetch 工具
- ClawHub 最热门技能（59.2k 浏览，299 收藏）

---

## VERDICT: ✅ SAFE TO INSTALL

**条件**：
- 无需额外配置
- 直接使用 web_fetch 调用搜索引擎 URL

---

## NOTES

**优点**：
- 代码透明，无混淆
- 17 个搜索引擎（8 国内 +9 国际）
- 无需 API 密钥
- 支持高级搜索语法
- 来自 ClawHub，有 59.2k 浏览量和 299 收藏
- 作者公开 (@gpyAngyoujun)

**引擎列表**：
- **国内 (8)**: Baidu, Bing CN, Bing INT, 360, Sogou, WeChat, Toutiao, Jisilu
- **国际 (9)**: Google, Google HK, DuckDuckGo, Yahoo, Startpage, Brave, Ecosia, Qwant, WolframAlpha

**功能**：
- 高级搜索运算符（site:, filetype:, "", -, OR）
- 时间过滤（小时/天/周/月/年）
- DuckDuckGo Bangs 快捷方式
- WolframAlpha 知识查询

**建议**：
- 首次使用先测试基本搜索
- 国内搜索用 Baidu/Bing CN
- 国际搜索用 Google/DuckDuckGo
- 隐私搜索用 DuckDuckGo/Startpage

---

*Vetted by: 二当家 🐙*  
*Timestamp: 2026-03-16 21:25 GMT+8*

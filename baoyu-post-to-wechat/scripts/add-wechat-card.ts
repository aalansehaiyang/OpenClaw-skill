/**
 * 在文章末尾添加可点击的公众号名片
 * 
 * 使用方法:
 *   npx -y bun add-wechat-card.ts <文章路径> [公众号原始 ID]
 * 
 * 示例:
 *   npx -y bun add-wechat-card.ts outputs/文章.md gh_xxxxxxxxxxxx
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 默认的公众号信息
const DEFAULT_WECHAT_INFO = {
  name: "破局哥聊职场",
  description: "破局哥聊职场，洞察体制内职场，关于领域内容，个人事迹故事",
  // 需要替换为真实的原始 ID
  originalId: "gh_xxxxxxxxxxxx", 
  // 头像 URL 需要从公众号后台获取
  avatarUrl: "https://mmbiz.qpic.cn/mmbiz_png/QF8V34a60UOzArByt9nibPmAPVS0L62CSxFRVrMejJBwbI9nyMEA1tAegs4793doAUD2TCuH74aZc9LKPSx95eQ/0?wx_fmt=png",
};

function parseFrontmatter(content: string): { frontmatter: Record<string, string>; body: string } {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return { frontmatter: {}, body: content };

  const frontmatter: Record<string, string> = {};
  const lines = match[1]!.split("\n");
  for (const line of lines) {
    const colonIdx = line.indexOf(":");
    if (colonIdx > 0) {
      const key = line.slice(0, colonIdx).trim();
      let value = line.slice(colonIdx + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      frontmatter[key] = value;
    }
  }

  return { frontmatter, body: match[2]! };
}

function generateWechatCard(wechatInfo: typeof DEFAULT_WECHAT_INFO): string {
  return `
<!-- 公众号名片卡片 - 可点击版本 -->
<section style="margin: 25px 15px; padding: 0; background: #f8f9fa; border-radius: 10px; border: 1px solid #e9ecef; overflow: hidden;">
  <a href="weixin://dl/profile/${wechatInfo.originalId}" style="text-decoration: none; color: inherit; display: block; padding: 20px;">
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <!-- 公众号头像 -->
        <td style="width: 60px; vertical-align: top; padding-right: 15px;">
          <img src="${wechatInfo.avatarUrl}" 
               alt="${wechatInfo.name}" 
               style="width: 50px; height: 50px; border-radius: 8px; display: block;" />
        </td>
        <!-- 公众号信息 -->
        <td style="vertical-align: middle;">
          <h3 style="margin: 0 0 8px 0; font-size: 16px; color: #333; font-weight: 600;">
            ${wechatInfo.name}
          </h3>
          <p style="margin: 0 0 6px 0; font-size: 13px; color: #666; line-height: 1.5;">
            ${wechatInfo.description}
          </p>
          <p style="margin: 0; font-size: 12px; color: #999;">
            公众号
          </p>
        </td>
        <!-- 箭头 -->
        <td style="width: 30px; vertical-align: middle; text-align: right;">
          <span style="color: #07c160; font-size: 18px; font-weight: bold;">›</span>
        </td>
      </tr>
    </table>
  </a>
</section>`;
}

function addWechatCardToMarkdown(markdownPath: string, wechatOriginalId?: string): void {
  const content = fs.readFileSync(markdownPath, "utf-8");
  const { frontmatter, body } = parseFrontmatter(content);

  // 检查是否已经包含公众号名片
  if (body.includes("公众号名片卡片")) {
    console.log(`⚠️  文章已包含公众号名片，跳过：${markdownPath}`);
    return;
  }

  // 使用提供的原始 ID 或默认值
  const wechatInfo = {
    ...DEFAULT_WECHAT_INFO,
    originalId: wechatOriginalId || DEFAULT_WECHAT_INFO.originalId,
  };

  const cardHtml = generateWechatCard(wechatInfo);

  // 在文章末尾添加名片模板（在固定结尾之后）
  const fixedEnding = "如果喜欢，就点个'赞'或者'在看'关注吧。↓↓↓";
  
  let newBody: string;
  if (body.includes(fixedEnding)) {
    // 在固定结尾之后添加名片模板
    const parts = body.split(fixedEnding);
    newBody = parts[0]! + fixedEnding + "\n\n" + cardHtml + (parts[1] || "");
  } else {
    // 直接在末尾添加
    newBody = body + "\n\n" + cardHtml;
  }

  // 重新组合文章
  const frontmatterStr = Object.entries(frontmatter)
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");
  
  const newContent = `---\n${frontmatterStr}\n---\n\n${newBody}`;

  // 保存文件
  fs.writeFileSync(markdownPath, newContent, "utf-8");
  console.log(`✅ 已添加公众号名片模板：${markdownPath}`);
  console.log(`📋 公众号原始 ID: ${wechatInfo.originalId}`);
}

function printUsage(): never {
  console.log(`在文章末尾添加可点击的公众号名片模板

Usage:
  npx -y bun add-wechat-card.ts <markdown_file> [wechat_original_id]

Arguments:
  markdown_file       Markdown 文件路径
  wechat_original_id  公众号原始 ID（gh_ 开头，可选）

Example:
  npx -y bun add-wechat-card.ts outputs/2026-03-30_职场真相.md gh_xxxxxxxxxxxx
`);
  process.exit(0);
}

function main(): void {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    printUsage();
  }

  const markdownPath = args[0];
  const wechatOriginalId = args[1];

  if (!markdownPath) {
    console.error("Error: 请提供 Markdown 文件路径");
    process.exit(1);
  }

  if (!fs.existsSync(markdownPath)) {
    console.error(`Error: 文件不存在：${markdownPath}`);
    process.exit(1);
  }

  if (!markdownPath.endsWith(".md")) {
    console.error("Error: 请提供 Markdown 文件（.md 后缀）");
    process.exit(1);
  }

  addWechatCardToMarkdown(markdownPath, wechatOriginalId);
}

main();

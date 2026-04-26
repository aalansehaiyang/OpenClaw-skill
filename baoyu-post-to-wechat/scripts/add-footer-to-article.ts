/**
 * 在文章末尾添加可点击的公众号名片模板
 * 
 * 使用方法:
 *   npx -y bun add-footer-to-article.ts <文章路径>
 * 
 * 示例:
 *   npx -y bun add-footer-to-article.ts outputs/2026-03-30_职场真相.md
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 读取固定的文章末尾模板
const footerTemplatePath = path.join(__dirname, "article-footer-template.html");
const footerTemplate = fs.readFileSync(footerTemplatePath, "utf-8");

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

function addFooterToMarkdown(markdownPath: string): void {
  const content = fs.readFileSync(markdownPath, "utf-8");
  const { frontmatter, body } = parseFrontmatter(content);

  // 检查是否已经包含公众号名片
  if (body.includes("<mp-profile") || body.includes("公众号名片")) {
    console.log(`⚠️  文章已包含公众号名片，跳过：${markdownPath}`);
    return;
  }

  // 在文章末尾添加固定模板（在固定结尾之后）
  const fixedEnding = "如果喜欢，就点个'赞'或者'在看'关注吧。↓↓↓";
  
  let newBody: string;
  if (body.includes(fixedEnding)) {
    // 在固定结尾之后添加名片模板
    const parts = body.split(fixedEnding);
    // 确保模板独立成行，前后都有空行，避免被 p 标签包裹
    newBody = parts[0]! + fixedEnding + "\n\n\n" + footerTemplate + "\n\n\n" + (parts[1] || "");
  } else {
    // 直接在末尾添加
    newBody = body + "\n\n\n" + footerTemplate + "\n\n\n";
  }

  // 重新组合文章
  const frontmatterStr = Object.entries(frontmatter)
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");
  
  const newContent = `---\n${frontmatterStr}\n---\n\n${newBody}`;

  // 保存文件
  fs.writeFileSync(markdownPath, newContent, "utf-8");
  console.log(`✅ 已添加公众号名片模板：${markdownPath}`);
}

function printUsage(): never {
  console.log(`在文章末尾添加固定的公众号名片模板

Usage:
  npx -y bun add-footer-to-article.ts <markdown_file>

Arguments:
  markdown_file       Markdown 文件路径（包含 YAML frontmatter）

Example:
  npx -y bun add-footer-to-article.ts outputs/2026-03-30_职场真相.md
  npx -y bun add-footer-to-article.ts article.md
`);
  process.exit(0);
}

function main(): void {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    printUsage();
  }

  const markdownPath = args[0];
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

  addFooterToMarkdown(markdownPath);
}

main();

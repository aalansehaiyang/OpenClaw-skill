/**
 * Fetch latest published articles from WeChat Official Account
 * 
 * This script fetches the most recent articles from the specified account
 * and returns them formatted for inclusion in new articles.
 */

import fs from "node:fs";
import path from "node:path";
import os from "node:os";

interface WechatConfig {
  appId: string;
  appSecret: string;
}

interface ArticleInfo {
  title: string;
  url: string;
  digest?: string;
  content?: string;
  thumb_url?: string;
  create_time?: number;
}

interface FetchArticlesResponse {
  item: Array<{
    content: string;
    content_source_url: string;
    digest: string;
    thumb_url: string;
    title: string;
    url: string;
    create_time: number;
  }>;
  total_count: number;
  item_count: number;
}

const TOKEN_URL = "https://api.weixin.qq.com/cgi-bin/token";
// 优先使用 freepublish/batchget 接口获取已发布文章
const PUBLISHED_LIST_URL = "https://api.weixin.qq.com/cgi-bin/freepublish/batchget";
// 备用：使用 material/batchget_material 接口获取素材
const MATERIAL_LIST_URL = "https://api.weixin.qq.com/cgi-bin/material/batchget_material";

function loadEnvFile(envPath: string): Record<string, string> {
  const env: Record<string, string> = {};
  if (!fs.existsSync(envPath)) return env;

  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim();
      let value = trimmed.slice(eqIdx + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      env[key] = value;
    }
  }
  return env;
}

function loadConfig(): WechatConfig {
  const cwdEnvPath = path.join(process.cwd(), ".baoyu-skills", ".env");
  const homeEnvPath = path.join(os.homedir(), ".baoyu-skills", ".env");

  const cwdEnv = loadEnvFile(cwdEnvPath);
  const homeEnv = loadEnvFile(homeEnvPath);

  const appId = process.env.WECHAT_APP_ID || cwdEnv.WECHAT_APP_ID || homeEnv.WECHAT_APP_ID;
  const appSecret = process.env.WECHAT_APP_SECRET || cwdEnv.WECHAT_APP_SECRET || homeEnv.WECHAT_APP_SECRET;

  if (!appId || !appSecret) {
    throw new Error(
      "Missing WECHAT_APP_ID or WECHAT_APP_SECRET.\n" +
      "Set via environment variables or in .baoyu-skills/.env file."
    );
  }

  return { appId, appSecret };
}

async function fetchAccessToken(appId: string, appSecret: string): Promise<string> {
  const url = `${TOKEN_URL}?grant_type=client_credential&appid=${appId}&secret=${appSecret}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch access token: ${res.status}`);
  }
  const data = await res.json();
  if (data.errcode) {
    throw new Error(`Access token error ${data.errcode}: ${data.errmsg}`);
  }
  if (!data.access_token) {
    throw new Error("No access_token in response");
  }
  return data.access_token;
}

export async function fetchPublishedArticles(
  accessToken: string,
  offset: number = 0,
  count: number = 6
): Promise<ArticleInfo[]> {
  // 方案 1：尝试获取已发布文章列表（需要公众号授权）
  try {
    const url = `${PUBLISHED_LIST_URL}?access_token=${accessToken}`;
    const body = {
      offset: offset,
      count: count,
      no_content: 1,  // 不获取正文内容，加快速度
    };

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await res.json() as any;
    
    // 如果接口可用，返回已发布文章
    if (data.item && Array.isArray(data.item)) {
      console.error("[fetch-articles] Using published articles API");
      return data.item.map((item: any) => ({
        title: item.title,
        url: item.url,
        digest: item.digest,
        thumb_url: item.thumb_url,
        create_time: item.create_time,
      }));
    }
    
    // 如果接口未授权，继续尝试方案 2
    if (data.errcode === 48001) {
      console.error("[fetch-articles] Published articles API not authorized, trying material API...");
    } else if (data.errcode && data.errcode !== 0) {
      console.error(`[fetch-articles] Published articles API error: ${data.errcode} - ${data.errmsg}`);
    }
  } catch (err) {
    console.error(`[fetch-articles] Published articles API failed: ${err instanceof Error ? err.message : String(err)}`);
  }
  
  // 方案 2：获取素材列表（备用方案）
  try {
    const url = `${MATERIAL_LIST_URL}?access_token=${accessToken}`;
    const body = {
      type: "news",
      offset: offset,
      count: count,
    };

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await res.json() as any;
    
    if (data.errcode && data.errcode !== 0) {
      console.error(`[fetch-articles] Material API error: ${data.errcode} - ${data.errmsg}`);
      return [];
    }
    
    console.error("[fetch-articles] Using material API (fallback)");
    
    // 解析素材列表
    const items = data.item || [];
    if (!Array.isArray(items)) {
      console.error("[fetch-articles] No items found in response");
      return [];
    }
    
    // 提取文章信息
    const articles: ArticleInfo[] = [];
    for (const item of items) {
      if (item.content && item.content.news_item && item.content.news_item.length > 0) {
        const article = item.content.news_item[0];
        articles.push({
          title: article.title,
          url: article.url,
          digest: article.digest,
          thumb_url: article.thumb_url,
          create_time: item.create_time,
        });
      }
    }
    
    return articles;
  } catch (err) {
    console.error(`[fetch-articles] Material API failed: ${err instanceof Error ? err.message : String(err)}`);
    return [];
  }
}

export function formatArticlesForFooter(articles: ArticleInfo[], accountName: string = "破局哥聊职场"): string {
  if (articles.length === 0) {
    return "";
  }

  // Create HTML for article recommendations
  const articleLinks = articles.map((article, index) => {
    const num = index + 1;
    return `
<div style="margin: 12px 0; padding: 10px; background: #f8f9fa; border-radius: 6px; border-left: 3px solid #07c160;">
  <div style="font-size: 14px; color: #333; font-weight: 500;">
    <span style="display: inline-block; width: 20px; height: 20px; line-height: 20px; text-align: center; background: #07c160; color: white; border-radius: 50%; margin-right: 8px; font-size: 12px;">${num}</span>
    <a href="${article.url}" style="color: #333; text-decoration: none;" target="_blank">${article.title}</a>
  </div>
  ${article.digest ? `<div style="font-size: 12px; color: #999; margin-top: 6px; padding-left: 28px;">${article.digest.slice(0, 60)}${article.digest.length > 60 ? '...' : ''}</div>` : ''}
</div>`;
  }).join("");

  return `
<section style="margin-top: 40px; padding-top: 30px; border-top: 2px dashed #e0e0e0;">
  <section style="text-align: center; margin-bottom: 20px;">
    <span style="display: inline-block; padding: 6px 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 20px; font-size: 14px; font-weight: 600; letter-spacing: 1px;">
      📚 ${accountName} · 精选文章
    </span>
  </section>
  <section style="padding: 0 10px;">
    <div style="font-size: 13px; color: #666; margin-bottom: 15px; text-align: center;">
      点击下方文章，阅读更多职场干货
    </div>
    ${articleLinks}
  </section>
  <section style="text-align: center; margin-top: 20px; padding-top: 15px; border-top: 1px solid #f0f0f0;">
    <div style="font-size: 12px; color: #999;">
      关注公众号 <span style="color: #07c160; font-weight: 600;">${accountName}</span>，获取更多精彩内容
    </div>
  </section>
</section>`;
}

function printUsage(): never {
  console.log(`Fetch latest published articles from WeChat Official Account

Usage:
  npx -y bun fetch-latest-articles.ts [options]

Options:
  --count <n>         Number of articles to fetch (default: 6)
  --offset <n>        Offset for pagination (default: 0)
  --account <name>    Account name for footer (default: 破局哥聊职场)
  --format <type>     Output format: json | html | markdown (default: json)
  --output <path>     Save to file instead of stdout
  --help              Show this help

Environment Variables:
  WECHAT_APP_ID       WeChat App ID
  WECHAT_APP_SECRET   WeChat App Secret

Config File Locations (in priority order):
  1. Environment variables
  2. <cwd>/.baoyu-skills/.env
  3. ~/.baoyu-skills/.env

Examples:
  npx -y bun fetch-latest-articles.ts
  npx -y bun fetch-latest-articles.ts --count 6 --format html
  npx -y bun fetch-latest-articles.ts --output articles.json
`);
  process.exit(0);
}

interface CliArgs {
  count: number;
  offset: number;
  account: string;
  format: "json" | "html" | "markdown";
  output?: string;
}

function parseArgs(argv: string[]): CliArgs {
  if (argv.length === 0 || argv.includes("--help") || argv.includes("-h")) {
    printUsage();
  }

  const args: CliArgs = {
    count: 6,
    offset: 0,
    account: "破局哥聊职场",
    format: "json",
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;
    if (arg === "--count" && argv[i + 1]) {
      args.count = parseInt(argv[++i]!, 10);
    } else if (arg === "--offset" && argv[i + 1]) {
      args.offset = parseInt(argv[++i]!, 10);
    } else if (arg === "--account" && argv[i + 1]) {
      args.account = argv[++i]!;
    } else if (arg === "--format" && argv[i + 1]) {
      const fmt = argv[++i]!.toLowerCase();
      if (fmt === "json" || fmt === "html" || fmt === "markdown") {
        args.format = fmt;
      }
    } else if (arg === "--output" && argv[i + 1]) {
      args.output = argv[++i];
    } else if (arg.startsWith("--") && argv[i + 1] && !argv[i + 1]!.startsWith("-")) {
      i++;
    }
  }

  return args;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  console.error(`[fetch-articles] Fetching ${args.count} latest articles...`);

  const config = loadConfig();
  console.error("[fetch-articles] Fetching access token...");
  const accessToken = await fetchAccessToken(config.appId, config.appSecret);

  console.error("[fetch-articles] Fetching published articles...");
  const articles = await fetchPublishedArticles(accessToken, args.offset, args.count);
  console.error(`[fetch-articles] Fetched ${articles.length} articles`);

  let output: string;
  
  switch (args.format) {
    case "html":
      output = formatArticlesForFooter(articles, args.account);
      break;
    case "markdown":
      output = articles.map((a, i) => `${i + 1}. [${a.title}](${a.url})`).join("\n");
      break;
    case "json":
    default:
      output = JSON.stringify(articles, null, 2);
  }

  if (args.output) {
    fs.writeFileSync(args.output, output, "utf-8");
    console.error(`[fetch-articles] Saved to: ${args.output}`);
  } else {
    console.log(output);
  }
}

await main().catch((err) => {
  console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});

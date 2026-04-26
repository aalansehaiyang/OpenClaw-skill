#!/usr/bin/env npx tsx

/**
 * 阿里云通义万相图片生成脚本
 * 使用 DashScope API 生成图片
 */

import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import http from 'node:http';

interface GenerateOptions {
  prompt: string;
  style?: string;
  size?: string;
  count?: number;
  output?: string;
  seed?: number;
  apiKey?: string;
}

interface ImageResult {
  url: string;
  localPath: string;
  prompt: string;
  seed: number;
}

interface GenerateResponse {
  success: boolean;
  images: ImageResult[];
  usage: {
    imagesGenerated: number;
    cost: number;
  };
  error?: string;
}

// Qwen-Image-2.0 支持的风格（用于 prompt 扩展）
const STYLE_MAP: Record<string, string> = {
  'auto': '',
  '3d-cartoon': '3D 卡通风格',
  'anime': '动漫风格',
  'oil-painting': '油画风格',
  'watercolor': '水彩画风格',
  'sketch': '素描风格',
  'chinese-painting': '中国国画风格',
  'flat-illustration': '扁平插画风格',
  'photography': '摄影风格',
  'portrait': '人像摄影风格',
};

// 默认模型
const DEFAULT_MODEL = 'qwen-image-2.0-pro';

// 尺寸选项
const SIZE_OPTIONS = [
  '1024*1024',
  '720*1280',
  '1280*720',
  '840*1260',
  '1260*840',
];

function loadApiKey(): string {
  // 1. 环境变量
  if (process.env.DASHSCOPE_API_KEY) {
    return process.env.DASHSCOPE_API_KEY;
  }

  // 2. 项目级 .env
  const projectEnv = path.join(process.cwd(), '.baoyu-skills/.env');
  if (fs.existsSync(projectEnv)) {
    const content = fs.readFileSync(projectEnv, 'utf-8');
    const match = content.match(/DASHSCOPE_API_KEY=(.+)/);
    if (match) return match[1]!.trim();
  }

  // 3. 用户级 .env
  const userEnv = path.join(process.env.HOME || '', '.baoyu-skills/.env');
  if (fs.existsSync(userEnv)) {
    const content = fs.readFileSync(userEnv, 'utf-8');
    const match = content.match(/DASHSCOPE_API_KEY=(.+)/);
    if (match) return match[1]!.trim();
  }

  throw new Error('DASHSCOPE_API_KEY not found. Set it in environment or ~/.baoyu-skills/.env');
}

function downloadImage(url: string, destPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(destPath);

    const request = protocol.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        const redirectUrl = response.headers.location;
        if (redirectUrl) {
          file.close();
          fs.unlinkSync(destPath);
          downloadImage(redirectUrl, destPath).then(resolve).catch(reject);
          return;
        }
      }

      if (response.statusCode !== 200) {
        file.close();
        fs.unlink(destPath, () => {});
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }

      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    });

    request.on('error', (err) => {
      file.close();
      fs.unlink(destPath, () => {});
      reject(err);
    });

    request.setTimeout(30000, () => {
      request.destroy();
      reject(new Error('Download timeout'));
    });
  });
}

async function callDashScopeAPI(options: GenerateOptions): Promise<GenerateResponse> {
  const apiKey = options.apiKey || loadApiKey();
  
  // Step 1: Submit task
  const taskId = await submitTask(apiKey, options);
  
  // Check if synchronous response
  if (taskId.startsWith('SYNC:')) {
    console.log(`[ali-image] Processing synchronous response`);
    const syncResult = JSON.parse(taskId.slice(5));
    return processSyncResult(syncResult, options);
  }
  
  console.log(`[ali-image] Task submitted: ${taskId}`);
  
  // Step 2: Poll for result
  const result = await pollTaskResult(apiKey, taskId, options);
  return result;
}

async function processSyncResult(result: any, options: GenerateOptions): Promise<GenerateResponse> {
  if (result.output?.choices && result.output.choices.length > 0) {
    const images: ImageResult[] = [];
    const outputDir = options.output || './ali-image-output';
    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    for (const choice of result.output.choices) {
      // Qwen-Image-2.0 响应格式：choices[].message.content[0].image
      const content = choice.message?.content?.[0];
      const url = content?.image;
      
      if (!url) {
        console.warn(`[ali-image] Warning: No image URL in choice: ${JSON.stringify(choice)}`);
        continue;
      }
      
      const seed = result.output.seed || options.seed || 0;
      const timestamp = Date.now();
      const localPath = path.join(outputDir, `image_${timestamp}_${images.length + 1}.png`);
      
      await downloadImage(url, localPath);
      
      images.push({
        url,
        localPath,
        prompt: options.prompt,
        seed,
      });
    }

    return {
      success: true,
      images,
      usage: {
        imagesGenerated: images.length,
        cost: images.length * 0.08,
      },
    };
  }
  
  return {
    success: false,
    images: [],
    usage: { imagesGenerated: 0, cost: 0 },
    error: 'No results in sync response',
  };
}

async function submitTask(apiKey: string, options: GenerateOptions): Promise<string> {
  return new Promise((resolve, reject) => {
    // 构建风格提示词
    const stylePrompt = STYLE_MAP[options.style || 'auto'] || '';
    const fullPrompt = stylePrompt ? `${options.prompt}，${stylePrompt}` : options.prompt;
    
    // Qwen-Image-2.0 API 格式（多模态生成）
    const postData = JSON.stringify({
      model: DEFAULT_MODEL,
      input: {
        messages: [
          {
            role: 'user',
            content: [
              {
                text: fullPrompt
              }
            ]
          }
        ]
      },
      parameters: {
        n: options.count || 1,
        negative_prompt: '',
        prompt_extend: true,
        watermark: false,
        size: options.size || '1024*1024',
        seed: options.seed || Math.floor(Math.random() * 1000000),
      },
    });

    console.log(`[ali-image] Submitting to API...`);

    const reqOptions = {
      hostname: 'dashscope.aliyuncs.com',
      port: 443,
      path: '/api/v1/services/aigc/multimodal-generation/generation',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const req = https.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        console.log(`[ali-image] Status: ${res.statusCode}`);
        console.log(`[ali-image] Response: ${data}`);
        
        try {
          const result = JSON.parse(data);
          
          if (res.statusCode !== 200) {
            reject(new Error(`API ${res.statusCode}: ${result.message || result.code || 'Unknown error'}`));
            return;
          }
          
          // 同步响应：直接返回图片
          if (result.output?.choices && result.output.choices.length > 0) {
            resolve('SYNC:' + JSON.stringify(result));
          }
          // 错误
          else if (result.message) {
            reject(new Error(result.message));
          }
          // 未知格式
          else {
            reject(new Error(`Unexpected response: ${JSON.stringify(result)}`));
          }
        } catch (err) {
          reject(new Error(`Parse failed: ${err instanceof Error ? err.message : String(err)}`));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Timeout'));
    });

    req.write(postData);
    req.end();
  });
}

async function pollTaskResult(apiKey: string, taskId: string, options: GenerateOptions): Promise<GenerateResponse> {
  const maxAttempts = 60;  // 最多 60 次尝试
  const baseInterval = 1000; // 基础间隔 1 秒
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    // 指数退避：1s, 2s, 3s, 4s, 5s, 5s, 5s...
    const delay = Math.min(baseInterval * attempt, 5000);
    await new Promise(resolve => setTimeout(resolve, delay));
    
    const result = await getTaskResult(apiKey, taskId, options);
    if (result) {
      return result;
    }
    
    if (attempt % 5 === 0) {
      console.log(`[ali-image] Still processing... ${attempt}s elapsed`);
    }
  }
  
  throw new Error(`Task timeout after ${maxAttempts} attempts. The task may still be processing.`);
}

async function getTaskResult(apiKey: string, taskId: string, options: GenerateOptions): Promise<GenerateResponse | null> {
  return new Promise((resolve, reject) => {
    const reqOptions = {
      hostname: 'dashscope.aliyuncs.com',
      port: 443,
      path: `/api/v1/tasks/${taskId}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    };

    const req = https.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', async () => {
        try {
          const result = JSON.parse(data);
          const taskStatus = result.output?.task_status;
          
          if (taskStatus === 'SUCCEEDED') {
            const images: ImageResult[] = [];
            const outputDir = options.output || './ali-image-output';
            
            if (!fs.existsSync(outputDir)) {
              fs.mkdirSync(outputDir, { recursive: true });
            }

            // 兼容不同的响应格式
            const results = result.output.results || 
                           (result.output.choices ? [result.output.choices] : []) ||
                           [];
            
            if (results.length === 0) {
              resolve({
                success: false,
                images: [],
                usage: { imagesGenerated: 0, cost: 0 },
                error: 'No images in successful task response',
              });
              return;
            }
            
            for (const imgResult of results) {
              // 兼容不同的 URL 字段
              const url = imgResult.url || 
                         (imgResult.image && imgResult.image.url) ||
                         (imgResult.img && imgResult.img.url);
              
              if (!url) {
                console.warn(`[ali-image] Warning: No URL found in result: ${JSON.stringify(imgResult)}`);
                continue;
              }
              
              const seed = result.output.seed || options.seed || 0;
              const timestamp = Date.now();
              const localPath = path.join(outputDir, `image_${timestamp}_${images.length + 1}.png`);
              
              await downloadImage(url, localPath);
              
              images.push({
                url,
                localPath,
                prompt: options.prompt,
                seed,
              });
            }

            resolve({
              success: true,
              images,
              usage: {
                imagesGenerated: images.length,
                cost: images.length * 0.08,
              },
            });
          } else if (taskStatus === 'FAILED') {
            const errorMsg = result.output?.message || 
                            result.output?.error?.message || 
                            result.message || 
                            'Unknown task failure';
            resolve({
              success: false,
              images: [],
              usage: { imagesGenerated: 0, cost: 0 },
              error: `Task failed: ${errorMsg}`,
            });
          } else if (taskStatus === 'PENDING' || taskStatus === 'RUNNING' || taskStatus === 'SCHEDULED') {
            // 任务仍在处理中
            resolve(null);
          } else {
            console.warn(`[ali-image] Unknown task status: ${taskStatus}`);
            resolve(null);
          }
        } catch (err) {
          reject(err);
        }
      });
    });

    req.on('error', (err) => {
      reject(new Error(`Failed to poll task result: ${err instanceof Error ? err.message : String(err)}`));
    });

    req.end();
  });
}

function printUsage(): void {
  console.log(`阿里云通义万相图片生成

Usage:
  npx -y bun generate.ts --prompt "描述文本" [options]

Options:
  --prompt <text>     图片描述文本（必需）
  --style <name>      风格预设：auto, cyberpunk, anime, realistic, oil-painting, watercolor, sketch, chinese-painting
  --size <size>       图片尺寸：1024*1024, 720*1280, 1280*720, 840*1260, 1260*840
  --count <n>         生成数量（1-4，默认 1）
  --output <dir>      输出目录（默认 ./ali-image-output/）
  --seed <num>        随机种子（可复现结果）
  --help              显示帮助

Examples:
  npx -y bun generate.ts --prompt "一只可爱的猫咪"
  npx -y bun generate.ts --prompt "未来科技城市" --style cyberpunk --count 2
  npx -y bun generate.ts --prompt "山水画" --style chinese-painting --size 1280*720

Pricing:
  通义万相 2.0: ¥0.08/张（标准分辨率）
`);
}

function parseArgs(args: string[]): Partial<GenerateOptions> {
  const options: Partial<GenerateOptions> = {};
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (!arg) continue;
    
    switch (arg) {
      case '--prompt':
        options.prompt = args[++i];
        break;
      case '--style':
        options.style = args[++i];
        break;
      case '--size':
        options.size = args[++i];
        break;
      case '--count':
        options.count = parseInt(args[++i] || '1', 10);
        break;
      case '--output':
        options.output = args[++i];
        break;
      case '--seed':
        options.seed = parseInt(args[++i] || '0', 10);
        break;
      case '--help':
      case '-h':
        printUsage();
        process.exit(0);
    }
  }
  
  return options;
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    printUsage();
    process.exit(1);
  }
  
  const options = parseArgs(args);
  
  if (!options.prompt) {
    console.error('Error: --prompt is required');
    process.exit(1);
  }
  
  if (options.size && !SIZE_OPTIONS.includes(options.size)) {
    console.error(`Error: Invalid size. Choose from: ${SIZE_OPTIONS.join(', ')}`);
    process.exit(1);
  }
  
  if (options.count && (options.count < 1 || options.count > 4)) {
    console.error('Error: --count must be between 1 and 4');
    process.exit(1);
  }
  
  console.log(`[ali-image] Generating image with prompt: ${options.prompt}`);
  if (options.style) console.log(`[ali-image] Style: ${options.style}`);
  if (options.size) console.log(`[ali-image] Size: ${options.size}`);
  if (options.count) console.log(`[ali-image] Count: ${options.count}`);
  
  try {
    const result = await callDashScopeAPI(options as GenerateOptions);
    
    if (result.success) {
      console.log('\n✅ Image generation complete!');
      console.log(`\nGenerated ${result.images.length} image(s):`);
      for (const img of result.images) {
        console.log(`  • ${img.localPath}`);
      }
      console.log(`\nCost: ¥${result.usage.cost.toFixed(2)}`);
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.error(`\n❌ Generation failed: ${result.error}`);
      process.exit(1);
    }
  } catch (err) {
    console.error(`\n❌ Error: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(`Fatal error: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});

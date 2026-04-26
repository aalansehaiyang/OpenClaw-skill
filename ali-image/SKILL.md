---
name: ali-image
description: Generate images using Alibaba Cloud Qwen Image (通义万相) API. Supports text-to-image generation with various styles and aspect ratios.
version: 1.0.0
metadata:
  openclaw:
    homepage: https://github.com/JimLiu/baoyu-skills
    requires:
      anyBins:
        - bun
        - npx
---

# Ali Image - 阿里云通义万相图片生成

## Language

**Match user's language**: Respond in the same language the user uses.

## Script Directory

**Agent Execution**: Determine this SKILL.md directory as `{baseDir}`, then use `{baseDir}/scripts/<name>.ts`. Resolve `${BUN_X}` runtime: if `bun` installed → `bun`; if `npx` available → `npx -y bun`; else suggest installing bun.

| Script | Purpose |
|--------|---------|
| `scripts/generate.ts` | Generate images from text prompts |

## API Configuration

### Environment Variables

Store API credentials in one of these locations (priority order):

1. Environment variable: `DASHSCOPE_API_KEY`
2. Project-level: `.baoyu-skills/.env`
3. User-level: `~/.baoyu-skills/.env`

### Setup

```bash
# Check if API key exists
test -f ~/.baoyu-skills/.env && grep -q "DASHSCOPE_API_KEY" ~/.baoyu-skills/.env && echo "Found"

# If not found, create it
echo "DASHSCOPE_API_KEY=sk-xxxxxxxx" >> ~/.baoyu-skills/.env
```

### API Key

- **Current API Key**: `sk-ce56676a480649ff8d89ba8a965fe3cb` (configured)
- **Default Model**: `qwen-image-2.0` (通义万相 Qwen-Image-2.0)
- **Endpoint**: Alibaba Cloud DashScope API

## Usage

### Basic Image Generation

```bash
${BUN_X} {baseDir}/scripts/generate.ts --prompt "一只可爱的猫咪在阳光下玩耍"
```

### With Options

```bash
${BUN_X} {baseDir}/scripts/generate.ts \
  --prompt "未来科技城市，霓虹灯，赛博朋克风格" \
  --style "cyberpunk" \
  --size "1024*1024" \
  --count 2 \
  --output ./images/
```

### Options

| Option | Default | Description |
|--------|---------|-------------|
| `--prompt` | (required) | 图片描述文本 |
| `--style` | `<auto>` | 风格预设（见下方） |
|--size` | `1024*1024` | 图片尺寸 |
| `--count` | `1` | 生成数量（1-4） |
| `--output` | `./ali-image-output/` | 输出目录 |
| `--seed` | `<random>` | 随机种子（可复现） |

### Size Options

- `1024*1024` - 正方形（默认）
- `720*1280` - 竖版（9:16）
- `1280*720` - 横版（16:9）
- `840*1260` - 竖版（2:3）
- `1260*840` - 横版（3:2）

### Style Presets

| Style | Description |
|-------|-------------|
| `<auto>` | 自动（默认） |
| `3d-cartoon` | 3D 卡通 |
| `anime` | 动漫 |
| `oil-painting` | 油画 |
| `watercolor` | 水彩 |
| `sketch` | 素描 |
| `chinese-painting` | 国画 |
| `flat-illustration` | 扁平插画 |
| `photography` | 摄影 |
| `portrait` | 人像 |

## Output

```json
{
  "success": true,
  "images": [
    {
      "url": "https://...",
      "localPath": "./output/image_1.png",
      "prompt": "原始提示词",
      "seed": 12345
    }
  ],
  "usage": {
    "imagesGenerated": 1,
    "cost": 0.08
  }
}
```

## Pricing

- **通义万相 2.0**: ¥0.08/张（标准分辨率）
- **高分辨率**: ¥0.12/张
- **批量生成**: 按实际数量计费

## Error Handling

| Error | Solution |
|-------|----------|
| `InvalidApiKey` | 检查 DASHSCOPE_API_KEY 配置 |
| `InvalidPrompt` | 提示词包含敏感词，修改描述 |
| `RateLimitExceeded` | 等待后重试，或降低并发 |
| `InsufficientBalance` | 充值阿里云账户 |
| `AccessDenied` | API 密钥权限不足，检查百炼控制台 |
| `Task timeout` | 任务处理超时，可重试或减少图片数量 |

## Known Issues & Fixes

### 问题 1: "Model not exist"
**原因**: 模型名称错误  
**解决**: 使用 `wanx-v1` 而非 `wanx2.0`

### 问题 2: "current user api does not support synchronous calls"
**原因**: 免费账户不支持同步调用  
**解决**: 使用异步模式（`X-DashScope-Async: enable`）+ 轮询任务状态

### 问题 3: 任务超时
**原因**: 图片生成时间较长  
**解决**: 已优化轮询逻辑（指数退避，最长 60 秒）

## Best Practices

1. **提示词优化**: 详细描述场景、风格、色彩、构图
2. **批量生成**: 一次生成 2-4 张，选择最佳
3. **风格指定**: 明确风格可获得更一致的结果
4. **保存种子**: 记录 seed 值便于复现

## Example Prompts

```
# 风景
"日出时分的雪山，金色阳光，云海，超现实主义，8K 高清"

# 人物
"穿着汉服的古代女子，江南园林背景，柔美光线，写实风格"

# 动物
"森林中的小鹿，晨雾，梦幻光影，宫崎骏风格"

# 科技
"未来太空站内部，全息屏幕，蓝色调，赛博朋克"
```

## References

- [阿里云百炼控制台](https://bailian.console.aliyun.com/)
- [通义万相 API 文档](https://help.aliyun.com/zh/dashscope/)
- [模型详情](https://bailian.console.aliyun.com/cn-beijing/?tab=model#/model-market/detail/qwen-image-2.0)

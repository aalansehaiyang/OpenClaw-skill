#!/usr/bin/env bash
# weixin_content_to_feishu — 下载微信公众号文章并上传到飞书文档（含图片）
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
WEB_DOWNLOAD_SCRIPT="${SCRIPT_DIR}/../web-content-download/scripts/web-content-download.sh"
if [[ ! -f "$WEB_DOWNLOAD_SCRIPT" ]]; then
  WEB_DOWNLOAD_SCRIPT="$HOME/.claude/skills/web-content-download/scripts/web-content-download.sh"
fi
if [[ ! -f "$WEB_DOWNLOAD_SCRIPT" ]]; then
  echo "错误: 找不到 web-content-download 脚本" >&2
  exit 1
fi

# ─── 参数解析 ──────────────────────────────────────────────
WEIXIN_URL=""
FEISHU_DOC_URL=""
QUIET=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --help|-h)
      echo "用法: weixin_content_to_feishu.sh <微信公众号文章URL> <飞书文档URL或token>"
      echo ""
      echo "示例:"
      echo "  weixin_content_to_feishu.sh 'https://mp.weixin.qq.com/s/xxx' 'https://xxx.feishu.cn/wiki/xxx'"
      echo "  weixin_content_to_feishu.sh 'https://mp.weixin.qq.com/s/xxx' 'doxcnXXXX'"
      exit 0
      ;;
    -q|--quiet) QUIET=true; shift ;;
    *)
      if [[ -z "$WEIXIN_URL" ]]; then
        WEIXIN_URL="$1"
      elif [[ -z "$FEISHU_DOC_URL" ]]; then
        FEISHU_DOC_URL="$1"
      else
        echo "错误: 多余的参数 '$1'" >&2
        exit 1
      fi
      shift
      ;;
  esac
done

if [[ -z "$WEIXIN_URL" || -z "$FEISHU_DOC_URL" ]]; then
  echo "错误: 缺少参数" >&2
  echo "用法: weixin_content_to_feishu.sh <微信公众号文章URL> <飞书文档URL或token>" >&2
  exit 1
fi

# ─── 步骤 1: 下载微信公众号文章 ───────────────────────────
if [[ "$QUIET" != true ]]; then
  echo "[1/4] 下载微信公众号文章..."
fi

DOWNLOAD_OUTPUT=$("$WEB_DOWNLOAD_SCRIPT" "$WEIXIN_URL" 2>&1)
if [[ $? -ne 0 ]]; then
  echo "错误: 下载失败" >&2
  [[ "$QUIET" != true ]] && echo "$DOWNLOAD_OUTPUT" >&2
  exit 1
fi

DOWNLOAD_DIR=$(echo "$DOWNLOAD_OUTPUT" | grep "^Downloaded to:" | sed 's/^Downloaded to: //')
if [[ -z "$DOWNLOAD_DIR" ]]; then
  echo "错误: 无法提取下载目录" >&2
  exit 1
fi

ARTICLE_FILE="${DOWNLOAD_DIR}/article.md"
IMAGES_DIR="${DOWNLOAD_DIR}/images"
if [[ ! -f "$ARTICLE_FILE" ]]; then
  echo "错误: 找不到文章文件: $ARTICLE_FILE" >&2
  exit 1
fi

# 统计图片数量
IMG_COUNT=0
if [[ -d "$IMAGES_DIR" ]]; then
  IMG_COUNT=$(find "$IMAGES_DIR" -name 'img_*.jpg' -o -name 'img_*.png' -o -name 'img_*.webp' 2>/dev/null | wc -l | tr -d ' ')
fi

[[ "$QUIET" != true ]] && echo "[1/4] 下载完成: ${IMG_COUNT} 张图片"

# ─── 步骤 2: 添加图片占位符并上传内容 ─────────────────────
TEMP_ARTICLE=$(mktemp ./article_XXXXXX.md)
IMG_COUNT=$(python3 - "$ARTICLE_FILE" "$TEMP_ARTICLE" << 'PYEOF'
import sys, re
md_path, out_path = sys.argv[1], sys.argv[2]
with open(md_path, "r") as f:
    content = f.read()
idx = 0
def replace_img(m):
    global idx
    idx += 1
    return f"[FEISHU_IMG_{idx}]"
content = re.sub(r'!\[[^\]]*\]\(\./images/img_\d+\.(?:jpg|png|webp)\)', replace_img, content)
with open(out_path, "w") as f:
    f.write(content)
print(idx)
PYEOF
)

# 提取标题
TITLE=$(head -1 "$TEMP_ARTICLE" | sed 's/^#\s*//')
[[ -z "$TITLE" || "$TITLE" == "Untitled" ]] && TITLE="untitled"

# 在标题后插入原文链接
{
  head -1 "$TEMP_ARTICLE"
  echo ""
  echo "原文：${WEIXIN_URL}"
  echo ""
  tail -n +2 "$TEMP_ARTICLE"
} > "${TEMP_ARTICLE}.tmp"
mv "${TEMP_ARTICLE}.tmp" "$TEMP_ARTICLE"

if [[ "$QUIET" != true ]]; then
  echo "[2/4] 上传文章内容..."
fi

UPDATE_OUTPUT=$(lark-cli docs +update --api-version v2 \
  --doc "$FEISHU_DOC_URL" --command overwrite --doc-format markdown \
  --content @"$TEMP_ARTICLE" 2>&1)
rm -f "$TEMP_ARTICLE"

if [[ $? -ne 0 ]]; then
  echo "错误: 上传内容失败" >&2
  echo "$UPDATE_OUTPUT" >&2
  exit 1
fi

DOC_ID="${FEISHU_DOC_URL}"

# 修复标题
lark-cli docs +update --api-version v2 \
  --doc "$DOC_ID" --command str_replace \
  --pattern "Untitled" --content "$TITLE" >/dev/null 2>&1 || true

# ─── 步骤 3: 上传图片并定位 ───────────────────────────────
# Count actual image markers
ACTUAL_IMG_COUNT=$(grep -o '\[FEISHU_IMG_[0-9]*\]' "$ARTICLE_FILE" 2>/dev/null | wc -l | tr -d ' ')

if [[ "$ACTUAL_IMG_COUNT" -gt 0 && -d "$IMAGES_DIR" ]]; then
  if [[ "$QUIET" != true ]]; then
    echo "[3/4] 上传 $ACTUAL_IMG_COUNT 张图片..."
  fi

  # 复制图片到当前目录
  cp "$IMAGES_DIR"/img_*.jpg ./ 2>/dev/null || true
  cp "$IMAGES_DIR"/img_*.png ./ 2>/dev/null || true
  cp "$IMAGES_DIR"/img_*.webp ./ 2>/dev/null || true

  # 获取文档 block IDs 并定位占位符
  python3 - "$DOC_ID" "$ACTUAL_IMG_COUNT" << 'PYEOF'
import sys, subprocess, json, re, os

doc_url = sys.argv[1]
img_count = int(sys.argv[2])

# Fetch doc with IDs
result = subprocess.run(
    ["lark-cli", "docs", "+fetch", "--api-version", "v2", "--doc", doc_url, "--detail", "with-ids"],
    capture_output=True, text=True
)
content = json.loads(result.stdout).get("data", {}).get("document", {}).get("content", "")

# Find placeholder block IDs
placeholders = {}
for i in range(1, img_count + 1):
    marker = f"FEISHU_IMG_{i}"
    idx = content.find(marker)
    if idx < 0:
        continue
    # Find surrounding block
    start = max(0, idx - 500)
    segment = content[start:idx + 50]
    # Find the block id containing this marker
    block_id = None
    for m in re.finditer(r'<(?:p|li|td|h[1-6])[^>]*id="([^"]+)"', segment):
        block_id = m.group(1)
    if block_id:
        placeholders[i] = block_id

    # Also find the preceding block (anchor for insertion)
    # Look for the block BEFORE this one
    before_id = None
    before_pattern = r'<(?:p|li|td|h[1-6]|blockquote|hr|table|ul|ol|title)[^>]*id="([^"]+)"'
    for m in re.finditer(before_pattern, content[:idx]):
        bid = m.group(1)
        if bid != block_id:
            before_id = bid
    placeholders[f"before_{i}"] = before_id

# Upload images and move to position
for i in range(1, img_count + 1):
    img_file = f"./img_{i:03d}.jpg"
    if not os.path.exists(img_file):
        img_file = f"./img_{i:03d}.png"
    if not os.path.exists(img_file):
        img_file = f"./img_{i:03d}.webp"
    if not os.path.exists(img_file):
        continue

    block_id = placeholders.get(i)
    before_id = placeholders.get(f"before_{i}")

    # Upload image
    result = subprocess.run(
        ["lark-cli", "docs", "+media-insert", "--doc", doc_url,
         "--file", img_file, "--width", "800", "--align", "center"],
        capture_output=True, text=True
    )
    data = json.loads(result.stdout)
    img_block = data.get("data", {}).get("block_id", "")
    if not img_block:
        continue

    # Move image to correct position
    if block_id:
        subprocess.run(
            ["lark-cli", "docs", "+update", "--api-version", "v2", "--doc", doc_url,
             "--command", "block_move_after", "--block-id", block_id,
             "--src-block-ids", img_block],
            capture_output=True, text=True
        )
    elif before_id:
        subprocess.run(
            ["lark-cli", "docs", "+update", "--api-version", "v2", "--doc", doc_url,
             "--command", "block_move_after", "--block-id", before_id,
             "--src-block-ids", img_block],
            capture_output=True, text=True
        )

    # Remove placeholder block - try block_delete first (cleaner), fallback to str_replace
    res = subprocess.run(
        ["lark-cli", "docs", "+update", "--api-version", "v2", "--doc", doc_url,
         "--command", "block_delete", "--block-id", block_id],
        capture_output=True, text=True
    )
    if res.returncode != 0:
        subprocess.run(
            ["lark-cli", "docs", "+update", "--api-version", "v2", "--doc", doc_url,
             "--command", "str_replace", "--pattern", f"[FEISHU_IMG_{i}]", "--content", ""],
            capture_output=True, text=True
        )

    print(f"  Image {i}: positioned and placeholder cleaned")
PYEOF
fi

# ─── 步骤 4: 清理 ─────────────────────────────────────────
rm -f ./img_*.jpg ./img_*.png ./img_*.webp 2>/dev/null || true

if [[ "$QUIET" != true ]]; then
  echo "[4/4] 上传完成"
  DOC_FINAL_URL=$(echo "$UPDATE_OUTPUT" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    print(d.get('data',{}).get('document',{}).get('url',''))
except: print('')
")
  [[ -n "$DOC_FINAL_URL" ]] && echo "文档地址: $DOC_FINAL_URL"
  echo "Done"
fi

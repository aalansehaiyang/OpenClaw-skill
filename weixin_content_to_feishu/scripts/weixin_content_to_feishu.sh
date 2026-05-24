#!/usr/bin/env bash
# weixin_content_to_feishu — 下载微信公众号文章并上传到飞书文档
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# Try sibling web-content-download first, then fall back to ~/.claude/skills/
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
  echo "[1/3] 下载微信公众号文章..."
fi

DOWNLOAD_OUTPUT=$("$WEB_DOWNLOAD_SCRIPT" "$WEIXIN_URL" 2>&1)
DOWNLOAD_STATUS=$?
if [[ $DOWNLOAD_STATUS -ne 0 ]]; then
  echo "错误: 下载失败 (exit code $DOWNLOAD_STATUS)" >&2
  if [[ "$QUIET" != true ]]; then
    echo "$DOWNLOAD_OUTPUT" >&2
  fi
  exit 1
fi

# 提取文章输出目录
DOWNLOAD_DIR=$(echo "$DOWNLOAD_OUTPUT" | grep "^Downloaded to:" | sed 's/^Downloaded to: //')
if [[ -z "$DOWNLOAD_DIR" ]]; then
  echo "错误: 无法提取下载目录" >&2
  exit 1
fi

ARTICLE_FILE="${DOWNLOAD_DIR}/article.md"
if [[ ! -f "$ARTICLE_FILE" ]]; then
  echo "错误: 找不到下载的文章文件: $ARTICLE_FILE" >&2
  exit 1
fi

if [[ "$QUIET" != true ]]; then
  echo "[1/3] 下载完成: $DOWNLOAD_DIR"
fi

# ─── 步骤 2: 将文章复制到临时目录供 lark-cli 读取 ─────────
TEMP_ARTICLE=$(mktemp ./article_XXXXXX.md)
cp "$ARTICLE_FILE" "$TEMP_ARTICLE"

if [[ "$QUIET" != true ]]; then
  echo "[2/3] 提取文章标题并上传到飞书文档..."
fi

# ─── 步骤 3: 提取标题并上传到飞书文档 ─────────────────────
# 提取 Markdown 第一行作为标题
TITLE=$(head -1 "$TEMP_ARTICLE" | sed 's/^#\s*//')
if [[ -z "$TITLE" || "$TITLE" == "Untitled" ]]; then
  TITLE="untitled"
fi

# 先 overwrite 写入内容
UPDATE_OUTPUT=$(lark-cli docs +update --api-version v2 \
  --doc "$FEISHU_DOC_URL" \
  --command overwrite \
  --doc-format markdown \
  --content @"$TEMP_ARTICLE" 2>&1)
UPDATE_STATUS=$?
rm -f "$TEMP_ARTICLE"

if [[ $UPDATE_STATUS -ne 0 ]]; then
  echo "错误: 上传到飞书文档失败" >&2
  echo "$UPDATE_OUTPUT" >&2
  exit 1
fi

# 提取文档 URL
DOC_URL=$(echo "$UPDATE_OUTPUT" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print(data.get('data', {}).get('document', {}).get('url', ''))
except:
    print('')
" 2>/dev/null)

# 修复标题
if [[ "$TITLE" != "untitled" ]]; then
  lark-cli docs +update --api-version v2 \
    --doc "$FEISHU_DOC_URL" \
    --command str_replace \
    --pattern "Untitled" \
    --content "$TITLE" >/dev/null 2>&1 || true
fi

if [[ "$QUIET" != true ]]; then
  echo "[3/3] 上传完成"
  if [[ -n "$DOC_URL" ]]; then
    echo "文档地址: $DOC_URL"
  fi
  echo "Done"
fi

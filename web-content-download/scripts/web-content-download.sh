#!/usr/bin/env bash
# Web Content Download - 网页内容下载器
# Downloads clean Markdown from any web page with optional images
# 
# Usage:
#   ./web-content-download.sh <url> [max_chars] [--download-images] [--output-dir ./images]
#
# Examples:
#   ./web-content-download.sh "https://mp.weixin.qq.com/s/xxxxx"
#   ./web-content-download.sh "https://example.com/article" 15000
#   ./web-content-download.sh "https://example.com" 30000 --download-images

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PYTHON_SCRIPT="$SCRIPT_DIR/web-content-download.py"

# Default character limit
MAX_CHARS="${2:-30000}"

# Check for URL argument
if [ -z "${1:-}" ]; then
  echo "Usage: $0 <url> [max_chars] [--download-images] [--output-dir ./images]" >&2
  echo "" >&2
  echo "Extract clean Markdown from any web page using Scrapling." >&2
  echo "" >&2
  echo "Arguments:" >&2
  echo "  url            URL to fetch (e.g., https://mp.weixin.qq.com/s/xxx)" >&2
  echo "  max_chars      Maximum characters (default: 30000)" >&2
  echo "  --download-images  Download images locally" >&2
  echo "  --output-dir   Image output directory (default: ./images)" >&2
  echo "" >&2
  echo "Examples:" >&2
  echo "  $0 \"https://mp.weixin.qq.com/s/xxxxx\"" >&2
  echo "  $0 \"https://example.com/article\" 15000" >&2
  echo "  $0 \"https://example.com\" 30000 --download-images" >&2
  exit 1
fi

URL="$1"

# Check if Python script exists
if [ ! -f "$PYTHON_SCRIPT" ]; then
  echo "Error: Python script not found at $PYTHON_SCRIPT" >&2
  exit 1
fi

# Check if dependencies are installed
if ! python3 -c "import scrapling" 2>/dev/null; then
  echo "Error: scrapling not installed." >&2
  echo "" >&2
  echo "Install with (use official PyPI, NOT Tsinghua mirror):" >&2
  echo "  pip install -i https://pypi.org/simple git+https://github.com/D4Vinci/Scrapling.git html2text" >&2
  echo "" >&2
  echo "Or use the one-click installer:" >&2
  echo "  ./install.sh" >&2
  exit 1
fi

# Detect WeChat MP URLs
if [[ "$URL" == *"mp.weixin.qq.com"* ]]; then
  echo "# Using web-content-download for WeChat MP article" >&2
fi

# Default to --save mode if no output redirect
# Check if stdout is a terminal (not redirected)
if [ -t 1 ]; then
  # Interactive mode: auto-save to file
  python3 "$PYTHON_SCRIPT" "$URL" "${@:2}" --save
else
  # Redirected mode: legacy behavior (output to stdout)
  python3 "$PYTHON_SCRIPT" "$URL" "${@:2}"
fi

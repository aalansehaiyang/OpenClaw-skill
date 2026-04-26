#!/bin/bash
#
# 测试获取公众号最新文章功能
#
# 使用方法:
#   ./test-fetch-articles.sh
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🧪 测试获取公众号最新文章功能"
echo ""

# 检查环境变量
ENV_PATHS=(
    "$(pwd)/.baoyu-skills/.env"
    "$HOME/.baoyu-skills/.env"
)

ENV_FOUND=false
for env_path in "${ENV_PATHS[@]}"; do
    if [ -f "$env_path" ] && grep -q "WECHAT_APP_ID" "$env_path"; then
        echo "✅ 检测到微信公众号 API 配置：$env_path"
        ENV_FOUND=true
        break
    fi
done

if [ "$ENV_FOUND" = false ]; then
    echo "❌ 未检测到微信公众号 API 配置"
    echo ""
    echo "请先配置 API 凭证："
    echo "1. 访问 https://mp.weixin.qq.com"
    echo "2. 进入 开发 → 基本配置"
    echo "3. 复制 AppID 和 AppSecret"
    echo "4. 创建配置文件："
    echo "   mkdir -p ~/.baoyu-skills"
    echo "   cat > ~/.baoyu-skills/.env << EOF"
    echo "   WECHAT_APP_ID=你的 AppID"
    echo "   WECHAT_APP_SECRET=你的 AppSecret"
    echo "   EOF"
    echo ""
    exit 1
fi

echo ""
echo "📋 测试 1: 获取最新 3 篇文章（JSON 格式）"
echo ""

npx -y bun "$SCRIPT_DIR/fetch-latest-articles.ts" --count 3 --format json

echo ""
echo "📋 测试 2: 获取最新 3 篇文章（HTML 格式）"
echo ""

npx -y bun "$SCRIPT_DIR/fetch-latest-articles.ts" --count 3 --format html --account "破局哥聊职场"

echo ""
echo "✅ 测试完成！"

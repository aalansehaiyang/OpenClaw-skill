#!/usr/bin/env bash
# Scrapling One-Click Installer
# Uses official PyPI (not Tsinghua mirror) to avoid setuptools issues

set -euo pipefail

PYPI_INDEX="https://pypi.org/simple"

echo "🦞 Installing Scrapling Web Content Extractor..."
echo ""

# Check Python version
PYTHON_VERSION=$(python3 --version 2>&1 | awk '{print $2}')
echo "✓ Python version: $PYTHON_VERSION"

# Step 1: Upgrade setuptools and wheel
echo ""
echo "Step 1/3: Upgrading setuptools and wheel..."
pip install -i "$PYPI_INDEX" --upgrade setuptools wheel >/dev/null 2>&1
echo "✓ Done"

# Step 2: Install scrapling from GitHub
echo ""
echo "Step 2/3: Installing scrapling from GitHub..."
if pip install -i "$PYPI_INDEX" git+https://github.com/D4Vinci/Scrapling.git 2>&1 | tee /tmp/scrapling_install.log | grep -q "Successfully installed"; then
  echo "✓ scrapling installed"
else
  # Fallback: clone and install locally
  echo "→ Direct install failed, trying local clone..."
  if [ ! -d /tmp/Scrapling ]; then
    git clone --depth 1 https://github.com/D4Vinci/Scrapling.git /tmp/Scrapling >/dev/null 2>&1
  fi
  cd /tmp/Scrapling
  pip install -i "$PYPI_INDEX" -e . >/dev/null 2>&1
  echo "✓ scrapling installed (local build)"
fi

# Step 3: Install html2text
echo ""
echo "Step 3/3: Installing html2text..."
pip install -i "$PYPI_INDEX" html2text >/dev/null 2>&1
echo "✓ html2text installed"

# Verify installation
echo ""
echo "Verifying installation..."
if python3 -c "from scrapling import Fetcher; import html2text" 2>/dev/null; then
  echo "✅ Installation successful!"
  echo ""
  echo "Usage:"
  echo "  ./scripts/scrapling-fetch.sh \"https://mp.weixin.qq.com/s/xxx\""
  echo ""
else
  echo "❌ Verification failed. Check /tmp/scrapling_install.log for details."
  exit 1
fi

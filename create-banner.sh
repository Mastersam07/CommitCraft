#!/bin/bash

# Create a 1280×640px marketplace banner for GitGenie
# Requires: ImageMagick (brew install imagemagick)

set -e

echo "🎨 Creating GitGenie marketplace banner (1280×640px)..."

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo "❌ ImageMagick not found!"
    echo "📦 Install with: brew install imagemagick"
    echo ""
    echo "Or use online tools:"
    echo "  • Canva: https://www.canva.com/"
    echo "  • Remove.bg resize: https://www.remove.bg/upload"
    echo ""
    echo "See CREATE_BANNER.md for more options"
    exit 1
fi

# Check if source icon exists
if [ ! -f "images/icon.png" ]; then
    echo "❌ images/icon.png not found!"
    echo "Please ensure you have the icon file first"
    exit 1
fi

# Create the banner
convert -size 1280x640 canvas:'#0D1117' \
  \( images/icon.png -resize 450x450 \) -gravity west -geometry +120+0 -composite \
  -font Helvetica-Bold -pointsize 80 -fill '#FFD700' \
  -gravity center -annotate +280-100 'GitGenie' \
  -pointsize 42 -fill '#E0AAFF' \
  -annotate +280-20 'AI-Powered Commit Messages' \
  -pointsize 32 -fill '#9CA3AF' \
  -annotate +280+40 'Rub the lamp, get perfect commits ✨' \
  -pointsize 28 -fill '#B8B8B8' \
  -annotate +280+100 '✨ 3 AI suggestions  •  🎯 Conventional commits  •  🧠 Learns your style' \
  images/banner.png

echo "✅ Banner created: images/banner.png"
echo "📏 Size: 1280×640px"
echo ""
echo "Next steps:"
echo "  1. Review: open images/banner.png"
echo "  2. Use as marketplace screenshot"
echo "  3. Optionally add to README.md"

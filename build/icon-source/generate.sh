#!/bin/bash
# RUNNERS 공용 화이트 · 블랙 판(1024 그림 안 824 판, 안쪽 그림 55%)에서 앱 아이콘 파일을 모두 만든다.
# 만드는 것: build/Assets.car(macOS 26, 기본 화이트 · 어두운 모양 블랙), build/icon.icns(그 전 macOS),
# build/icon.png(리눅스), build/icon.ico(Windows). 판 그림이 바뀌면 이 스크립트를 다시 돌리고 결과를 커밋한다.
set -euo pipefail

SOURCE_DIR="$(cd "$(dirname "$0")" && pwd)"
BUILD_DIR="$(dirname "$SOURCE_DIR")"
WHITE="$SOURCE_DIR/draw-white.png"
BLACK="$SOURCE_DIR/draw-black.png"
TMP_DIR=$(mktemp -d)
trap 'rm -rf "$TMP_DIR"' EXIT

# macOS 26 은 둥근 판 모양을 스스로 그리므로, icon.icon 에는 판을 그림 전체로 잘라 넣는다(Prompt 와 같음).
python3 -I - "$WHITE" "$BLACK" "$SOURCE_DIR/icon.icon/Assets" <<'PY'
import sys
from PIL import Image
for plate, kind in zip(sys.argv[1:3], ('white', 'black')):
    Image.open(plate).convert('RGBA').crop((100, 100, 924, 924)).resize((1024, 1024), Image.LANCZOS).save(f'{sys.argv[3]}/{kind}.png')
PY

# CI 맥에 Xcode 26 이 없어도 되게 Assets.car 는 여기서 만들어 저장소에 둔다.
xcrun actool --compile "$TMP_DIR" --platform macosx --minimum-deployment-target 10.12 \
  --app-icon icon --output-partial-info-plist "$TMP_DIR/partial.plist" "$SOURCE_DIR/icon.icon" >/dev/null
cp "$TMP_DIR/Assets.car" "$BUILD_DIR/Assets.car"

# 그 전 macOS 는 icon.icns 를 읽는다. 다른 맥 앱처럼 판 둘레 100 을 비운 그대로 둔다.
ICONSET="$TMP_DIR/icon.iconset"
mkdir "$ICONSET"
for size in 16 32 128 256 512; do
  sips -z "$size" "$size" "$WHITE" --out "$ICONSET/icon_${size}x${size}.png" >/dev/null
  sips -z $((size * 2)) $((size * 2)) "$WHITE" --out "$ICONSET/icon_${size}x${size}@2x.png" >/dev/null
done
iconutil -c icns "$ICONSET" -o "$BUILD_DIR/icon.icns"

cp "$WHITE" "$BUILD_DIR/icon.png"
python3 -I "$SOURCE_DIR/make-ico.py" "$WHITE" "$BUILD_DIR/icon.ico"

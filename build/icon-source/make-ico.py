# Windows 아이콘(icon.ico)을 만든다. Windows 에는 맥처럼 판 둘레 100 을 비우는 관례가 없어,
# 그대로 줄이면 작업 표시줄에서 작게 보인다. 그래서 투명 둘레를 잘라 판이 꽉 차게(둘레 2%) 만든다.
# Prompt 의 config/scripts/trim-windows-icon-source.mjs 와 같은 계산이다.
import io
import struct
import sys

from PIL import Image

MARGIN_RATIO = 0.02
ALPHA_THRESHOLD = 16
SIZES = [256, 128, 64, 48, 32, 16]


def build(source):
    image = Image.open(source).convert('RGBA')
    bounds = image.getchannel('A').point(lambda a: 255 if a > ALPHA_THRESHOLD else 0).getbbox()
    trimmed = image.crop(bounds)
    side = round(max(trimmed.size) / (1 - 2 * MARGIN_RATIO))
    square = Image.new('RGBA', (side, side))
    square.paste(trimmed, ((side - trimmed.width) // 2, (side - trimmed.height) // 2))
    # 투명한 둘레가 어둡게 번지지 않게 알파를 곱한 채로 줄인다.
    frames = [square.convert('RGBa').resize((size, size), Image.BOX).convert('RGBA') for size in SIZES]
    payloads = []
    for frame in frames:
        buffer = io.BytesIO()
        frame.save(buffer, 'PNG')
        payloads.append(buffer.getvalue())
    header = struct.pack('<HHH', 0, 1, len(frames))
    offset = 6 + 16 * len(frames)
    directory = b''
    for size, payload in zip(SIZES, payloads):
        edge = 0 if size >= 256 else size
        directory += struct.pack('<BBBBHHII', edge, edge, 0, 0, 1, 32, len(payload), offset)
        offset += len(payload)
    return header + directory + b''.join(payloads)


if __name__ == '__main__':
    with open(sys.argv[2], 'wb') as out:
        out.write(build(sys.argv[1]))

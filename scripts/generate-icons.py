#!/usr/bin/env python3
"""
SVG to PNG icon generator for PWA
생성할 아이콘: favicon.png, icon-192.png, icon-512.png, icon-maskable-192.png, icon-maskable-512.png
"""

import os
import subprocess
import sys

# SVG 파일 경로
svg_file = os.path.join(os.path.dirname(__file__), '../public/icon.svg')
public_dir = os.path.join(os.path.dirname(__file__), '../public')

# 생성할 아이콘 사이즈 정의
icons = [
    ('favicon.png', 64),
    ('icon-192.png', 192),
    ('icon-512.png', 512),
    ('icon-maskable-192.png', 192),
    ('icon-maskable-512.png', 512),
]

def generate_icons():
    """svglib과 reportlab을 사용하여 SVG를 PNG로 변환"""
    try:
        from svglib.svglib import svg2rlg
        from reportlab.graphics import renderPM
        from PIL import Image
        import io

        for filename, size in icons:
            output_path = os.path.join(public_dir, filename)

            try:
                # SVG를 ReportLab RLG 객체로 변환
                drawing = svg2rlg(svg_file)
                if drawing is None:
                    print(f"Failed to parse SVG: {svg_file}")
                    continue

                # RLG를 PNG로 렌더링
                renderPM.drawToFile(drawing, output_path, fmt='PNG', width=size, height=size)
                print(f"✓ Generated {filename} ({size}x{size})")

            except Exception as e:
                print(f"✗ Error generating {filename}: {e}")
                continue

        print("\n✓ All icons generated successfully!")

    except ImportError:
        print("Required packages not found. Installing...")
        subprocess.run([sys.executable, '-m', 'pip', 'install', 'svglib', 'reportlab', 'pillow'], check=False)
        generate_icons()  # 재귀적으로 다시 실행

if __name__ == '__main__':
    if not os.path.exists(svg_file):
        print(f"SVG file not found: {svg_file}")
        sys.exit(1)

    generate_icons()

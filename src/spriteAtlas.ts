import type { CSSProperties } from 'react';

/**
 * 均匀分格雪碧图（无间隙）：按容器尺寸用像素缩放，避免 background-position 百分比在
 * 非正方形格子或子像素下的偏移。
 */
export function spriteStyleUniformGridPx(
  atlasPixelWidth: number,
  atlasPixelHeight: number,
  cols: number,
  rows: number,
  index: number,
  containerWidth: number,
  containerHeight: number,
  imageUrl: string
): CSSProperties {
  if (index < 0 || cols < 1 || rows < 1 || atlasPixelWidth < 1 || atlasPixelHeight < 1) {
    return {};
  }
  const col = index % cols;
  const row = Math.floor(index / cols);
  const cellW = atlasPixelWidth / cols;
  const cellH = atlasPixelHeight / rows;
  const cw = Math.max(containerWidth, 1);
  const ch = Math.max(containerHeight, 1);
  const scale = Math.max(cw / cellW, ch / cellH);
  return {
    backgroundImage: `url("${imageUrl}")`,
    backgroundRepeat: 'no-repeat',
    backgroundSize: `${atlasPixelWidth * scale}px ${atlasPixelHeight * scale}px`,
    backgroundPosition: `${-col * cellW * scale}px ${-row * cellH * scale}px`,
  };
}

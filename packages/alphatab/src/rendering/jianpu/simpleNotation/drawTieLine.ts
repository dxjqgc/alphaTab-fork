/**
 * Jianpu tie arc — ported from simple-notation SNTieLineLayer.drawSingleTieLine (MIT).
 * @internal
 */
import type { ICanvas } from '@coderline/alphatab/platform/ICanvas';

/**
 * 绘制单条弧顶连音线（椭圆弧贝塞尔近似，半径随水平距离自适应）。
 *
 * `minArcHeight` 是**控制点**相对端点抬升的下限（排版单位）。纯按 `dist * 0.08` 算，
 * 相邻 16 分音符之间的短连音线只有 0.9~1.5 单位高 —— 再乘上打印/预览缩放就只剩零点几
 * 像素，看着就是一根直线（「近距离的连音线没有弧度」）。所以调用方按谱面字号给一个下限，
 * 与编辑器画布 `paint.ts` 的 `clamp(span * 0.14, TIE_HEIGHT_BASE * 0.45, TIE_HEIGHT_BASE)`
 * 同一个思路：短连线也不能是平的。
 *
 * 但下限**不能压过连线本身**：极端窄的（`dist` 只有几个单位）如果硬抬到满高就成一颗扣子。
 * 所以下限再按 `dist * 0.32` 收一收 —— 窄连线仍然是一条明显更弯的弧，不会变成半圆。
 */
export function drawSingleTieLine(
    canvas: ICanvas,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    lineWidth: number = 1.5,
    minArcHeight: number = 0
): void {
    const dx = x2 - x1;
    const dist = Math.abs(dx);
    if (dist <= 0) {
        return;
    }

    const arcHeight = Math.max(dist * 0.08, Math.min(minArcHeight, dist * 0.32));
    const peakY = Math.min(y1, y2) - arcHeight;
    const sign = dx >= 0 ? 1 : -1;

    canvas.beginPath();
    canvas.moveTo(x1, y1);
    canvas.bezierCurveTo(
        x1 + sign * dist * 0.25,
        peakY,
        x2 - sign * dist * 0.25,
        peakY,
        x2,
        y2
    );
    canvas.lineWidth = lineWidth;
    canvas.stroke();
}

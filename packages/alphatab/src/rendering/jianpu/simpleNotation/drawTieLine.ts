/**
 * Jianpu tie arc — ported from simple-notation SNTieLineLayer.drawSingleTieLine (MIT).
 * @internal
 */
import type { ICanvas } from '@coderline/alphatab/platform/ICanvas';

/**
 * 绘制单条弧顶连音线（椭圆弧贝塞尔近似，半径随水平距离自适应）。
 */
export function drawSingleTieLine(
    canvas: ICanvas,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    xDistance: number,
    lineWidth: number = 1.5
): void {
    const dx = x2 - x1;
    const dist = Math.abs(dx);
    if (dist <= 0) {
        return;
    }

    const arcHeight = dist * 0.08;
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

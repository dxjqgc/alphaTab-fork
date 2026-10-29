import type { ICanvas } from '@coderline/alphatab/platform/ICanvas';
import { drawSingleTieLine } from '@coderline/alphatab/rendering/jianpu/simpleNotation/drawTieLine';
import { expect } from 'chai';

interface RecordedTie {
    lineWidth: number;
    start: { x: number; y: number };
    controls: Array<{ x: number; y: number }>;
    end: { x: number; y: number };
}

/** 只记录连音线用到的调用（beginPath / moveTo / bezierCurveTo / stroke / lineWidth）。 */
function recordTie(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    lineWidth = 1.5,
    minArcHeight = 0
): RecordedTie {
    const recorded: RecordedTie = {
        lineWidth: 0,
        start: { x: 0, y: 0 },
        controls: [],
        end: { x: 0, y: 0 }
    };
    let appliedLineWidth = 0;
    const canvas = {
        beginPath: () => {},
        moveTo: (x: number, y: number) => {
            recorded.start = { x, y };
        },
        bezierCurveTo: (c1x: number, c1y: number, c2x: number, c2y: number, x: number, y: number) => {
            recorded.controls = [
                { x: c1x, y: c1y },
                { x: c2x, y: c2y }
            ];
            recorded.end = { x, y };
        },
        stroke: () => {},
        set lineWidth(value: number) {
            appliedLineWidth = value;
        },
        get lineWidth() {
            return appliedLineWidth;
        }
    } as unknown as ICanvas;
    drawSingleTieLine(canvas, x1, y1, x2, y2, lineWidth, minArcHeight);
    recorded.lineWidth = appliedLineWidth;
    return recorded;
}

describe('JianpuTieLine', () => {
    it('相邻 16 分音符之间的短连音线用最小弧高，不会退化成一条直线', () => {
        // 打印缩放 0.625 时相邻 16 分的间距只有 15~25 单位：纯按 dist*0.08 算只有 1.2~2 单位。
        const tie = recordTie(10, 50, 28, 50, 1.5, 4.86);
        expect(tie.start).to.deep.equal({ x: 10, y: 50 });
        expect(tie.end).to.deep.equal({ x: 28, y: 50 });
        // 控制点抬升 = max(dist * 0.08, min(minArcHeight, dist * 0.32))
        expect(tie.controls[0]!.y).to.be.closeTo(50 - 4.86, 1e-9);
        expect(tie.controls[1]!.y).to.be.closeTo(50 - 4.86, 1e-9);
        // 曲线中点（三次贝塞尔 t=0.5）仍高出 0.75 × 4.86 ≈ 3.6 单位，肉眼是一条弧
        const midY = 0.125 * tie.start.y + 0.375 * tie.controls[0]!.y + 0.375 * tie.controls[1]!.y + 0.125 * tie.end.y;
        expect(50 - midY).to.be.closeTo(4.86 * 0.75, 1e-9);
    });

    it('极窄的连线按自身的比例收窄最小弧高（不会鼓成半圆）', () => {
        const tie = recordTie(10, 50, 16, 50, 1.5, 4.86);
        expect(tie.controls[0]!.y).to.be.closeTo(50 - 6 * 0.32, 1e-9);
    });

    it('长连音线仍按距离成比例长高（最小值不封顶）', () => {
        const tie = recordTie(0, 50, 200, 50, 1.5, 4.86);
        // 200 * 0.08 = 16 > 4.86，长连线不受下限影响
        expect(tie.controls[0]!.y).to.be.closeTo(50 - 16, 1e-9);
    });

    it('不给下限时保持旧口径（dist * 0.08）', () => {
        const tie = recordTie(10, 50, 25, 50);
        expect(tie.controls[0]!.y).to.be.closeTo(50 - 15 * 0.08, 1e-9);
    });
});

/**
 * Jianpu underline drawing — ported from simple-notation SNBeamLayer.drawUnderlineGroup (MIT).
 * @internal
 */
import type { ICanvas } from '@coderline/alphatab/platform/ICanvas';
import type { JianpuDrawNote, JianpuUnderlinePaintStyle } from '@coderline/alphatab/rendering/jianpu/simpleNotation/types';

function paintUnderlineBar(canvas: ICanvas, x1: number, y1: number, x2: number, thickness: number): void {
    canvas.beginPath();
    canvas.moveTo(x1, y1);
    canvas.lineTo(x2, y1);
    canvas.lineTo(x2, y1 + thickness);
    canvas.lineTo(x1, y1 + thickness);
    canvas.closePath();
    canvas.fill();
}

export const DEFAULT_UNDERLINE_STYLE: JianpuUnderlinePaintStyle = {
    lineSpacing: 3,
    lineThickness: 1.5,
    edgeInset: 3,
    baseYOffset: 0,
    /** 最小长度：约等于一个窄音符的完整宽度，短音的第二层减时线才不会缩成一个点。 */
    minLength: 10
};

/**
 * 绘制一组减时线（分层绘制）。
 *
 * 分层规则：
 * - 第1层（underlineCount >= 1）：横连组内所有音符
 * - 第2层（underlineCount >= 2）：只横连 underlineCount >= 2 的音符
 * - 第3层（underlineCount >= 3）：只横连 underlineCount >= 3 的音符
 * -以此类推...
 */
export function drawUnderlineGroup(
    canvas: ICanvas,
    cx: number,
    baseY: number,
    group: JianpuDrawNote[],
    maxUnderlineCount: number,
    style: JianpuUnderlinePaintStyle = DEFAULT_UNDERLINE_STYLE
): void {
    if (group.length === 0 || maxUnderlineCount <= 0) {
        return;
    }

    const { lineSpacing, lineThickness, edgeInset, minLength = 0 } = style;

    // 分层绘制：每层只连接该层及以上层级的音符
    for (let layer = 1; layer <= maxUnderlineCount; layer++) {
        const y = baseY + lineSpacing * (layer - 1);

        // 找出该层需要连接的音符子组
        const layerSegments: { start: JianpuDrawNote; end: JianpuDrawNote }[] = [];
        let segmentStart: JianpuDrawNote | null = null;

        for (const note of group) {
            const noteUnderline = note.underlineCount ?? 0;
            if (noteUnderline >= layer) {
                if (segmentStart === null) {
                    segmentStart = note;
                }
            } else {
                // 当前音符不在此层，结束当前片段
                if (segmentStart !== null) {
                    // 找到片段的结束音符（上一个符合条件的音符）
                    const prevIndex = group.indexOf(note) - 1;
                    if (prevIndex >= 0) {
                        const prevNote = group[prevIndex]!;
                        if ((prevNote.underlineCount ?? 0) >= layer) {
                            layerSegments.push({ start: segmentStart, end: prevNote });
                        }
                    }
                    segmentStart = null;
                }
            }
        }

        // 处理最后的片段
        if (segmentStart !== null) {
            const lastNote = group[group.length - 1]!;
            if ((lastNote.underlineCount ?? 0) >= layer) {
                layerSegments.push({ start: segmentStart, end: lastNote });
            }
        }

        // 绘制该层的每个片段
        for (const segment of layerSegments) {
            let x1 = segment.start.preX + (segment.start.startNote ? edgeInset : 0);
            let x2 = segment.end.postX - (segment.end.endNote ? edgeInset : 0);
            // 两端内缩把线削得太短时，围绕原中线对称补齐到 minLength（不挪原位，只是变粗一点）。
            if (minLength > 0 && x2 - x1 < minLength) {
                const center = (x1 + x2) / 2;
                x1 = center - minLength / 2;
                x2 = center + minLength / 2;
            }
            paintUnderlineBar(canvas, cx + x1, y, cx + x2, lineThickness);
        }
    }
}

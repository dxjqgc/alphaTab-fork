/**
 * Jianpu lyric layout — adapted from simple-notation lyric positioning (MIT).
 * @internal
 */
import type { Font } from '@coderline/alphatab/model/Font';
import type { ICanvas } from '@coderline/alphatab/platform/ICanvas';
import { TextAlign, TextBaseline } from '@coderline/alphatab/platform/ICanvas';

/** 竖排歌词用换行符分隔的多行文本 */
export type JianpuLyricContent = string;

export interface JianpuLyricDrawItem {
    centerX: number;
    lyric: JianpuLyricContent;
}

/**
 * 歌词 Y：数字底边 + lineHeight 近似间距（简谱模式约 +18）。
 */
export function jianpuLyricBaseY(maxNoteBottom: number, lineHeight: number, padding: number = 18): number {
    return maxNoteBottom + padding;
}

/**
 * 绘制单行或竖排歌词（数组时自上而下堆叠）。
 */
export function drawJianpuLyric(
    canvas: ICanvas,
    cx: number,
    baseY: number,
    item: JianpuLyricDrawItem,
    font: Font,
    textAlign: TextAlign,
    lineGap: number = 14
): void {
    const lines = item.lyric.includes('\n') ? item.lyric.split('\n') : [item.lyric];
    if (lines.length === 0) {
        return;
    }

    const baseline = canvas.textBaseline;
    const align = canvas.textAlign;
    canvas.font = font;
    canvas.textBaseline = TextBaseline.Top;
    canvas.textAlign = textAlign;

    let y = baseY;
    for (const line of lines) {
        if (line && line.length > 0) {
            canvas.fillText(line, cx + item.centerX, y);
            y += lineGap;
        }
    }

    canvas.textBaseline = baseline;
    canvas.textAlign = align;
}

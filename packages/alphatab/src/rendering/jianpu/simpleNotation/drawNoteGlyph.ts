/**
 * Jianpu note glyph drawing — ported from simple-notation SNNote (MIT).
 * @internal
 */
import type { Font } from '@coderline/alphatab/model/Font';
import { MusicFontSymbol } from '@coderline/alphatab/model/MusicFontSymbol';
import { CanvasHelper, type ICanvas, TextAlign, TextBaseline } from '@coderline/alphatab/platform/ICanvas';
import { parseJianpuText } from '@coderline/alphatab/rendering/jianpu/simpleNotation/parseJianpuText';

export interface DrawSimpleNoteOptions {
    x: number;
    y: number;
    text: string;
    octaveShift: number;
    underlineCount: number;
    dots: number;
    font: Font;
    isGrace?: boolean;
    /** 低于数字中心的下方八度点起始偏移（已含减时线预留）；优先于 underlineCount 推算 */
    lowerOctaveDownOffset?: number;
}

const OCTAVE_DOT_RADIUS_SCALE = 1;
const ACCIDENTAL_OFFSET = 10;
const ACCIDENTAL_FONT_SCALE = 0.55;

/**
 * 绘制简谱数字、Bravura 升降号、八度圆点、附点。
 */
export function drawSimpleNote(canvas: ICanvas, options: DrawSimpleNoteOptions): { width: number; height: number } {
    const { x, y, text, octaveShift, underlineCount, dots, font, lowerOctaveDownOffset } = options;
    const parsed = parseJianpuText(text);

    const baseline = canvas.textBaseline;
    const align = canvas.textAlign;
    canvas.font = font;
    canvas.textBaseline = TextBaseline.Middle;
    canvas.textAlign = TextAlign.Center;

    const digitSize = canvas.measureText(parsed.digit);
    canvas.fillText(parsed.digit, x, y);

    if (parsed.upDownCount !== 0) {
        const symbol =
            parsed.upDownCount > 0
                ? parsed.upDownCount >= 2
                    ? MusicFontSymbol.AccidentalDoubleSharp
                    : MusicFontSymbol.AccidentalSharp
                : parsed.upDownCount <= -2
                  ? MusicFontSymbol.AccidentalDoubleFlat
                  : MusicFontSymbol.AccidentalFlat;

        CanvasHelper.fillMusicFontSymbolSafe(
            canvas,
            x - digitSize.width / 2 - ACCIDENTAL_OFFSET,
            y - digitSize.height * 0.35,
            ACCIDENTAL_FONT_SCALE,
            symbol,
            true
        );
    }

    if (octaveShift !== 0) {
        const absCount = Math.abs(octaveShift);
        const isUp = octaveShift > 0;
        const gap = 5;
        const upOffset = 18;
        const downOffset =
            lowerOctaveDownOffset ??
            // 回退：数字半高 + 减时线区 + 间距（与 NumberedNoteHeadGlyph._durationBarReserve 一致）
            digitSize.height / 2 + 5 + underlineCount * 3 + 4;
        const baseY = y + (isUp ? -upOffset : downOffset);

        for (let i = 0; i < absCount; i++) {
            const dotY = baseY + (isUp ? -i * gap : i * gap);
            CanvasHelper.fillMusicFontSymbolSafe(
                canvas,
                x,
                dotY,
                OCTAVE_DOT_RADIUS_SCALE,
                MusicFontSymbol.AugmentationDot,
                true
            );
        }
    }

    if (dots > 0) {
        canvas.textAlign = TextAlign.Left;
        let dotX = x + digitSize.width / 2 + 2;
        for (let d = 0; d < dots; d++) {
            canvas.fillText('.', dotX, y);
            dotX += digitSize.width * 0.35;
        }
    }

    canvas.textBaseline = baseline;
    canvas.textAlign = align;

    const totalWidth = digitSize.width + (dots > 0 ? dots * digitSize.width * 0.35 + 4 : 0);
    return { width: totalWidth, height: digitSize.height };
}

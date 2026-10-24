import type { Font } from '@coderline/alphatab/model/Font';
import { type ICanvas, TextAlign, TextBaseline } from '@coderline/alphatab/platform/ICanvas';
import { EffectGlyph } from '@coderline/alphatab/rendering/glyphs/EffectGlyph';

/**
 * @internal
 */
export class LyricsGlyph extends EffectGlyph {
    private _lines: string[];
    private _linePositions: number[] = [];

    public font: Font;
    public textAlign: TextAlign;

    public constructor(x: number, y: number, lines: string[], font: Font, textAlign: TextAlign = TextAlign.Center) {
        super(x, y);
        this._lines = lines;
        this.font = font;
        this.textAlign = textAlign;
    }

    /** The text lines of this glyph (one entry per stacked line). */
    public get lines(): string[] {
        return this._lines;
    }

    /**
     * Re-measures this glyph with a different font size.
     *
     * Used by the jianpu lyric auto-fit: a syllable of a spaced language is a whole
     * word, not a single character, so it can be wider than the horizontal slot the
     * beat grid gives it and has to shrink into that slot instead of being painted
     * over its neighbour.
     */
    public setFontSize(size: number): void {
        if (size === this.font.size) {
            return;
        }
        this.font = this.font.withSize(size);
        this.doLayout();
    }

    public override doLayout(): void {
        super.doLayout();

        const lineSpacing = this.renderer.settings.display.lyricLinesPaddingBetween;

        const canvas = this.renderer.scoreRenderer.canvas!;
        canvas.font = this.font;
        this._linePositions = [];

        let y = 0;
        let maxWidth = 0;
        for (const line of this._lines) {
            this._linePositions.push(y);
            const size = canvas.measureText(line.length > 0 ? line : ' ');
            y += size.height + lineSpacing;
            if (size.width > maxWidth) {
                maxWidth = size.width;
            }
        }

        if (this._lines.length > 0) {
            y -= lineSpacing;
        }

        this.width = maxWidth;
        this.height = y;
    }

    public override paint(cx: number, cy: number, canvas: ICanvas): void {
        canvas.font = this.font;
        const oldTextAlign = canvas.textAlign;
        const oldTextBaseline = canvas.textBaseline;
        canvas.textAlign = this.textAlign;
        canvas.textBaseline = TextBaseline.Top;

        for (let i: number = 0; i < this._lines.length; i++) {
            if (this._lines[i]) {
                canvas.fillText(this._lines[i], cx + this.x, cy + this.y + this._linePositions[i]);
            }
        }

        canvas.textAlign = oldTextAlign;
        canvas.textBaseline = oldTextBaseline;
    }
}


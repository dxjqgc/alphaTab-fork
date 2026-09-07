import type { Beat } from '@coderline/alphatab/model/Beat';
import { BrushType } from '@coderline/alphatab/model/BrushType';
import { VibratoType } from '@coderline/alphatab/model/VibratoType';
import type { ICanvas } from '@coderline/alphatab/platform/ICanvas';
import { Glyph } from '@coderline/alphatab/rendering/glyphs/Glyph';
import { NoteVibratoGlyph } from '@coderline/alphatab/rendering/glyphs/NoteVibratoGlyph';
import type { TabBarRenderer } from '@coderline/alphatab/rendering/TabBarRenderer';
import { NoteYPosition } from '@coderline/alphatab/rendering/BarRendererBase';
import { MusicFontSymbol } from '@coderline/alphatab/model/MusicFontSymbol';

/**
 * @internal
 */
export class TabBrushGlyph extends Glyph {
    private _beat: Beat;
    private _noteVibratoGlyph?: NoteVibratoGlyph;

    public constructor(beat: Beat) {
        super(0, 0);
        this._beat = beat;
    }

    public override doLayout(): void {
        this.width = this.renderer.smuflMetrics.glyphWidths.get(MusicFontSymbol.ArrowheadBlackDown)!;
        if (this._beat.brushType === BrushType.ArpeggioUp) {
            const glyph: NoteVibratoGlyph = new NoteVibratoGlyph(0, 0, VibratoType.Slight, true);
            glyph.renderer = this.renderer;
            glyph.doLayout();
            this._noteVibratoGlyph = glyph;
        } else if (this._beat.brushType === BrushType.ArpeggioDown) {
            const glyph: NoteVibratoGlyph = new NoteVibratoGlyph(0, 0, VibratoType.Slight, true);
            glyph.renderer = this.renderer;
            glyph.doLayout();
            this._noteVibratoGlyph = glyph;
        }
    }

    public override paint(cx: number, cy: number, canvas: ICanvas): void {
        const tabBarRenderer: TabBarRenderer = this.renderer as TabBarRenderer;
        // Staff top/bottom (covers all tab lines, even strings without notes).
        // When the chord doesn't span every string (e.g. C major skips string 6),
        // using maxStringNote.Top/minStringNote.Bottom would put the arrow apex
        // inside the visible tab area (looking "inward"). Anchoring to staff
        // edges makes the apex sit clearly outside the tab block, and extending
        // the line/wave to the same edges keeps it flush with the arrowhead base.
        const staffTopY: number = cy + this.y + tabBarRenderer.getLineY(0);
        const staffBottomY: number = cy + this.y + tabBarRenderer.getLineY(tabBarRenderer.drawnLineCount - 1);
        const arrowX: number = cx + this.x + this.width / 2;
        const arrowSize = this.renderer.smuflMetrics.glyphWidths.get(MusicFontSymbol.ArrowheadBlackDown)!;
        if (this._beat.brushType !== BrushType.None) {
            if (this._beat.brushType === BrushType.BrushUp || this._beat.brushType === BrushType.BrushDown) {
                // Line spans the entire staff so it meets the arrowhead base
                // (no gap between line end and triangle bottom).
                canvas.beginPath();
                canvas.moveTo(arrowX, staffTopY);
                canvas.lineTo(arrowX, staffBottomY);
                canvas.stroke();
            } else if (this._beat.brushType === BrushType.ArpeggioUp) {
                const glyph: NoteVibratoGlyph = this._noteVibratoGlyph!;

                // Wave spans (staff top + arrowSize)..staff bottom so it meets
                // the base of the ▼ drawn at the bottom.
                const lineStartY: number = staffTopY + arrowSize;
                const lineEndY: number = staffBottomY;
                glyph.width = Math.abs(lineEndY - lineStartY);

                canvas.beginRotate(cx + this.x, lineStartY, 90);
                glyph.paint(0, - (this.width - glyph.height / 2), canvas);
                canvas.endRotate();
            } else if (this._beat.brushType === BrushType.ArpeggioDown) {
                const glyph: NoteVibratoGlyph = this._noteVibratoGlyph!;

                // Wave spans staff top..(staff bottom - arrowSize) so it meets
                // the base of the ▲ drawn at the top.
                const lineStartY: number = staffTopY;
                const lineEndY: number = staffBottomY - arrowSize;
                glyph.width = Math.abs(lineEndY - lineStartY);

                canvas.beginRotate(cx + this.x, lineEndY, -90);
                glyph.paint(0, (this.width - glyph.height) / 2, canvas);
                canvas.endRotate();
            }
            // Arrow direction follows the Chinese guitar-tab convention where
            // the arrow points in the direction of motion ON the tab (strings
            // are drawn 1=top .. 6=bottom): a down-stroke sweeps low->high
            // strings (bottom->top on screen), so BrushDown gets a ▲ ABOVE the
            // staff top; an up-stroke sweeps high->low (top->bottom) and gets
            // a ▼ BELOW the staff bottom. This is purely visual — MIDI playback
            // order comes from MidiFileGenerator._fillBrushInfo and is untouched.
            if (this._beat.brushType === BrushType.BrushUp || this._beat.brushType === BrushType.ArpeggioUp) {
                canvas.beginPath();
                canvas.moveTo(arrowX, staffBottomY + arrowSize);
                canvas.lineTo(arrowX + arrowSize / 2, staffBottomY);
                canvas.lineTo(arrowX - arrowSize / 2, staffBottomY);
                canvas.closePath();
                canvas.fill();
            } else {
                canvas.beginPath();
                canvas.moveTo(arrowX, staffTopY - arrowSize);
                canvas.lineTo(arrowX + arrowSize / 2, staffTopY);
                canvas.lineTo(arrowX - arrowSize / 2, staffTopY);
                canvas.closePath();
                canvas.fill();
            }
        }
    }
}

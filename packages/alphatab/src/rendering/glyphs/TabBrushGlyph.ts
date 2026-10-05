import type { Beat } from '@coderline/alphatab/model/Beat';
import { BrushType } from '@coderline/alphatab/model/BrushType';
import type { ICanvas } from '@coderline/alphatab/platform/ICanvas';
import { Glyph } from '@coderline/alphatab/rendering/glyphs/Glyph';
import type { TabBarRenderer } from '@coderline/alphatab/rendering/TabBarRenderer';
import { MusicFontSymbol } from '@coderline/alphatab/model/MusicFontSymbol';

/**
 * @internal
 */
export class TabBrushGlyph extends Glyph {
    /**
     * Arpeggio wave shape, in staff spaces: the horizontal excursion either side
     * of the arrow axis, and the vertical distance between two teeth. The canvas
     * editor's drawTabBrush draws the same wave with the same ratios (3px / 4px
     * at its ~8.5px staff space), so both renderers show one glyph.
     */
    private static readonly _waveAmplitude = 0.35;
    private static readonly _waveStep = 0.5;

    private _beat: Beat;

    public constructor(beat: Beat) {
        super(0, 0);
        this._beat = beat;
    }

    public override doLayout(): void {
        this.width = this.renderer.smuflMetrics.glyphWidths.get(MusicFontSymbol.ArrowheadBlackDown)!;
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
                // Wave spans (staff top + arrowSize)..staff bottom so it meets
                // the base of the ▼ drawn at the bottom.
                this._paintWave(canvas, arrowX, staffTopY + arrowSize, staffBottomY);
            } else if (this._beat.brushType === BrushType.ArpeggioDown) {
                // Wave spans staff top..(staff bottom - arrowSize) so it meets
                // the base of the ▲ drawn at the top.
                this._paintWave(canvas, arrowX, staffTopY, staffBottomY - arrowSize);
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

    /**
     * Sawtooth wave running along the arrow's axis from `startY` to `endY`: every
     * tooth returns to the axis and pokes out alternately left/right, so the wave
     * is centred ON the arrowhead instead of hanging beside it. alphaTab used to
     * rotate a vibrato glyph here, which parked the wave off-axis by an amount
     * that depended on font metrics; drawing it directly makes wave and arrow
     * coaxial by construction, and matches the canvas editor.
     */
    private _paintWave(canvas: ICanvas, axisX: number, startY: number, endY: number): void {
        const staffSpace = this.renderer.smuflMetrics.oneStaffSpace;
        const amplitude = staffSpace * TabBrushGlyph._waveAmplitude;
        const step = staffSpace * TabBrushGlyph._waveStep;
        const span = endY - startY;
        const steps = Math.max(2, Math.round(span / step));
        const segment = span / steps;
        canvas.beginPath();
        canvas.moveTo(axisX, startY);
        for (let i = 1; i <= steps; i++) {
            const y = startY + segment * i;
            const side = i % 2 === 1 ? 1 : -1;
            canvas.lineTo(axisX + side * amplitude, y - segment / 2);
            canvas.lineTo(axisX, y);
        }
        canvas.stroke();
    }
}

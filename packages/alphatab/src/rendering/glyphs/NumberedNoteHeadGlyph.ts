import { type Beat, BeatSubElement } from '@coderline/alphatab/model/Beat';

import { ModelUtils } from '@coderline/alphatab/model/ModelUtils';

import { MusicFontSymbol } from '@coderline/alphatab/model/MusicFontSymbol';

import { NoteSubElement } from '@coderline/alphatab/model/Note';

import { CanvasHelper, type ICanvas, TextAlign, TextBaseline } from '@coderline/alphatab/platform/ICanvas';

import { Glyph } from '@coderline/alphatab/rendering/glyphs/Glyph';

import { drawSimpleNote } from '@coderline/alphatab/rendering/jianpu/simpleNotation/drawNoteGlyph';

import { parseJianpuText } from '@coderline/alphatab/rendering/jianpu/simpleNotation/parseJianpuText';

import { ElementStyleHelper } from '@coderline/alphatab/rendering/utils/ElementStyleHelper';



/**

 * @internal

 */

export class NumberedNoteHeadGlyph extends Glyph {

    private _isGrace: boolean;

    private _beat: Beat;

    private _number: string;

    private _octaveDots: number;

    private _octaveDotsY: number = 0;

    private _octaveDotHeight: number = 0;

    private _useSimpleNotation: boolean = false;

    private _jianpuDots: number = 0;

    private _underlineCount: number = 0;



    public constructor(

        x: number,

        y: number,

        number: string,

        isGrace: boolean,

        beat: Beat,

        octaveDots: number,

        options?: { useSimpleNotation?: boolean; jianpuDots?: number; underlineCount?: number }

    ) {

        super(x, y);

        this._isGrace = isGrace;

        this._number = number;

        this._beat = beat;

        this._octaveDots = octaveDots;

        this._useSimpleNotation = options?.useSimpleNotation ?? false;

        this._jianpuDots = options?.jianpuDots ?? beat.dots;

        this._underlineCount =
            options?.underlineCount ?? Math.max(0, ModelUtils.getIndex(beat.duration) - 2);

    }



    public override getBoundingBoxTop(): number {

        let y = -this.height / 2;



        if (this._octaveDots > 0 && this._octaveDotsY < y) {

            y = this._octaveDotsY;

        }

        return this.y + y;

    }



    public override getBoundingBoxBottom(): number {

        let y = this.height / 2;



        const dotsBottom = this._octaveDotsY + Math.abs(this._octaveDots) * this._octaveDotHeight * 2;

        if (this._octaveDots < 0 && y < dotsBottom) {

            y = dotsBottom;

        }



        return this.y + y;

    }



    /** 时值线锚点：数字底边，不含下方八度点 */

    public getBeamingAnchorBottom(): number {

        return this.y + this.height / 2;

    }



    /** 数字底边到最低减时线下沿的垂直距离（与 NumberedBarRenderer 布局一致） */

    private _durationBarReserve(): number {

        const barCount = this._underlineCount > 0 ? this._underlineCount : ModelUtils.getIndex(this._beat.duration) - 2;

        if (barCount <= 0) {

            return 0;

        }

        const smufl = this.renderer.smuflMetrics;

        const minGap = smufl.numberedBarRendererBarSpacing;

        const lineSpacing = 3;

        return minGap + (barCount - 1) * lineSpacing + 1;

    }



    public override paint(cx: number, cy: number, canvas: ICanvas): void {

        using _ = this._beat.isRest

            ? ElementStyleHelper.beat(canvas, BeatSubElement.NumberedRests, this._beat)

            : this._beat.notes.length > 0

              ? ElementStyleHelper.note(canvas, NoteSubElement.NumberedNumber, this._beat.notes[0])

              : undefined;



        const res = this.renderer.resources;

        const font = this._isGrace ? res.numberedNotationGraceFont : res.numberedNotationFont;



        if (this._useSimpleNotation) {

            drawSimpleNote(canvas, {

                x: cx + this.x + this.width / 2,

                y: cy + this.y,

                text: this._number,

                octaveShift: this._octaveDots,

                underlineCount: this._underlineCount,

                dots: this._jianpuDots,

                font,

                isGrace: this._isGrace,

                lowerOctaveDownOffset: this._octaveDots < 0 ? this._octaveDotsY : undefined

            });

            return;

        }



        const baseline = canvas.textBaseline;

        canvas.textBaseline = TextBaseline.Middle;

        canvas.textAlign = TextAlign.Left;

        canvas.font = font;

        canvas.fillText(this._number.toString(), cx + this.x, cy + this.y);

        canvas.textBaseline = baseline;



        const dotCount = Math.abs(this._octaveDots);

        let dotsY = this._octaveDotsY + res.engravingSettings.glyphTop.get(MusicFontSymbol.AugmentationDot)!;

        for (let d = 0; d < dotCount; d++) {

            CanvasHelper.fillMusicFontSymbolSafe(

                canvas,

                cx + this.x + this.width / 2,

                cy + this.y + dotsY,

                1,

                MusicFontSymbol.AugmentationDot,

                true

            );

            dotsY += this._octaveDotHeight * 2;

        }

    }



    public override doLayout(): void {

        const res = this.renderer.resources;

        const font = this._isGrace ? res.numberedNotationGraceFont : res.numberedNotationFont;

        const c = this.renderer.scoreRenderer.canvas!;

        c.font = font;



        const measureText = this._useSimpleNotation ? parseJianpuText(this._number).digit : this._number;

        const size = c.measureText(`${measureText}`);

        this.height = size.height;

        this.width = size.width + (this._useSimpleNotation && this._jianpuDots > 0 ? this._jianpuDots * size.width * 0.35 + 4 : 0);



        const dotCount = this._octaveDots;



        const dotHeight = res.engravingSettings.glyphHeights.get(MusicFontSymbol.AugmentationDot)!;

        const allDotsHeight = Math.abs(dotCount) * dotHeight * 2;

        if (dotCount > 0) {

            this._octaveDotsY =

                -(this.height / 2) -

                allDotsHeight -

                res.engravingSettings.glyphTop.get(MusicFontSymbol.AugmentationDot)!;

        } else if (dotCount < 0) {

            this._octaveDotsY =

                this.height / 2 +

                dotHeight +

                res.engravingSettings.glyphTop.get(MusicFontSymbol.AugmentationDot)! +

                this._durationBarReserve();

        }

        this._octaveDotHeight = dotHeight;

    }

}


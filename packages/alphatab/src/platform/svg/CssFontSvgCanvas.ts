import { TextAlign } from '@coderline/alphatab/platform/ICanvas';
import { SvgCanvas } from '@coderline/alphatab/platform/svg/SvgCanvas';
import { MusicFontSymbol } from '@coderline/alphatab/model/MusicFontSymbol';

/**
 * This SVG canvas renders the music symbols by adding a CSS class 'at' to all elements.
 * @internal
 */
export class CssFontSvgCanvas extends SvgCanvas {
    public fillMusicFontSymbol(
        x: number,
        y: number,
        relativeScale: number,
        symbol: MusicFontSymbol,
        centerAtPosition?: boolean
    ): void {
        if (symbol === MusicFontSymbol.None) {
            return;
        }
        this._fillMusicFontSymbolText(x, y, relativeScale, `&#${symbol};`, centerAtPosition);
    }

    public fillMusicFontSymbols(
        x: number,
        y: number,
        relativeScale: number,
        symbols: MusicFontSymbol[],
        centerAtPosition?: boolean
    ): void {
        let s: string = '';
        for (const symbol of symbols) {
            if (symbol !== MusicFontSymbol.None) {
                s += `&#${symbol};`;
            }
        }
        this._fillMusicFontSymbolText(x, y, relativeScale, s, centerAtPosition);
    }

    private _fillMusicFontSymbolText(
        x: number,
        y: number,
        relativeScale: number,
        symbols: string,
        centerAtPosition?: boolean
    ): void {
        x *= this.scale;
        y *= this.scale;

        this.buffer += `<g transform="translate(${x} ${y})" class="at" ><text`;
        const scale = this.scale * relativeScale;
        const fill = this._fillCssValue();
        if (this.colorToken) {
            // Token-tagged: fold the fill into the style so it references var(--at-*).
            const fontSizeDecl = scale !== 1 ? `font-size: ${scale * 100}%; ` : '';
            this.buffer += ` style="${fontSizeDecl}stroke:none; fill:${fill}"`;
        } else {
            // Concrete color: keep fill as an attribute (preserving the #000000 skip).
            if (scale !== 1) {
                this.buffer += ` style="font-size: ${scale * 100}%; stroke:none"`;
            } else {
                this.buffer += ' style="stroke:none"';
            }
            if (fill !== undefined) {
                this.buffer += ` fill="${fill}"`;
            }
        }
        if (centerAtPosition) {
            this.buffer += ` text-anchor="${this.getSvgTextAlignment(TextAlign.Center)}"`;
        }
        this.buffer += `>${symbols}</text></g>`;
    }
}

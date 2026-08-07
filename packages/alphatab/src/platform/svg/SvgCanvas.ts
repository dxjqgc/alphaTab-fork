import { Color } from '@coderline/alphatab/model/Color';
import { Font, FontStyle } from '@coderline/alphatab/model/Font';
import { type ICanvas, TextAlign, TextBaseline, MeasuredText } from '@coderline/alphatab/platform/ICanvas';
import { FontSizes } from '@coderline/alphatab/platform/svg/FontSizes';
import type { MusicFontSymbol } from '@coderline/alphatab/model/MusicFontSymbol';
import type { Settings } from '@coderline/alphatab/Settings';

/**
 * A canvas implementation storing SVG data
 * @internal
 */
export abstract class SvgCanvas implements ICanvas {
    protected buffer: string = '';

    private _currentPath: string = '';
    private _currentPathIsEmpty: boolean = true;

    public scale = 1;

    public color: Color = new Color(255, 255, 255, 0xff);
    public colorToken?: string;
    public lineWidth: number = 1;
    public font: Font = new Font('Arial', 10, FontStyle.Plain);
    public textAlign: TextAlign = TextAlign.Left;
    public textBaseline: TextBaseline = TextBaseline.Top;
    public settings!: Settings;

    public destroy() {}

    public beginRender(width: number, height: number): void {
        this.scale = this.settings.display.scale;
        this.buffer = `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="${width | 0}px" height="${
            height | 0
        }px" class="at-surface-svg" style="${SvgCanvas._buildThemeCssVariables(this.settings)}">\n`;
        this._currentPath = '';
        this._currentPathIsEmpty = true;
        this.textBaseline = TextBaseline.Top;
    }

    /**
     * Builds the CSS custom-property declarations for the active theme, emitted as a
     * `style` attribute on the `<svg>` root of every rendered partial.
     *
     * @remarks
     * Each value is the concrete color currently held by the corresponding
     * {@link RenderingResources} field (resolved from the active theme, if any, by
     * {@link DisplaySettings.applyCurrentTheme}). Glyphs still emit concrete colors in
     * this tier — the variables only make the theme's resolved palette referenceable from
     * external CSS (`var(--at-foreground)`, etc.) and set up the resolution path used by
     * the token-emission tier. Variables are declared per `<svg>` root (one per partial)
     * so each chunk is self-contained and survives lazy re-rendering and shadow-DOM hosts.
     *
     * @since 2.1
     */
    protected static _buildThemeCssVariables(settings: Settings): string {
        const r = settings.display.resources;
        return [
            `--at-foreground:${r.mainGlyphColor.rgba}`,
            `--at-foreground-muted:${r.secondaryGlyphColor.rgba}`,
            `--at-staff-line:${r.staffLineColor.rgba}`,
            `--at-bar-separator:${r.barSeparatorColor.rgba}`,
            `--at-bar-number:${r.barNumberColor.rgba}`,
            `--at-score-info:${r.scoreInfoColor.rgba}`,
            `--at-background:${r.backgroundColor.rgba}`
        ].join(';');
    }

    /**
     * The CSS value to emit for `fill:` when the current color is theme-tagged.
     *
     * @remarks
     * When {@link colorToken} is set, returns `var(--at-${token})` so a CSS-variable
     * theme change recolors the glyph instantly. When no token is in scope, returns
     * `undefined` for the SVG default color (pure black, `#000000`) — preserving the
     * historical byte-size optimization of omitting the fill declaration — and the
     * concrete {@link color.rgba} otherwise. The token path always returns a value
     * because the variable's default is CSS-controlled and cannot be assumed black.
     *
     * @since 2.1
     */
    protected _fillCssValue(): string | undefined {
        if (this.colorToken) {
            return `var(--at-${this.colorToken})`;
        }
        return this.color.rgba === Color.BlackRgb ? undefined : this.color.rgba;
    }

    /**
     * The CSS value to emit for `stroke:` when the current color is theme-tagged.
     *
     * @remarks
     * Unlike {@link _fillCssValue}, the stroke path has no historical `#000000`-skip
     * (it always emitted a concrete `stroke`), so this always returns a value.
     *
     * @since 2.1
     */
    protected _strokeCssValue(): string {
        if (this.colorToken) {
            return `var(--at-${this.colorToken})`;
        }
        return this.color.rgba;
    }

    /**
     * A complete `fill` declaration for shape elements (rects, etc.) — either a
     * `style="fill:var(--at-${token})"` attribute (token-tagged color), a concrete
     * `fill="<rgba>"` attribute, or an empty string when the color is the SVG default
     * (pure black) and no token is set. Consumers append the returned string verbatim
     * after the element's geometry attributes.
     *
     * @since 2.1
     */
    protected _fillDeclaration(): string {
        const value = this._fillCssValue();
        if (value === undefined) {
            return '';
        }
        if (this.colorToken) {
            return ` style="fill:${value}"`;
        }
        return ` fill="${value}"`;
    }

    /**
     * A complete `stroke` declaration for shape elements (rects, etc.). The stroke
     * path has no default-color skip, so this is never empty.
     *
     * @since 2.1
     */
    protected _strokeDeclaration(): string {
        const value = this._strokeCssValue();
        if (this.colorToken) {
            return ` style="stroke:${value}"`;
        }
        return ` stroke="${value}"`;
    }

    public beginGroup(identifier: string): void {
        this.buffer += `<g class="${identifier}">`;
    }

    public endGroup(): void {
        this.buffer += '</g>';
    }

    public endRender(): unknown {
        this.buffer += '</svg>';
        return this.buffer;
    }

    public fillRect(x: number, y: number, w: number, h: number): void {
        if (w > 0) {
            this.buffer += `<rect x="${x * this.scale}" y="${y * this.scale}" width="${
                w * this.scale
            }" height="${h * this.scale}"${this._fillDeclaration()} />\n`;
        }
    }

    public strokeRect(x: number, y: number, w: number, h: number): void {
        const blurOffset = (this.lineWidth * this.scale) % 2 === 0 ? 0 : 0.5;
        this.buffer += `<rect x="${x * this.scale + blurOffset}" y="${y * this.scale + blurOffset}" width="${
            w * this.scale
        }" height="${h * this.scale}"${this._strokeDeclaration()}`;
        if (this.lineWidth !== 1) {
            this.buffer += ` stroke-width="${this.lineWidth * this.scale}"`;
        }
        this.buffer += ' fill="transparent" />\n';
    }

    public beginPath(): void {
        // nothing to do
    }

    public closePath(): void {
        this._currentPath += ' z';
    }

    public moveTo(x: number, y: number): void {
        this._currentPath += ` M${x * this.scale},${y * this.scale}`;
    }

    public lineTo(x: number, y: number): void {
        this._currentPathIsEmpty = false;
        this._currentPath += ` L${x * this.scale},${y * this.scale}`;
    }

    public quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): void {
        this._currentPathIsEmpty = false;
        this._currentPath += ` Q${cpx * this.scale},${cpy * this.scale},${x * this.scale},${y * this.scale}`;
    }

    public bezierCurveTo(cp1X: number, cp1Y: number, cp2X: number, cp2Y: number, x: number, y: number): void {
        this._currentPathIsEmpty = false;
        this._currentPath += ` C${cp1X * this.scale},${cp1Y * this.scale},${cp2X * this.scale},${cp2Y * this.scale},${
            x * this.scale
        },${y * this.scale}`;
    }

    public fillCircle(x: number, y: number, radius: number): void {
        this._currentPathIsEmpty = false;

        x *= this.scale;
        y *= this.scale;
        radius *= this.scale;

        //
        // M0,250 A1,1 0 0,0 500,250 A1,1 0 0,0 0,250 z
        this._currentPath += ` M${x - radius},${y} A1,1 0 0,0 ${x + radius},${y} A1,1 0 0,0 ${x - radius},${y} z`;
        this.fill();
    }

    public strokeCircle(x: number, y: number, radius: number): void {
        this._currentPathIsEmpty = false;

        x *= this.scale;
        y *= this.scale;
        radius *= this.scale;

        //
        // M0,250 A1,1 0 0,0 500,250 A1,1 0 0,0 0,250 z
        this._currentPath += ` M${x - radius},${y} A1,1 0 0,0 ${x + radius},${y} A1,1 0 0,0 ${x - radius},${y} z`;
        this.stroke();
    }

    public fill(): void {
        if (!this._currentPathIsEmpty) {
            this.buffer += `<path d="${this._currentPath}"`;
            const fill = this._fillCssValue();
            if (this.colorToken) {
                this.buffer += ` style="fill:${fill}; stroke: none"/>`;
            } else {
                if (fill !== undefined) {
                    this.buffer += ` fill="${fill}"`;
                }
                this.buffer += ' style="stroke: none"/>';
            }
        }
        this._currentPath = '';
        this._currentPathIsEmpty = true;
    }

    public stroke(): void {
        if (!this._currentPathIsEmpty) {
            let s: string = `<path d="${this._currentPath}"`;
            if (this.colorToken) {
                s += ` style="stroke:${this._strokeCssValue()}; fill: none"`;
            } else {
                s += ` stroke="${this._strokeCssValue()}"`;
            }
            if (this.lineWidth !== 1 || this.scale !== 1) {
                s += ` stroke-width="${this.lineWidth * this.scale}"`;
            }
            if (!this.colorToken) {
                s += ' style="fill: none"';
            }
            s += ' />';
            this.buffer += s;
        }
        this._currentPath = '';
        this._currentPathIsEmpty = true;
    }

    public fillText(text: string, x: number, y: number): void {
        if (text === '') {
            return;
        }
        const fill = this._fillCssValue();
        let s: string = `<text x="${x * this.scale}" y="${
            y * this.scale
        }" style='stroke: none; font:${this.font.toCssString(this.settings.display.scale)}; ${this.getSvgBaseLine()}`;
        if (this.colorToken) {
            s += `; fill:${fill}'`;
        } else {
            s += `'`;
            if (fill !== undefined) {
                s += ` fill="${fill}"`;
            }
        }
        if (this.textAlign !== TextAlign.Left) {
            s += ` text-anchor="${this.getSvgTextAlignment(this.textAlign)}"`;
        }
        s += `>${SvgCanvas._escapeText(text)}</text>`;
        this.buffer += s;
    }

    private static _escapeText(text: string) {
        return text
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    protected getSvgTextAlignment(textAlign: TextAlign): string {
        switch (textAlign) {
            case TextAlign.Left:
                return 'start';
            case TextAlign.Center:
                return 'middle';
            case TextAlign.Right:
                return 'end';
        }
        return '';
    }

    protected getSvgBaseLine(): string {
        switch (this.textBaseline) {
            case TextBaseline.Top:
                return 'dominant-baseline: hanging';
            case TextBaseline.Bottom:
                return 'dominant-baseline: ideographic';
            case TextBaseline.Alphabetic:
                // alphabetic is set as default on the SVG tag via css
                return '';
            case TextBaseline.Middle:
                // central would maybe look slightly better, but its not available on HTML5 canvas, or Skia
                // hence, we rather stay consistent
                return 'dominant-baseline: middle';
            default:
                return '';
        }
    }

    public measureText(text: string) {
        if (!text) {
            return new MeasuredText(0, 0);
        }
        return FontSizes.measureString(
            text,
            this.font.families,
            this.font.size,
            this.font.style,
            this.font.weight
        );
    }

    public abstract fillMusicFontSymbol(
        x: number,
        y: number,
        relativeScale: number,
        symbol: MusicFontSymbol,
        centerAtPosition?: boolean
    ): void;

    public abstract fillMusicFontSymbols(
        x: number,
        y: number,
        relativeScale: number,
        symbols: MusicFontSymbol[],
        centerAtPosition?: boolean
    ): void;

    public onRenderFinished(): unknown {
        // nothing to do
        return null;
    }

    public beginRotate(centerX: number, centerY: number, angle: number): void {
        this.buffer += `<g transform="translate(${centerX * this.scale} ,${centerY * this.scale}) rotate( ${angle})">`;
    }

    public endRotate(): void {
        this.buffer += '</g>';
    }
}

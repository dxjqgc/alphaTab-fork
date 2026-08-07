import { BarSubElement, type Bar } from '@coderline/alphatab/model/Bar';
import type { BeatSubElement, Beat } from '@coderline/alphatab/model/Beat';
import type { Color } from '@coderline/alphatab/model/Color';
import type { ElementStyle } from '@coderline/alphatab/model/ElementStyle';
import type { NoteSubElement, Note } from '@coderline/alphatab/model/Note';
import type { Score, ScoreSubElement } from '@coderline/alphatab/model/Score';
import { type Track, TrackSubElement } from '@coderline/alphatab/model/Track';
import type { VoiceSubElement, Voice } from '@coderline/alphatab/model/Voice';
import type { ICanvas } from '@coderline/alphatab/platform/ICanvas';
import type { RenderingResources } from '@coderline/alphatab/RenderingResources';

/**
 * A helper to apply element styles in a specific rendering scope via the `using` keyword
 * @internal
 */
export class ElementStyleHelper {
    /**
     * The semantic theme-token names corresponding to each
     * {@link RenderingResources} color field. The SVG backend emits these as
     * `--at-${name}` custom properties on the `<svg>` root and, when a scope
     * resolves to a default (non-override) color, tags the canvas with the token
     * so glyph output can reference `var(--at-${name})` instead of a concrete color.
     *
     * Keep in sync with {@link SvgCanvas._buildThemeCssVariables}.
     * @since 2.1
     */
    public static readonly colorTokenNames = {
        foreground: 'foreground',
        foregroundMuted: 'foreground-muted',
        staffLine: 'staff-line',
        barSeparator: 'bar-separator',
        barNumber: 'bar-number',
        scoreInfo: 'score-info',
        background: 'background'
    } as const;

    public static score(
        canvas: ICanvas,
        element: ScoreSubElement,
        score: Score,
        forceDefault: boolean = false
    ): Disposable | undefined {
        if (!score.style && !forceDefault) {
            return undefined;
        }

        const defaultColor: Color = ElementStyleHelper._scoreDefaultColor(canvas.settings.display.resources, element);
        const defaultColorToken: string = ElementStyleHelper.colorTokenNames.foreground;

        return new ElementStyleScope<ScoreSubElement>(
            canvas,
            element,
            score.style,
            defaultColor,
            defaultColorToken
        );
    }

    public static scoreColor(res: RenderingResources, element: ScoreSubElement, score: Score): Color | undefined {
        const defaultColor: Color = ElementStyleHelper._scoreDefaultColor(res, element);

        if (score.style && score.style!.colors.has(element)) {
            return score.style!.colors.get(element) ?? defaultColor;
        }

        return undefined;
    }

    private static _scoreDefaultColor(res: RenderingResources, _element: ScoreSubElement) {
        const defaultColor: Color = res.mainGlyphColor;

        return defaultColor;
    }

    public static bar(
        canvas: ICanvas,
        element: BarSubElement,
        bar: Bar,
        forceDefault: boolean = false
    ): Disposable | undefined {
        if (!bar.style && !forceDefault) {
            return undefined;
        }

        const res = canvas.settings.display.resources;
        let defaultColor: Color = res.mainGlyphColor;
        let defaultColorToken: string = ElementStyleHelper.colorTokenNames.foreground;
        switch (element) {
            case BarSubElement.StandardNotationRepeats:
            case BarSubElement.GuitarTabsRepeats:
            case BarSubElement.SlashRepeats:
            case BarSubElement.NumberedRepeats:
            case BarSubElement.StandardNotationClef:
            case BarSubElement.GuitarTabsClef:
            case BarSubElement.StandardNotationKeySignature:
            case BarSubElement.NumberedKeySignature:
            case BarSubElement.StandardNotationTimeSignature:
            case BarSubElement.GuitarTabsTimeSignature:
            case BarSubElement.SlashTimeSignature:
            case BarSubElement.NumberedTimeSignature:
                break;

            case BarSubElement.StandardNotationBarLines:
            case BarSubElement.GuitarTabsBarLines:
            case BarSubElement.SlashBarLines:
            case BarSubElement.NumberedBarLines:
                defaultColor = res.barSeparatorColor;
                defaultColorToken = ElementStyleHelper.colorTokenNames.barSeparator;
                break;

            case BarSubElement.StandardNotationBarNumber:
            case BarSubElement.SlashBarNumber:
            case BarSubElement.NumberedBarNumber:
            case BarSubElement.GuitarTabsBarNumber:
                defaultColor = res.barNumberColor;
                defaultColorToken = ElementStyleHelper.colorTokenNames.barNumber;
                break;

            case BarSubElement.StandardNotationStaffLine:
            case BarSubElement.GuitarTabsStaffLine:
            case BarSubElement.SlashStaffLine:
            case BarSubElement.NumberedStaffLine:
                defaultColor = res.staffLineColor;
                defaultColorToken = ElementStyleHelper.colorTokenNames.staffLine;
                break;
        }

        return new ElementStyleScope<BarSubElement>(canvas, element, bar.style, defaultColor, defaultColorToken);
    }

    public static voice(
        canvas: ICanvas,
        element: VoiceSubElement,
        voice: Voice,
        forceDefault: boolean = false
    ): Disposable | undefined {
        if (!voice.style && !forceDefault) {
            return undefined;
        }

        const isPrimaryVoice = voice.index === 0;
        const defaultColor: Color = isPrimaryVoice
            ? canvas.settings.display.resources.mainGlyphColor
            : canvas.settings.display.resources.secondaryGlyphColor;
        const defaultColorToken: string = isPrimaryVoice
            ? ElementStyleHelper.colorTokenNames.foreground
            : ElementStyleHelper.colorTokenNames.foregroundMuted;

        return new ElementStyleScope<VoiceSubElement>(
            canvas,
            element,
            voice.style,
            defaultColor,
            defaultColorToken
        );
    }

    public static trackColor(res: RenderingResources, element: TrackSubElement, track: Track): Color | undefined {
        const defaultColor = ElementStyleHelper._trackDefaultColor(res, element);

        if (track.style && track.style!.colors.has(element)) {
            return track.style!.colors.get(element) ?? defaultColor;
        }

        return undefined;
    }

    private static _trackDefaultColor(res: RenderingResources, element: TrackSubElement) {
        let defaultColor: Color = res.mainGlyphColor;
        switch (element) {
            case TrackSubElement.TrackName:
            case TrackSubElement.SystemSeparator:
            case TrackSubElement.StringTuning:
                break;
            case TrackSubElement.BracesAndBrackets:
                defaultColor = res.barSeparatorColor;
                break;
        }

        return defaultColor;
    }

    /**
     * The theme token a {@link TrackSubElement} resolves to when no per-sub-element
     * override is set (mirrors {@link _trackDefaultColor}'s field choice).
     * @since 2.1
     */
    private static _trackDefaultToken(element: TrackSubElement): string {
        return element === TrackSubElement.BracesAndBrackets
            ? ElementStyleHelper.colorTokenNames.barSeparator
            : ElementStyleHelper.colorTokenNames.foreground;
    }

    public static track(
        canvas: ICanvas,
        element: TrackSubElement,
        track: Track,
        forceDefault: boolean = false
    ): Disposable | undefined {
        if (!track.style && !forceDefault) {
            return undefined;
        }

        const defaultColor = ElementStyleHelper._trackDefaultColor(canvas.settings.display.resources, element);
        const defaultColorToken = ElementStyleHelper._trackDefaultToken(element);

        return new ElementStyleScope<TrackSubElement>(
            canvas,
            element,
            track.style,
            defaultColor,
            defaultColorToken
        );
    }

    public static beatColor(res: RenderingResources, element: BeatSubElement, beat: Beat): Color | undefined {
        const defaultColor = ElementStyleHelper._beatDefaultColor(res, element, beat);

        if (beat.style && beat.style!.colors.has(element)) {
            return beat.style!.colors.get(element) ?? defaultColor;
        }

        return undefined;
    }

    private static _beatDefaultColor(res: RenderingResources, _element: BeatSubElement, beat: Beat) {
        const defaultColor: Color = beat.voice.index === 0 ? res.mainGlyphColor : res.secondaryGlyphColor;

        return defaultColor;
    }

    /**
     * The theme token a beat resolves to (primary voice -> foreground, secondary -> foreground-muted).
     * @since 2.1
     */
    private static _beatDefaultToken(beat: Beat): string {
        return beat.voice.index === 0
            ? ElementStyleHelper.colorTokenNames.foreground
            : ElementStyleHelper.colorTokenNames.foregroundMuted;
    }

    public static beat(
        canvas: ICanvas,
        element: BeatSubElement,
        beat: Beat,
        forceDefault: boolean = false
    ): Disposable | undefined {
        if (!beat.style && !forceDefault) {
            return undefined;
        }

        const defaultColor = ElementStyleHelper._beatDefaultColor(canvas.settings.display.resources, element, beat);
        const defaultColorToken: string = ElementStyleHelper._beatDefaultToken(beat);

        return new ElementStyleScope<BeatSubElement>(canvas, element, beat.style, defaultColor, defaultColorToken);
    }

    public static noteColor(res: RenderingResources, element: NoteSubElement, note: Note): Color | undefined {
        const defaultColor = ElementStyleHelper._noteDefaultColor(res, element, note);

        if (note.style && note.style!.colors.has(element)) {
            return note.style!.colors.get(element) ?? defaultColor;
        }

        return undefined;
    }

    private static _noteDefaultColor(res: RenderingResources, _element: NoteSubElement, note: Note) {
        const defaultColor: Color = note.beat.voice.index === 0 ? res.mainGlyphColor : res.secondaryGlyphColor;

        return defaultColor;
    }

    public static note(
        canvas: ICanvas,
        element: NoteSubElement,
        note: Note,
        forceDefault: boolean = false
    ): Disposable | undefined {
        if (!note.style && !forceDefault) {
            return undefined;
        }

        const isPrimaryVoice = note.beat.voice.index === 0;
        const defaultColor: Color = isPrimaryVoice
            ? canvas.settings.display.resources.mainGlyphColor
            : canvas.settings.display.resources.secondaryGlyphColor;
        const defaultColorToken: string = isPrimaryVoice
            ? ElementStyleHelper.colorTokenNames.foreground
            : ElementStyleHelper.colorTokenNames.foregroundMuted;

        return new ElementStyleScope<NoteSubElement>(canvas, element, note.style, defaultColor, defaultColorToken);
    }
}

/**
 * A helper class for applying elements styles to the canvas and restoring the previous state afterwards.
 * @internal
 */
class ElementStyleScope<TSubElement extends number> implements Disposable {
    private _canvas: ICanvas;
    private _previousColor?: Color;
    private _previousToken?: string;

    public constructor(
        canvas: ICanvas,
        element: TSubElement,
        container: ElementStyle<TSubElement> | undefined,
        defaultColor: Color,
        defaultColorToken?: string
    ) {
        this._canvas = canvas;

        // Always snapshot the prior state (color AND token) so disposal restores both
        // regardless of which branch runs below. Previously, when `container` was
        // provided but did not override this `element`, neither branch touched the
        // canvas, `_previousColor` stayed undefined, and disposal was a no-op — which
        // also left any `colorToken` set by an enclosing scope leaking onto the glyphs
        // drawn after this scope. Snapshotting unconditionally closes that leak.
        this._previousColor = canvas.color;
        this._previousToken = canvas.colorToken;

        if (container && container.colors.has(element)) {
            // Per-sub-element user override is a concrete color, NOT a theme token —
            // it must not emit var(--at-*), so clear the token.
            canvas.color = container.colors.get(element) ?? defaultColor;
            canvas.colorToken = undefined;
        } else {
            // Default comes straight from a named RenderingResources field — tag it
            // so the SVG backend can emit var(--at-${token}) instead of a concrete color.
            canvas.color = defaultColor;
            canvas.colorToken = defaultColorToken;
        }
    }

    [Symbol.dispose]() {
        this._canvas.color = this._previousColor!;
        this._canvas.colorToken = this._previousToken;
    }
}

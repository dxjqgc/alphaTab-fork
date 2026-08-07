import { EngravingSettings } from '@coderline/alphatab/EngravingSettings';
import { Color } from '@coderline/alphatab/model/Color';
import { Font, FontStyle, FontWeight } from '@coderline/alphatab/model/Font';
import { ScoreSubElement } from '@coderline/alphatab/model/Score';
import { NotationElement } from '@coderline/alphatab/NotationSettings';
import type { RenderingThemeDescriptor } from '@coderline/alphatab/RenderingTheme';

/**
 * This public class contains central definitions for controlling the visual appearance.
 * @json
 * @json_declaration
 * @public
 */
export class RenderingResources {
    private static _sansFont: string = 'Arial, sans-serif';
    private static _serifFont: string = 'Georgia, serif';

    private static _effectFont = new Font(RenderingResources._serifFont, 12, FontStyle.Italic);

    /**
     * The default fonts for notation elements if not specified by the user.
     */
    public static defaultFonts: Map<NotationElement, Font> = new Map<NotationElement, Font>([
        [NotationElement.ScoreTitle, new Font(RenderingResources._serifFont, 32, FontStyle.Plain)],
        [NotationElement.ScoreSubTitle, new Font(RenderingResources._serifFont, 20, FontStyle.Plain)],
        [NotationElement.ScoreArtist, new Font(RenderingResources._serifFont, 20, FontStyle.Plain)],
        [NotationElement.ScoreAlbum, new Font(RenderingResources._serifFont, 20, FontStyle.Plain)],
        [NotationElement.ScoreWords, new Font(RenderingResources._serifFont, 15, FontStyle.Plain)],
        [NotationElement.ScoreMusic, new Font(RenderingResources._serifFont, 15, FontStyle.Plain)],
        [NotationElement.ScoreWordsAndMusic, new Font(RenderingResources._serifFont, 15, FontStyle.Plain)],
        [NotationElement.ScoreCopyright, new Font(RenderingResources._sansFont, 12, FontStyle.Plain, FontWeight.Bold)],
        [NotationElement.EffectBeatTimer, new Font(RenderingResources._serifFont, 12, FontStyle.Plain)],
        [NotationElement.EffectDirections, new Font(RenderingResources._serifFont, 14, FontStyle.Plain)],
        [NotationElement.ChordDiagramFretboardNumbers, new Font(RenderingResources._sansFont, 11, FontStyle.Plain)],
        [NotationElement.EffectFingering, new Font(RenderingResources._serifFont, 14, FontStyle.Plain)],
        [NotationElement.EffectMarker, new Font(RenderingResources._serifFont, 14, FontStyle.Plain, FontWeight.Bold)],
        [NotationElement.EffectCapo, RenderingResources._effectFont],
        [NotationElement.EffectFreeTime, RenderingResources._effectFont],
        [NotationElement.EffectLyrics, RenderingResources._effectFont],
        [NotationElement.EffectTap, RenderingResources._effectFont],
        [NotationElement.ChordDiagrams, RenderingResources._effectFont],
        [NotationElement.EffectChordNames, RenderingResources._effectFont],
        [NotationElement.EffectText, RenderingResources._effectFont],
        [NotationElement.EffectPalmMute, RenderingResources._effectFont],
        [NotationElement.EffectLetRing, RenderingResources._effectFont],
        [NotationElement.EffectBeatBarre, RenderingResources._effectFont],
        [NotationElement.EffectTripletFeel, RenderingResources._effectFont],
        [NotationElement.EffectHarmonics, RenderingResources._effectFont],
        [NotationElement.EffectPickSlide, RenderingResources._effectFont],
        [NotationElement.GuitarTuning, RenderingResources._effectFont],
        [NotationElement.EffectRasgueado, RenderingResources._effectFont],
        [NotationElement.EffectWhammyBar, RenderingResources._effectFont],
        [NotationElement.TrackNames, RenderingResources._effectFont],
        [NotationElement.RepeatCount, new Font(RenderingResources._sansFont, 11, FontStyle.Plain)],
        [NotationElement.BarNumber, new Font(RenderingResources._sansFont, 11, FontStyle.Plain)],
        [NotationElement.ScoreBendSlur, new Font(RenderingResources._sansFont, 11, FontStyle.Plain)],
        [NotationElement.EffectAlternateEndings, new Font(RenderingResources._serifFont, 15, FontStyle.Plain)]
    ]);

    /**
     * The name of the SMuFL Font to use for rendering music symbols.
     *
     * @remarks
     * If this family name is provided, alphaTab will not load any custom font, but expects
     * this font to be available in your environment (loadad as webfont or registered in alphaSkia).
     *
     * When using alphaTab in a browser environment it is rather recommended to specify the web font
     * via the `smuflFontSources` on the `CoreSettings`and skipping this setting.
     *
     * You will also need to fill {@link engravingSettings} to match this font.
     *
     * @since 1.7.0
     * @internal
     */
    public smuflFontFamilyName?: string;

    /**
     * The SMuFL Metrics to use for rendering music symbols.
     * @defaultValue `alphaTab`
     * @since 1.7.0
     */
    public engravingSettings: EngravingSettings = EngravingSettings.bravuraDefaults;

    /**
     * The font to use for displaying the songs copyright information in the header of the music sheet.
     * @defaultValue `bold 12px Arial, sans-serif`
     * @since 0.9.6
     * @deprecated use {@link elementFonts} with {@link NotationElement.ScoreCopyright}
     */
    public get copyrightFont(): Font {
        return this.elementFonts.get(NotationElement.ScoreCopyright)!;
    }
    /**
     * @deprecated use {@link elementFonts} with {@link NotationElement.ScoreCopyright}
     */
    public set copyrightFont(value: Font) {
        this.elementFonts.set(NotationElement.ScoreCopyright, value);
    }

    /**
     * The font to use for displaying the songs title in the header of the music sheet.
     * @defaultValue `32px Georgia, serif`
     * @since 0.9.6
     * @deprecated use {@link elementFonts} with {@link NotationElement.ScoreTitle}
     */
    public get titleFont(): Font {
        return this.elementFonts.get(NotationElement.ScoreTitle)!;
    }

    /**
     * @deprecated use {@link elementFonts} with {@link NotationElement.ScoreTitle}
     */
    public set titleFont(value: Font) {
        this.elementFonts.set(NotationElement.ScoreTitle, value);
    }

    /**
     * The font to use for displaying the songs subtitle in the header of the music sheet.
     * @defaultValue `20px Georgia, serif`
     * @since 0.9.6
     * @deprecated use {@link elementFonts} with {@link NotationElement.ScoreSubTitle}
     */
    public get subTitleFont(): Font {
        return this.elementFonts.get(NotationElement.ScoreSubTitle)!;
    }

    /**
     * @deprecated use {@link elementFonts} with {@link NotationElement.ScoreSubTitle}
     */
    public set subTitleFont(value: Font) {
        this.elementFonts.set(NotationElement.ScoreSubTitle, value);
    }

    /**
     * The font to use for displaying the lyrics information in the header of the music sheet.
     * @defaultValue `15px Arial, sans-serif`
     * @since 0.9.6
     * @deprecated use {@link elementFonts} with {@link NotationElement.ScoreWords}
     */
    public get wordsFont(): Font {
        return this.elementFonts.get(NotationElement.ScoreWords)!;
    }

    /**
     * @deprecated use {@link elementFonts} with {@link NotationElement.ScoreWords}
     */
    public set wordsFont(value: Font) {
        this.elementFonts.set(NotationElement.ScoreWords, value);
    }

    /**
     * The font to use for displaying beat time information in the music sheet.
     * @defaultValue `12px Georgia, serif`
     * @since 1.4.0
     * @deprecated use {@link elementFonts} with {@link NotationElement.EffectBeatTimer}
     */
    public get timerFont(): Font {
        return this.elementFonts.get(NotationElement.EffectBeatTimer)!;
    }

    /**
     * @deprecated use {@link elementFonts} with {@link NotationElement.EffectBeatTimer}
     */
    public set timerFont(value: Font) {
        this.elementFonts.set(NotationElement.EffectBeatTimer, value);
    }

    /**
     * The font to use for displaying the directions texts.
     * @defaultValue `14px Georgia, serif`
     * @since 1.4.0
     * @deprecated use {@link elementFonts} with {@link NotationElement.EffectDirections}
     */
    public get directionsFont(): Font {
        return this.elementFonts.get(NotationElement.EffectDirections)!;
    }

    /**
     * @deprecated use {@link elementFonts} with {@link NotationElement.EffectDirections}
     */
    public set directionsFont(value: Font) {
        this.elementFonts.set(NotationElement.EffectDirections, value);
    }

    /**
     * The font to use for displaying the fretboard numbers in chord diagrams.
     * @defaultValue `11px Arial, sans-serif`
     * @since 0.9.6
     * @deprecated use {@link elementFonts} with {@link NotationElement.ChordDiagramFretboardNumbers}
     */
    public get fretboardNumberFont(): Font {
        return this.elementFonts.get(NotationElement.ChordDiagramFretboardNumbers)!;
    }

    /**
     * @deprecated use {@link elementFonts} with {@link NotationElement.ChordDiagramFretboardNumbers}
     */
    public set fretboardNumberFont(value: Font) {
        this.elementFonts.set(NotationElement.ChordDiagramFretboardNumbers, value);
    }

    /**
     * Unused, see deprecation note.
     * @defaultValue `14px Georgia, serif`
     * @since 0.9.6
     * @deprecated Since 1.7.0 alphaTab uses the glyphs contained in the SMuFL font
     * @json_ignore
     */
    public fingeringFont: Font = RenderingResources._effectFont;

    /**
     * Unused, see deprecation note.
     * @defaultValue `12px Georgia, serif`
     * @since 1.4.0
     * @deprecated Since 1.7.0 alphaTab uses the glyphs contained in the SMuFL font
     * @json_ignore
     */
    public inlineFingeringFont: Font = RenderingResources._effectFont;

    /**
     * The font to use for section marker labels shown above the music sheet.
     * @defaultValue `bold 14px Georgia, serif`
     * @since 0.9.6
     * @deprecated use {@link elementFonts} with {@link NotationElement.EffectMarker}
     */
    public get markerFont(): Font {
        return this.elementFonts.get(NotationElement.EffectMarker)!;
    }

    /**
     * @deprecated use {@link elementFonts} with {@link NotationElement.EffectMarker}
     */
    public set markerFont(value: Font) {
        this.elementFonts.set(NotationElement.EffectMarker, value);
    }

    /**
     * Ununsed, see deprecation note.
     * @defaultValue `italic 12px Georgia, serif`
     * @since 0.9.6
     * @deprecated use {@link elementFonts} with the respective
     * @json_ignore
     */
    public effectFont: Font = RenderingResources._effectFont;

    /**
     * The font to use for displaying the bar numbers above the music sheet.
     * @defaultValue `11px Arial, sans-serif`
     * @since 0.9.6
     * @deprecated use {@link elementFonts} with {@link NotationElement.BarNumber}
     */
    public get barNumberFont(): Font {
        return this.elementFonts.get(NotationElement.BarNumber)!;
    }

    /**
     * @deprecated use {@link elementFonts} with {@link NotationElement.BarNumber}
     */
    public set barNumberFont(value: Font) {
        this.elementFonts.set(NotationElement.BarNumber, value);
    }

    // NOTE: the main staff fonts are still own properties.

    /**
     * The fonts used by individual elements. Check `defaultFonts` for the elements which have custom fonts.
     * Removing fonts from this map can lead to unexpected side effects and errors. Only update it with new values.
     * @json_immutable
     */
    public readonly elementFonts: Map<NotationElement, Font> = new Map<NotationElement, Font>();

    /**
     * The font to use for displaying the numbered music notation in the music sheet.
     * @defaultValue `14px Arial, sans-serif`
     * @since 1.4.0
     */
    public numberedNotationFont: Font = new Font(RenderingResources._sansFont, 16, FontStyle.Plain);

    /**
     * The font to use for displaying the grace notes in numbered music notation in the music sheet.
     * @defaultValue `16px Arial, sans-serif`
     * @since 1.4.0
     */
    public numberedNotationGraceFont: Font = new Font(RenderingResources._sansFont, 14, FontStyle.Plain);

    /**
     * The font to use for displaying the guitar tablature numbers in the music sheet.
     * @defaultValue `13px Arial, sans-serif`
     * @since 0.9.6
     */
    public tablatureFont: Font = new Font(RenderingResources._sansFont, 14, FontStyle.Plain);

    /**
     * The font to use for grace notation related texts in the music sheet.
     * @defaultValue `11px Arial, sans-serif`
     * @since 0.9.6
     */
    public graceFont: Font = new Font(RenderingResources._sansFont, 12, FontStyle.Plain);

    /**
     * The color to use for rendering the lines of staves.
     * @defaultValue `rgb(165, 165, 165)`
     * @since 0.9.6
     */
    public staffLineColor: Color = new Color(165, 165, 165, 0xff);

    /**
     * The color to use for rendering bar separators, the accolade and repeat signs.
     * @defaultValue `rgb(34, 34, 17)`
     * @since 0.9.6
     */
    public barSeparatorColor: Color = new Color(34, 34, 17, 0xff);

    /**
     * The color to use for displaying the bar numbers above the music sheet.
     * @defaultValue `rgb(200, 0, 0)`
     * @since 0.9.6
     */
    public barNumberColor: Color = new Color(200, 0, 0, 0xff);

    /**
     * The color to use for music notation elements of the primary voice.
     * @defaultValue `rgb(0, 0, 0)`
     * @since 0.9.6
     */
    public mainGlyphColor: Color = new Color(0, 0, 0, 0xff);

    /**
     * The color to use for music notation elements of the secondary voices.
     * @defaultValue `rgb(0,0,0,0.4)`
     * @since 0.9.6
     */
    public secondaryGlyphColor: Color = new Color(0, 0, 0, 100);

    /**
     * The color to use for displaying the song information above the music sheets.
     * @defaultValue `rgb(0, 0, 0)`
     * @since 0.9.6
     */
    public scoreInfoColor: Color = new Color(0, 0, 0, 0xff);

    /**
     * The color used to fill the render surface at the start of each partial render.
     * @defaultValue `rgb(255, 255, 255)` (opaque white)
     * @remarks
     * The surface is filled with this color before any notation is drawn. The default opaque
     * white preserves the historical appearance where the host page provided a white background
     * behind a transparent canvas. Users whose host-page CSS was non-white will now see a white
     * surface where they previously saw their page color show through — to restore a fully
     * transparent surface, set this to a fully transparent color such as `new Color(0, 0, 0, 0)`.
     * Theme-driven values (e.g. the built-in `dark` theme) override this field via {@link applyFrom}.
     * @since 2.1
     */
    public backgroundColor: Color = new Color(255, 255, 255, 0xff);

    /**
     * The color applied to highlighted (selection/playback-active) beats.
     * @defaultValue `rgb(0, 0, 0)` (same as {@link mainGlyphColor})
     * @remarks
     * Emitted as the `--at-selection` CSS custom property on the `<svg>` root. The default
     * `.at-highlight` rule redefines `--at-foreground` to `var(--at-selection)` on highlighted
     * beat groups, so toggling the `at-highlight` class (done by the playback cursor) recolors
     * the beat instantly without re-render. Resolved from {@link RenderingThemeTokens.selection}
     * when a theme provides it, falling back to {@link mainGlyphColor} otherwise.
     * @since 2.1
     */
    public selectionColor: Color = new Color(0, 0, 0, 0xff);

    /**
     * The accent color for the playback cursor. Emitted as `--at-playback`.
     * @defaultValue `rgb(0, 0, 0)` (same as {@link mainGlyphColor})
     * @since 2.1
     */
    public playbackColor: Color = new Color(0, 0, 0, 0xff);

    /**
     * The color for error/invalid state glyphs. Emitted as `--at-error`.
     * @defaultValue `rgb(0, 0, 0)` (same as {@link mainGlyphColor})
     * @since 2.1
     */
    public errorColor: Color = new Color(0, 0, 0, 0xff);

    public constructor() {
        for (const [k, v] of RenderingResources.defaultFonts) {
            this.elementFonts.set(k, v.withSize(v.size));
        }
    }

    /**
     * Applies all color and font values from a {@link RenderingThemeDescriptor} to this instance.
     *
     * @remarks
     * Colors are assigned by reference (they are treated as immutable values).
     * Fonts are copied via {@link Font.withSize} so this instance never shares a mutable
     * {@link Font} object with the theme descriptor or its registry, mirroring the defensive
     * copy performed in the {@link RenderingResources} constructor.
     *
     * When the descriptor provides {@link RenderingThemeDescriptor.tokens}, the semantic tokens
     * are resolved into the terminal color fields and take precedence over any direct terminal
     * color values also set on the descriptor. When `tokens` is absent, the direct terminal
     * color fields are used (A-tier backward compatibility).
     *
     * @param theme The theme descriptor to copy values from.
     * @since 2.0
     * @internal
     */
    public applyFrom(theme: RenderingThemeDescriptor): void {
        if (theme.tokens) {
            const t = theme.tokens;
            this.staffLineColor = t.staffLine;
            this.barSeparatorColor = t.barSeparator;
            this.barNumberColor = t.barNumber;
            this.mainGlyphColor = t.foreground;
            this.secondaryGlyphColor = t.foregroundMuted;
            this.scoreInfoColor = t.scoreInfo;
            this.backgroundColor = t.background;
        } else {
            // A-tier backward-compat path: direct terminal fields (required by contract when no tokens).
            this.staffLineColor = theme.staffLineColor!;
            this.barSeparatorColor = theme.barSeparatorColor!;
            this.barNumberColor = theme.barNumberColor!;
            this.mainGlyphColor = theme.mainGlyphColor!;
            this.secondaryGlyphColor = theme.secondaryGlyphColor!;
            this.scoreInfoColor = theme.scoreInfoColor!;
            this.backgroundColor = theme.backgroundColor!;
        }
        // State colors are token-only (no terminal equivalents). When the theme provides
        // them, use them; otherwise fall back to the just-resolved foreground so every
        // theme gets sensible state colors without having to declare them.
        const resolvedTokens = theme.tokens;
        this.selectionColor = resolvedTokens?.selection ?? this.mainGlyphColor;
        this.playbackColor = resolvedTokens?.playback ?? this.mainGlyphColor;
        this.errorColor = resolvedTokens?.error ?? this.mainGlyphColor;
        this.tablatureFont = theme.tablatureFont.withSize(theme.tablatureFont.size);
        this.graceFont = theme.graceFont.withSize(theme.graceFont.size);
        this.numberedNotationFont = theme.numberedNotationFont.withSize(theme.numberedNotationFont.size);
        this.numberedNotationGraceFont = theme.numberedNotationGraceFont.withSize(
            theme.numberedNotationGraceFont.size
        );
        if (theme.smuflFont) {
            // Atomic: bind the font family name to its matching metrics so swapping a
            // music font (e.g. Bravura to Petaluma) carries the metrics with it.
            this.smuflFontFamilyName = theme.smuflFont.familyName;
            this.engravingSettings = theme.smuflFont.engravingSettings;
        } else {
            this.smuflFontFamilyName = theme.smuflFontFamilyName;
            // engravingSettings left untouched (defaults to Bravura) when only the
            // family name is overridden — see RenderingThemeDescriptor.smuflFontFamilyName.
        }
        this.elementFonts.clear();
        for (const [k, v] of theme.elementFonts) {
            this.elementFonts.set(k, v.withSize(v.size));
        }
    }

    /**
     * @internal
     * @param element
     */
    public getFontForElement(element: ScoreSubElement): Font {
        let notationElement = NotationElement.ScoreWords;
        switch (element) {
            case ScoreSubElement.Title:
                notationElement = NotationElement.ScoreTitle;
                break;
            case ScoreSubElement.SubTitle:
                notationElement = NotationElement.ScoreSubTitle;
                break;
            case ScoreSubElement.Artist:
                notationElement = NotationElement.ScoreArtist;
                break;
            case ScoreSubElement.Album:
                notationElement = NotationElement.ScoreAlbum;
                break;
            case ScoreSubElement.Words:
                notationElement = NotationElement.ScoreWords;
                break;
            case ScoreSubElement.Music:
                notationElement = NotationElement.ScoreMusic;
                break;
            case ScoreSubElement.WordsAndMusic:
                notationElement = NotationElement.ScoreWordsAndMusic;
                break;
            case ScoreSubElement.Copyright:
            case ScoreSubElement.CopyrightSecondLine:
                notationElement = NotationElement.ScoreCopyright;
                break;
            default:
                notationElement = NotationElement.ScoreWords;
                break;
        }

        return this.elementFonts.has(notationElement)
            ? this.elementFonts.get(notationElement)!
            : RenderingResources.defaultFonts.get(NotationElement.ScoreWords)!;
    }
}

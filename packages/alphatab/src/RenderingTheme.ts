import { Color } from '@coderline/alphatab/model/Color';
import { Font, FontStyle, FontWeight } from '@coderline/alphatab/model/Font';
import { NotationElement } from '@coderline/alphatab/NotationSettings';
import type { EngravingSettings } from '@coderline/alphatab/EngravingSettings';

/**
 * Minimal interface for objects that can receive theme values.
 * Avoids circular dependency between RenderingTheme and RenderingResources.
 * @internal
 */
export interface IThemeableResources {
    staffLineColor: Color;
    barSeparatorColor: Color;
    barNumberColor: Color;
    mainGlyphColor: Color;
    secondaryGlyphColor: Color;
    scoreInfoColor: Color;
    backgroundColor: Color;
    elementFonts: Map<NotationElement, Font>;
    tablatureFont: Font;
    graceFont: Font;
    numberedNotationFont: Font;
    numberedNotationGraceFont: Font;
    smuflFontFamilyName?: string;
    applyFrom(theme: RenderingThemeDescriptor): void;
}

/**
 * Author-facing semantic color slots for a {@link RenderingThemeDescriptor}.
 *
 * @remarks
 * Each token maps 1:1 to a terminal color field on {@link RenderingResources}
 * and is resolved by {@link RenderingResources.applyFrom} when present. Tokens
 * take precedence over any direct terminal color fields also set on the
 * descriptor. When `tokens` is absent, the descriptor's direct terminal color
 * fields are used as-is (A-tier backward compatibility).
 *
 * Token → terminal field mapping:
 *   - `background`      → `backgroundColor`      (render-surface fill)
 *   - `foreground`      → `mainGlyphColor`       (primary voice notation)
 *   - `foregroundMuted` → `secondaryGlyphColor`  (secondary voices, dimmed)
 *   - `staffLine`       → `staffLineColor`       (staff lines)
 *   - `barSeparator`    → `barSeparatorColor`    (barlines, accolade, repeats)
 *   - `barNumber`       → `barNumberColor`        (bar index numerals)
 *   - `scoreInfo`       → `scoreInfoColor`        (title/artist/copyright header)
 *
 * @public
 * @since 2.1
 */
export interface RenderingThemeTokens {
    /** Render-surface fill color (resolves to {@link RenderingResources.backgroundColor}). */
    background: Color;
    /** Primary voice notation color (resolves to {@link RenderingResources.mainGlyphColor}). */
    foreground: Color;
    /** Secondary voice notation color, typically dimmed (resolves to {@link RenderingResources.secondaryGlyphColor}). */
    foregroundMuted: Color;
    /** Staff line color (resolves to {@link RenderingResources.staffLineColor}). */
    staffLine: Color;
    /** Bar separator / accolade / repeat sign color (resolves to {@link RenderingResources.barSeparatorColor}). */
    barSeparator: Color;
    /** Bar number numeral color (resolves to {@link RenderingResources.barNumberColor}). */
    barNumber: Color;
    /** Score header info color — title, artist, copyright (resolves to {@link RenderingResources.scoreInfoColor}). */
    scoreInfo: Color;
}

/**
 * Describes the visual appearance of a rendering theme including colors and fonts.
 * @public
 * @since 2.0
 */
export interface RenderingThemeDescriptor {
    /**
     * The unique name for this theme.
     */
    name: string;

    /**
     * Semantic color tokens. When present, these are resolved into the terminal
     * color fields ({@link staffLineColor}, {@link barSeparatorColor}, etc.) by
     * {@link RenderingResources.applyFrom} and take precedence over any direct
     * terminal color values set on this descriptor. When absent, the direct
     * terminal color fields below are used (A-tier backward compatibility).
     *
     * A descriptor must provide either `tokens` or all seven terminal color
     * fields.
     * @since 2.1
     */
    tokens?: RenderingThemeTokens;

    /**
     * The color for staff lines. Overridden by {@link tokens.staffLine} when
     * {@link tokens} is present.
     */
    staffLineColor?: Color;

    /**
     * The color for bar separators, accolade, and repeat signs. Overridden by
     * {@link tokens.barSeparator} when {@link tokens} is present.
     */
    barSeparatorColor?: Color;

    /**
     * The color for bar numbers. Overridden by {@link tokens.barNumber} when
     * {@link tokens} is present.
     */
    barNumberColor?: Color;

    /**
     * The color for primary voice music notation elements. Overridden by
     * {@link tokens.foreground} when {@link tokens} is present.
     */
    mainGlyphColor?: Color;

    /**
     * The color for secondary voice music notation elements. Overridden by
     * {@link tokens.foregroundMuted} when {@link tokens} is present.
     */
    secondaryGlyphColor?: Color;

    /**
     * The color for song title, artist, copyright and other header/footer info.
     * Overridden by {@link tokens.scoreInfo} when {@link tokens} is present.
     */
    scoreInfoColor?: Color;

    /**
     * The color used to fill the render surface at the start of each partial render.
     * Overridden by {@link tokens.background} when {@link tokens} is present.
     * @since 2.1
     */
    backgroundColor?: Color;

    /**
     * The per-element fonts used for notation elements.
     */
    elementFonts: Map<NotationElement, Font>;

    /**
     * The font for guitar tablature numbers.
     */
    tablatureFont: Font;

    /**
     * The font for grace notation related texts.
     */
    graceFont: Font;

    /**
     * The font for numbered music notation.
     */
    numberedNotationFont: Font;

    /**
     * The font for grace notes in numbered music notation.
     */
    numberedNotationGraceFont: Font;

    /**
     * Optional SMuFL font family name override.
     *
     * @remarks
     * Setting this only changes the font family name used for music symbols; it does **not**
     * adjust the SMuFL metrics ({@link RenderingResources.engravingSettings}). Mismatched
     * metrics can cause symbol positioning artifacts, so a theme that ships a custom SMuFL
     * font family should be paired with matching engraving settings configured separately.
     * Prefer {@link smuflFont} (which binds name + metrics atomically) when shipping a
     * non-Bravura music font.
     */
    smuflFontFamilyName?: string;

    /**
     * Optional SMuFL font bundle binding a font family name to its matching
     * {@link EngravingSettings} metrics.
     *
     * @remarks
     * When present, {@link RenderingResources.applyFrom} sets BOTH
     * {@link RenderingResources.smuflFontFamilyName} AND
     * {@link RenderingResources.engravingSettings} from this bundle, so swapping a music
     * font (e.g. Bravura to Petaluma) carries its metrics with it and avoids glyph
     * positioning drift. This is the atomic alternative to setting {@link smuflFontFamilyName}
     * alone (which leaves metrics at the Bravura default).
     *
     * Note: a host page that loads a webfont via `core.smuflFontSources` will still
     * overwrite `smuflFontFamilyName` at load time (see BrowserUiFacade); this bundle
     * takes effect only when the consumer has not loaded a webfont.
     *
     * @since 2.1
     */
    smuflFont?: RenderingThemeSmuflFont;
}

/**
 * A music-font bundle pairing a SMuFL family name with its matching engraving metrics.
 * @public
 * @since 2.1
 */
export interface RenderingThemeSmuflFont {
    /** The SMuFL font family name to use for music symbols. */
    familyName: string;
    /** The engraving metrics matching {@link familyName} (e.g. Bravura or Petaluma). */
    engravingSettings: EngravingSettings;
}

// Shared font instances used across built-in themes
const _sansFont = 'Arial, sans-serif';
const _serifFont = 'Georgia, serif';
const _effectFont = new Font(_serifFont, 12, FontStyle.Italic);

function defaultElementFonts(): Map<NotationElement, Font> {
    return new Map<NotationElement, Font>([
        [NotationElement.ScoreTitle, new Font(_serifFont, 32, FontStyle.Plain)],
        [NotationElement.ScoreSubTitle, new Font(_serifFont, 20, FontStyle.Plain)],
        [NotationElement.ScoreArtist, new Font(_serifFont, 20, FontStyle.Plain)],
        [NotationElement.ScoreAlbum, new Font(_serifFont, 20, FontStyle.Plain)],
        [NotationElement.ScoreWords, new Font(_serifFont, 15, FontStyle.Plain)],
        [NotationElement.ScoreMusic, new Font(_serifFont, 15, FontStyle.Plain)],
        [NotationElement.ScoreWordsAndMusic, new Font(_serifFont, 15, FontStyle.Plain)],
        [NotationElement.ScoreCopyright, new Font(_sansFont, 12, FontStyle.Plain, FontWeight.Bold)],
        [NotationElement.EffectBeatTimer, new Font(_serifFont, 12, FontStyle.Plain)],
        [NotationElement.EffectDirections, new Font(_serifFont, 14, FontStyle.Plain)],
        [NotationElement.ChordDiagramFretboardNumbers, new Font(_sansFont, 11, FontStyle.Plain)],
        [NotationElement.EffectFingering, new Font(_serifFont, 14, FontStyle.Plain)],
        [NotationElement.EffectMarker, new Font(_serifFont, 14, FontStyle.Plain, FontWeight.Bold)],
        [NotationElement.EffectCapo, _effectFont],
        [NotationElement.EffectFreeTime, _effectFont],
        [NotationElement.EffectLyrics, _effectFont],
        [NotationElement.EffectTap, _effectFont],
        [NotationElement.ChordDiagrams, _effectFont],
        [NotationElement.EffectChordNames, _effectFont],
        [NotationElement.EffectText, _effectFont],
        [NotationElement.EffectPalmMute, _effectFont],
        [NotationElement.EffectLetRing, _effectFont],
        [NotationElement.EffectBeatBarre, _effectFont],
        [NotationElement.EffectTripletFeel, _effectFont],
        [NotationElement.EffectHarmonics, _effectFont],
        [NotationElement.EffectPickSlide, _effectFont],
        [NotationElement.GuitarTuning, _effectFont],
        [NotationElement.EffectRasgueado, _effectFont],
        [NotationElement.EffectWhammyBar, _effectFont],
        [NotationElement.TrackNames, _effectFont],
        [NotationElement.RepeatCount, new Font(_sansFont, 11, FontStyle.Plain)],
        [NotationElement.BarNumber, new Font(_sansFont, 11, FontStyle.Plain)],
        [NotationElement.ScoreBendSlur, new Font(_sansFont, 11, FontStyle.Plain)],
        [NotationElement.EffectAlternateEndings, new Font(_serifFont, 15, FontStyle.Plain)]
    ]);
}

// Shared default fonts for built-in themes
const _defaultTablatureFont = new Font(_sansFont, 14, FontStyle.Plain);
const _defaultGraceFont = new Font(_sansFont, 12, FontStyle.Plain);
const _defaultNumberedNotationFont = new Font(_sansFont, 16, FontStyle.Plain);
const _defaultNumberedNotationGraceFont = new Font(_sansFont, 14, FontStyle.Plain);

/**
 * Provides a global registry of named rendering themes that can be applied to
 * {@link RenderingResources} for consistent visual styling.
 *
 * @example
 * ```typescript
 * // Switch to a built-in theme
 * settings.display.theme = 'dark';
 *
 * // Register and use a custom theme
 * RenderingTheme.register('my-custom', {
 *     name: 'my-custom',
 *     staffLineColor: new Color(100, 100, 200),
 *     barSeparatorColor: new Color(50, 50, 100),
 *     barNumberColor: new Color(200, 50, 50),
 *     mainGlyphColor: new Color(0, 0, 0),
 *     secondaryGlyphColor: new Color(0, 0, 0, 100),
 *     scoreInfoColor: new Color(0, 0, 0),
 *     elementFonts: RenderingResources.defaultFonts,
 *     tablatureFont: new Font('Arial, sans-serif', 14),
 *     graceFont: new Font('Arial, sans-serif', 12),
 *     numberedNotationFont: new Font('Arial, sans-serif', 16),
 *     numberedNotationGraceFont: new Font('Arial, sans-serif', 14),
 * });
 * ```
 *
 * @public
 * @since 2.0
 */
export class RenderingTheme {
    /**
     * The names of the built-in themes that cannot be unregistered.
     */
    private static readonly _builtins: ReadonlySet<string> = new Set(['light', 'dark', 'sepia']);

    /**
     * The registry of all registered rendering themes, pre-populated with the built-in themes.
     */
    public static readonly registry: Map<string, RenderingThemeDescriptor> = RenderingTheme._withBuiltins(
        new Map<string, RenderingThemeDescriptor>()
    );

    private static _withBuiltins(
        registry: Map<string, RenderingThemeDescriptor>
    ): Map<string, RenderingThemeDescriptor> {
        // --- light theme: current alphaTab defaults ---
        registry.set('light', {
            name: 'light',
            tokens: {
                background: new Color(255, 255, 255, 0xff),
                foreground: new Color(0, 0, 0, 0xff),
                foregroundMuted: new Color(0, 0, 0, 100),
                staffLine: new Color(165, 165, 165, 0xff),
                barSeparator: new Color(34, 34, 17, 0xff),
                barNumber: new Color(200, 0, 0, 0xff),
                scoreInfo: new Color(0, 0, 0, 0xff)
            },
            elementFonts: defaultElementFonts(),
            tablatureFont: _defaultTablatureFont,
            graceFont: _defaultGraceFont,
            numberedNotationFont: _defaultNumberedNotationFont,
            numberedNotationGraceFont: _defaultNumberedNotationGraceFont
        });

        // --- dark theme: light glyphs on dark backgrounds ---
        registry.set('dark', {
            name: 'dark',
            tokens: {
                background: new Color(34, 34, 34, 0xff),
                foreground: new Color(220, 220, 220, 0xff),
                foregroundMuted: new Color(220, 220, 220, 100),
                staffLine: new Color(100, 100, 100, 0xff),
                barSeparator: new Color(200, 200, 190, 0xff),
                barNumber: new Color(255, 80, 80, 0xff),
                scoreInfo: new Color(220, 220, 220, 0xff)
            },
            elementFonts: defaultElementFonts(),
            tablatureFont: _defaultTablatureFont,
            graceFont: _defaultGraceFont,
            numberedNotationFont: _defaultNumberedNotationFont,
            numberedNotationGraceFont: _defaultNumberedNotationGraceFont
        });

        // --- sepia theme: warm, low-contrast tones ---
        registry.set('sepia', {
            name: 'sepia',
            tokens: {
                background: new Color(245, 235, 220, 0xff),
                foreground: new Color(60, 40, 20, 0xff),
                foregroundMuted: new Color(60, 40, 20, 100),
                staffLine: new Color(180, 170, 150, 0xff),
                barSeparator: new Color(80, 60, 30, 0xff),
                barNumber: new Color(180, 80, 40, 0xff),
                scoreInfo: new Color(60, 40, 20, 0xff)
            },
            elementFonts: defaultElementFonts(),
            tablatureFont: _defaultTablatureFont,
            graceFont: _defaultGraceFont,
            numberedNotationFont: _defaultNumberedNotationFont,
            numberedNotationGraceFont: _defaultNumberedNotationGraceFont
        });

        return registry;
    }

    /**
     * Registers a new theme with the given name.
     * If a theme with the same name already exists, it will be replaced.
     *
     * @param name The unique name for this theme.
     * @param theme The theme descriptor.
     */
    public static register(name: string, theme: RenderingThemeDescriptor): void {
        RenderingTheme.registry.set(name, theme);
    }

    /**
     * Unregisters a theme by name.
     * Built-in themes ('light', 'dark', 'sepia') cannot be unregistered.
     *
     * @param name The name of the theme to unregister.
     * @returns `true` if the theme was removed, `false` if it was not found or is a built-in.
     */
    public static unregister(name: string): boolean {
        if (RenderingTheme._builtins.has(name)) {
            return false;
        }
        return RenderingTheme.registry.delete(name);
    }

    /**
     * Gets a registered theme by name.
     *
     * @param name The name of the theme.
     * @returns The theme descriptor, or `undefined` if not found.
     */
    public static get(name: string): RenderingThemeDescriptor | undefined {
        return RenderingTheme.registry.get(name);
    }

    /**
     * Applies a registered theme to a {@link RenderingResources} instance.
     *
     * @param name The name of the registered theme to apply.
     * @param resources The resources instance to update.
     * @returns `true` if the theme was found and applied, `false` otherwise.
     */
    public static apply(name: string, resources: IThemeableResources): boolean {
        const theme = RenderingTheme.registry.get(name);
        if (!theme) {
            return false;
        }
        resources.applyFrom(theme);
        return true;
    }

    /**
     * Registers a theme that derives from an already-registered parent, inheriting
     * its colors and fonts and overriding only the fields supplied in `patch`.
     *
     * @remarks
     * This is the supported way to "theme on top of a theme" — e.g. a brand variant
     * of `dark` that only swaps the foreground color. The parent's resolved
     * {@link RenderingThemeDescriptor.tokens} and fonts are snapshot into the new
     * descriptor at registration time (so later re-/un-registration of the parent
     * does not silently change the derived theme). Built-in parents (`light`/
     * `dark`/`sepia`) cannot be unregistered, so extending them is always safe.
     *
     * `patch.tokens`, when provided, is merged field-by-field over the parent's
     * tokens (not a full replace) — omit a token to inherit the parent's value.
     * Likewise `patch.elementFonts` entries are merged into the parent's font map.
     *
     * @param name The unique name for the derived theme. Replaces an existing theme
     * with the same name (built-ins cannot be replaced).
     * @param parentName The name of the registered theme to inherit from.
     * @param patch The fields to override on top of the parent.
     * @returns `true` if the parent was found and the derived theme was registered;
     * `false` if the parent does not exist (nothing is registered).
     * @since 2.1
     */
    public static extend(
        name: string,
        parentName: string,
        patch: Partial<Omit<RenderingThemeDescriptor, 'name'>> & {
            tokens?: Partial<RenderingThemeTokens>;
        }
    ): boolean {
        const parent = RenderingTheme.registry.get(parentName);
        if (!parent) {
            return false;
        }

        // Merge tokens field-by-field so callers can override a single slot.
        const tokens: RenderingThemeTokens = parent.tokens
            ? { ...parent.tokens, ...patch.tokens }
            : patch.tokens
              ? (patch.tokens as RenderingThemeTokens)
              : undefined!;

        // Merge element-fonts: parent map (copied) overlaid with patch entries.
        const elementFonts = new Map<NotationElement, Font>();
        if (parent.elementFonts) {
            for (const [k, v] of parent.elementFonts) {
                elementFonts.set(k, v);
            }
        }
        if (patch.elementFonts) {
            for (const [k, v] of patch.elementFonts) {
                elementFonts.set(k, v);
            }
        }

        const descriptor: RenderingThemeDescriptor = {
            name,
            tokens,
            elementFonts,
            tablatureFont: patch.tablatureFont ?? parent.tablatureFont,
            graceFont: patch.graceFont ?? parent.graceFont,
            numberedNotationFont: patch.numberedNotationFont ?? parent.numberedNotationFont,
            numberedNotationGraceFont: patch.numberedNotationGraceFont ?? parent.numberedNotationGraceFont,
            smuflFontFamilyName: patch.smuflFontFamilyName ?? parent.smuflFontFamilyName,
            smuflFont: patch.smuflFont ?? parent.smuflFont
        };

        RenderingTheme.registry.set(name, descriptor);
        return true;
    }
}

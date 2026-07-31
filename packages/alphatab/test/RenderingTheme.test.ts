import { Color } from '@coderline/alphatab/model/Color';
import { Font } from '@coderline/alphatab/model/Font';
import { NotationElement } from '@coderline/alphatab/NotationSettings';
import { RenderingResources } from '@coderline/alphatab/RenderingResources';
import { RenderingTheme } from '@coderline/alphatab/RenderingTheme';
import { Settings } from '@coderline/alphatab/Settings';
import { assert } from 'chai';

describe('RenderingThemeTests', () => {
    it('registers-built-in-themes', () => {
        assert.isDefined(RenderingTheme.get('light'));
        assert.isDefined(RenderingTheme.get('dark'));
        assert.isDefined(RenderingTheme.get('sepia'));
    });

    it('prevents-unregistering-built-in-themes', () => {
        assert.isFalse(RenderingTheme.unregister('light'));
        assert.isDefined(RenderingTheme.get('light'));
    });

    it('applies-theme-colors-to-resources', () => {
        const resources = new RenderingResources();
        const before = resources.mainGlyphColor.rgba;
        const beforeBg = resources.backgroundColor.rgba;
        RenderingTheme.apply('dark', resources);
        assert.notStrictEqual(resources.mainGlyphColor.rgba, before);
        assert.notStrictEqual(resources.backgroundColor.rgba, beforeBg);
    });

    it('returns-false-for-unknown-theme', () => {
        const resources = new RenderingResources();
        assert.isFalse(RenderingTheme.apply('does-not-exist', resources));
    });

    it('does-not-share-mutable-fonts-across-resources', () => {
        // Regression guard: applying the same theme to multiple resources must not make
        // them share a single Font instance (which would let one instance's rescaling
        // leak into another or back into the registry).
        const a = new RenderingResources();
        const b = new RenderingResources();
        RenderingTheme.apply('dark', a);
        RenderingTheme.apply('dark', b);

        assert.notStrictEqual(a.tablatureFont, b.tablatureFont);
        assert.notStrictEqual(a.graceFont, b.graceFont);
        assert.notStrictEqual(a.numberedNotationFont, b.numberedNotationFont);
        assert.notStrictEqual(a.numberedNotationGraceFont, b.numberedNotationGraceFont);

        // elementFonts entries must also be per-instance.
        assert.notStrictEqual(
            a.elementFonts.get(NotationElement.ScoreTitle),
            b.elementFonts.get(NotationElement.ScoreTitle)
        );
    });

    it('does-not-share-fonts-with-registry-descriptor', () => {
        const resources = new RenderingResources();
        RenderingTheme.apply('dark', resources);
        const descriptor = RenderingTheme.get('dark')!;

        assert.notStrictEqual(resources.tablatureFont, descriptor.tablatureFont);
        assert.notStrictEqual(resources.graceFont, descriptor.graceFont);
        assert.notStrictEqual(resources.numberedNotationFont, descriptor.numberedNotationFont);
        assert.notStrictEqual(
            resources.numberedNotationGraceFont,
            descriptor.numberedNotationGraceFont
        );
    });

    it('applies-theme-through-settings', () => {
        const settings = new Settings();
        settings.display.theme = 'dark';
        settings.display.applyCurrentTheme();

        const dark = RenderingTheme.get('dark')!;
        const darkTokens = dark.tokens!;
        assert.strictEqual(settings.display.resources.mainGlyphColor.rgba, darkTokens.foreground.rgba);
        assert.strictEqual(
            settings.display.resources.backgroundColor.rgba,
            darkTokens.background.rgba
        );
    });

    it('leaves-resources-untouched-when-theme-is-undefined', () => {
        const settings = new Settings();
        const before = settings.display.resources.mainGlyphColor.rgba;
        settings.display.applyCurrentTheme();
        assert.strictEqual(settings.display.resources.mainGlyphColor.rgba, before);
    });

    it('supports-custom-theme-registration', () => {
        const resources = new RenderingResources();
        const base = RenderingTheme.get('light')!;
        RenderingTheme.register('custom-test-theme', {
            ...base,
            name: 'custom-test-theme',
            // base now uses tokens; override a token (terminal-field overrides would be ignored).
            tokens: { ...base.tokens!, foreground: base.tokens!.foreground }
        });
        try {
            assert.isTrue(RenderingTheme.apply('custom-test-theme', resources));
            assert.isTrue(RenderingTheme.unregister('custom-test-theme'));
            assert.isUndefined(RenderingTheme.get('custom-test-theme'));
        } finally {
            RenderingTheme.unregister('custom-test-theme');
        }
    });

    it('built-in-themes-have-distinct-backgrounds', () => {
        const light = RenderingTheme.get('light')!;
        const dark = RenderingTheme.get('dark')!;
        const sepia = RenderingTheme.get('sepia')!;
        assert.strictEqual(light.tokens!.background.rgba, '#FFFFFF');
        assert.strictEqual(dark.tokens!.background.rgba, '#222222');
        assert.strictEqual(sepia.tokens!.background.rgba, '#F5EBDC');
    });

    it('default-resources-background-is-white', () => {
        // Guards the visual-baseline-preserving default: opaque white.
        const resources = new RenderingResources();
        assert.strictEqual(resources.backgroundColor.rgba, '#FFFFFF');
    });

    it('built-in-themes-define-tokens', () => {
        for (const name of ['light', 'dark', 'sepia']) {
            const t = RenderingTheme.get(name)!;
            assert.isDefined(t.tokens, `${name} should define tokens`);
            // token-based built-ins should not set terminal color fields directly
            assert.isUndefined(t.staffLineColor, `${name} should not set terminal staffLineColor directly`);
            assert.isUndefined(t.backgroundColor, `${name} should not set terminal backgroundColor directly`);
        }
    });

    it('tokens-resolve-to-correct-terminal-fields', () => {
        const resources = new RenderingResources();
        RenderingTheme.apply('light', resources);
        const t = RenderingTheme.get('light')!.tokens!;
        assert.strictEqual(resources.backgroundColor.rgba, t.background.rgba);
        assert.strictEqual(resources.mainGlyphColor.rgba, t.foreground.rgba);
        assert.strictEqual(resources.secondaryGlyphColor.raw, t.foregroundMuted.raw);
        assert.strictEqual(resources.staffLineColor.rgba, t.staffLine.rgba);
        assert.strictEqual(resources.barSeparatorColor.rgba, t.barSeparator.rgba);
        assert.strictEqual(resources.barNumberColor.rgba, t.barNumber.rgba);
        assert.strictEqual(resources.scoreInfoColor.rgba, t.scoreInfo.rgba);
    });

    it('built-in-themes-preserve-visual-baseline', () => {
        // Bit-identical to pre-B-tier terminal values (regression guard against accidental color drift).
        const r = new RenderingResources();
        RenderingTheme.apply('light', r);
        assert.strictEqual(r.backgroundColor.rgba, '#FFFFFF');
        assert.strictEqual(r.mainGlyphColor.rgba, '#000000');
        assert.strictEqual(r.secondaryGlyphColor.raw, new Color(0, 0, 0, 100).raw);
        assert.strictEqual(r.staffLineColor.rgba, '#A5A5A5');
        assert.strictEqual(r.barSeparatorColor.rgba, '#222211');
        assert.strictEqual(r.barNumberColor.rgba, '#C80000');
        assert.strictEqual(r.scoreInfoColor.rgba, '#000000');

        const d = new RenderingResources();
        RenderingTheme.apply('dark', d);
        assert.strictEqual(d.backgroundColor.rgba, '#222222');
        assert.strictEqual(d.mainGlyphColor.rgba, '#DCDCDC');
        assert.strictEqual(d.barNumberColor.rgba, '#FF5050');

        const s = new RenderingResources();
        RenderingTheme.apply('sepia', s);
        assert.strictEqual(s.backgroundColor.rgba, '#F5EBDC');
        assert.strictEqual(s.mainGlyphColor.rgba, '#3C2814');
        assert.strictEqual(s.barNumberColor.rgba, '#B45028');
    });

    it('custom-theme-defined-via-tokens-only-works', () => {
        const resources = new RenderingResources();
        RenderingTheme.register('tokens-only-test', {
            name: 'tokens-only-test',
            tokens: {
                background: new Color(10, 20, 30, 0xff),
                foreground: new Color(200, 210, 220, 0xff),
                foregroundMuted: new Color(200, 210, 220, 100),
                staffLine: new Color(80, 80, 80, 0xff),
                barSeparator: new Color(120, 120, 120, 0xff),
                barNumber: new Color(255, 0, 255, 0xff),
                scoreInfo: new Color(200, 210, 220, 0xff)
            },
            elementFonts: RenderingResources.defaultFonts,
            tablatureFont: new Font('Arial, sans-serif', 14),
            graceFont: new Font('Arial, sans-serif', 12),
            numberedNotationFont: new Font('Arial, sans-serif', 16),
            numberedNotationGraceFont: new Font('Arial, sans-serif', 14)
        });
        try {
            assert.isTrue(RenderingTheme.apply('tokens-only-test', resources));
            assert.strictEqual(resources.backgroundColor.rgba, '#0A141E');
            assert.strictEqual(resources.mainGlyphColor.rgba, '#C8D2DC');
            assert.strictEqual(resources.barNumberColor.rgba, '#FF00FF');
            assert.strictEqual(resources.staffLineColor.rgba, '#505050');
        } finally {
            RenderingTheme.unregister('tokens-only-test');
        }
    });

    it('ater-custom-theme-with-terminal-fields-still-applies', () => {
        // Backward compat: an A-tier descriptor (terminal fields, no tokens) must still work.
        const resources = new RenderingResources();
        const base = RenderingTheme.get('light')!;
        const t = base.tokens!;
        RenderingTheme.register('terminal-fields-test', {
            name: 'terminal-fields-test',
            staffLineColor: t.staffLine,
            barSeparatorColor: t.barSeparator,
            barNumberColor: t.barNumber,
            mainGlyphColor: t.foreground,
            secondaryGlyphColor: t.foregroundMuted,
            scoreInfoColor: t.scoreInfo,
            backgroundColor: t.background,
            elementFonts: RenderingResources.defaultFonts,
            tablatureFont: new Font('Arial, sans-serif', 14),
            graceFont: new Font('Arial, sans-serif', 12),
            numberedNotationFont: new Font('Arial, sans-serif', 16),
            numberedNotationGraceFont: new Font('Arial, sans-serif', 14)
        });
        try {
            assert.isTrue(RenderingTheme.apply('terminal-fields-test', resources));
            assert.strictEqual(resources.backgroundColor.rgba, t.background.rgba);
            assert.strictEqual(resources.mainGlyphColor.rgba, t.foreground.rgba);
            assert.strictEqual(resources.barNumberColor.rgba, t.barNumber.rgba);
        } finally {
            RenderingTheme.unregister('terminal-fields-test');
        }
    });

    it('tokens-take-precedence-over-terminal-fields', () => {
        // When BOTH tokens and terminal fields are present, tokens win.
        const resources = new RenderingResources();
        RenderingTheme.register('precedence-test', {
            name: 'precedence-test',
            tokens: {
                background: new Color(1, 2, 3, 0xff),
                foreground: new Color(4, 5, 6, 0xff),
                foregroundMuted: new Color(7, 8, 9, 0xff),
                staffLine: new Color(10, 11, 12, 0xff),
                barSeparator: new Color(13, 14, 15, 0xff),
                barNumber: new Color(16, 17, 18, 0xff),
                scoreInfo: new Color(19, 20, 21, 0xff)
            },
            // conflicting terminal fields — must be ignored
            staffLineColor: new Color(255, 255, 255, 0xff),
            barSeparatorColor: new Color(255, 255, 255, 0xff),
            barNumberColor: new Color(255, 255, 255, 0xff),
            mainGlyphColor: new Color(255, 255, 255, 0xff),
            secondaryGlyphColor: new Color(255, 255, 255, 0xff),
            scoreInfoColor: new Color(255, 255, 255, 0xff),
            backgroundColor: new Color(255, 255, 255, 0xff),
            elementFonts: RenderingResources.defaultFonts,
            tablatureFont: new Font('Arial, sans-serif', 14),
            graceFont: new Font('Arial, sans-serif', 12),
            numberedNotationFont: new Font('Arial, sans-serif', 16),
            numberedNotationGraceFont: new Font('Arial, sans-serif', 14)
        });
        try {
            RenderingTheme.apply('precedence-test', resources);
            assert.strictEqual(resources.backgroundColor.rgba, '#010203');
            assert.strictEqual(resources.mainGlyphColor.rgba, '#040506');
            assert.strictEqual(resources.staffLineColor.rgba, '#0A0B0C');
        } finally {
            RenderingTheme.unregister('precedence-test');
        }
    });
});

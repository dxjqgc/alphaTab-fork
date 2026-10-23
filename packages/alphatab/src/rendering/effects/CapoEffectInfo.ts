import type { Beat } from '@coderline/alphatab/model/Beat';
import { TextAlign } from '@coderline/alphatab/platform/ICanvas';
import type { BarRendererBase } from '@coderline/alphatab/rendering/BarRendererBase';
import { EffectBarGlyphSizing } from '@coderline/alphatab/rendering/EffectBarGlyphSizing';
import type { EffectGlyph } from '@coderline/alphatab/rendering/glyphs/EffectGlyph';
import { TextGlyph } from '@coderline/alphatab/rendering/glyphs/TextGlyph';
import { EffectInfo } from '@coderline/alphatab/rendering/EffectInfo';
import type { Settings } from '@coderline/alphatab/Settings';
import { NotationElement } from '@coderline/alphatab/NotationSettings';

/**
 * @internal
 */
export class CapoEffectInfo extends EffectInfo {
    public get notationElement(): NotationElement {
        return NotationElement.EffectCapo;
    }

    public get hideOnMultiTrack(): boolean {
        return false;
    }

    public get canShareBand(): boolean {
        return false;
    }

    public get sizingMode(): EffectBarGlyphSizing {
        return EffectBarGlyphSizing.SingleOnBeat;
    }

    public shouldCreateGlyph(_settings: Settings, _beat: Beat): boolean {
        // The capo is page-level information: it is drawn ONCE in the score-info
        // corner (left edge, next to the tuning info — see
        // ScoreLayout._createScoreInfoGlyphs), not glued to the first beat of
        // the first bar where it used to sit. The notation element is kept
        // because NotationElement.EffectCapo still gates that corner glyph
        // (and provides its element font), but no beat-bound glyph is created.
        return false;
    }

    public createNewGlyph(renderer: BarRendererBase, beat: Beat): EffectGlyph {
        return new TextGlyph(
            0,
            0,
            `Capo = ${beat.voice.bar.staff.capo}`,
            renderer.resources.elementFonts.get(NotationElement.EffectCapo)!,
            TextAlign.Left
        );
    }

    public canExpand(_from: Beat, _to: Beat): boolean {
        return false;
    }
}

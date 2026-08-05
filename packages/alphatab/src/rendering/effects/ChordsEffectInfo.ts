import type { Beat } from '@coderline/alphatab/model/Beat';
import { TextAlign } from '@coderline/alphatab/platform/ICanvas';
import type { BarRendererBase } from '@coderline/alphatab/rendering/BarRendererBase';
import { EffectBarGlyphSizing } from '@coderline/alphatab/rendering/EffectBarGlyphSizing';
import type { EffectBand } from '@coderline/alphatab/rendering/EffectBand';
import type { EffectGlyph } from '@coderline/alphatab/rendering/glyphs/EffectGlyph';
import { TextGlyph } from '@coderline/alphatab/rendering/glyphs/TextGlyph';
import { EffectInfo } from '@coderline/alphatab/rendering/EffectInfo';
import type { Settings } from '@coderline/alphatab/Settings';
import { NotationElement } from '@coderline/alphatab/NotationSettings';
import { ChordDiagramGlyph } from '@coderline/alphatab/rendering/glyphs/ChordDiagramGlyph';

/**
 * @internal
 */
export class ChordsEffectInfo extends EffectInfo {
    /**
     * Minimum gap in pixels between adjacent chord diagrams/names
     * to prevent them from touching or overlapping.
     */
    private static readonly _minChordGap: number = 2;

    public get notationElement(): NotationElement {
        return NotationElement.EffectChordNames;
    }

    public get hideOnMultiTrack(): boolean {
        return false;
    }

    public get canShareBand(): boolean {
        return true;
    }

    public get sizingMode(): EffectBarGlyphSizing {
        return EffectBarGlyphSizing.SingleOnBeat;
    }

    public shouldCreateGlyph(_settings: Settings, beat: Beat): boolean {
        // beat.hasChord 仅判断 chordId 是否非空，不保证该 chord 已在 staff.chords 注册。
        // 若 chordId 未注册，beat.chord 为 null，createNewGlyph 用 beat.chord! 会构造空 chord 的 glyph
        // → ChordDiagramGlyph.doLayout 读 firstFret 时空指针。此处加守卫：chord 未注册则不创建 glyph。
        return beat.hasChord && beat.chord !== null;
    }

    public createNewGlyph(renderer: BarRendererBase, beat: Beat): EffectGlyph {
        const showDiagram = beat.voice.bar.staff.track.score.stylesheet.globalDisplayChordDiagramsInScore;
        return showDiagram
            ? new ChordDiagramGlyph(0, 0, beat.chord!, NotationElement.EffectChordNames, true)
            : new TextGlyph(
                  0,
                  0,
                  beat.chord!.name,
                  renderer.resources.elementFonts.get(NotationElement.EffectChordNames)!,
                  TextAlign.Center
              );
    }

    public canExpand(_from: Beat, _to: Beat): boolean {
        return false;
    }

    /**
     * After all chord glyphs have been positioned by the spring layout system,
     * check for horizontal overlaps between adjacent chord glyphs and push
     * them apart to prevent visual collision.
     *
     * Both ChordDiagramGlyph (with _center=true) and TextGlyph (with
     * TextAlign.Center) are visually centered on their x-position, so each
     * glyph spans [x - width/2, x + width/2].
     *
     * This is called from EffectBand.alignGlyphs() after _alignGlyph has
     * set each glyph's x-position based on the beat's onTimeX.
     *
     * The spring system (via BarLayoutingInfo.finish()) already expands
     * postSpringWidth on springs between chord beats, so beats are properly
     * spaced. This method handles any remaining sub-pixel overlaps as a
     * final visual safety net within the effect band only.
     */
    public override onAlignGlyphs(band: EffectBand): void {
        // Collect all chord glyphs with their current x-positions
        const glyphs: EffectGlyph[] = [];
        for (const g of band.iterateAllGlyphs()) {
            if (g.width > 0) {
                glyphs.push(g);
            }
        }

        if (glyphs.length < 2) {
            return;
        }

        // Sort by x-position (set by _alignGlyph during SingleOnBeat sizing)
        glyphs.sort((a, b) => a.x - b.x);

        // Resolve overlaps: push right-side glyphs to maintain minimum gap.
        // We iterate left-to-right; each overlap pushes the right glyph and
        // all subsequent glyphs, so earlier corrections are preserved.
        // This is a visual safety net — the spring system should have already
        // allocated enough space between beats via postSpringWidth expansion.
        for (let i = 0; i < glyphs.length - 1; i++) {
            const current = glyphs[i];
            const next = glyphs[i + 1];

            // Both ChordDiagramGlyph (center=true) and TextGlyph (TextAlign.Center)
            // are visually centered at their x-position:
            //   visual extent = [x - width/2, x + width/2]
            const currentRight = current.x + current.width / 2;
            const nextLeft = next.x - next.width / 2;

            const overlap = currentRight + ChordsEffectInfo._minChordGap - nextLeft;

            if (overlap > 0) {
                // Push the next glyph and all subsequent glyphs to the right
                // by the overlap amount. This preserves the relative spacing
                // of all glyphs to the right of the overlap.
                for (let j = i + 1; j < glyphs.length; j++) {
                    glyphs[j].x += overlap;
                }
            }
        }
    }
}

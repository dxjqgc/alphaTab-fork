import type { Note } from '@coderline/alphatab/model/Note';
import { TabTieGlyph } from '@coderline/alphatab/rendering/glyphs/TabTieGlyph';
import { BeamDirection } from '@coderline/alphatab/rendering/utils/BeamDirection';

/**
 * @internal
 */
export class TabSlurGlyph extends TabTieGlyph {
    private _forSlide: boolean;

    public constructor(slurEffectId: string, startNote: Note, endNote: Note, forSlide: boolean, forEnd:boolean) {
        super(slurEffectId, startNote, endNote, forEnd);
        this._forSlide = forSlide;
    }

    /**
     * Fork: mark the slur with H (hammer-on) / P (pull-off), which guitar tab
     * notation — and the app's edit-mode canvas — writes on the slur.
     *
     * A legato slide shares this glyph, but it has no `isHammerPullOrigin`, so
     * that flag is what separates the two. (The canvas additionally paints
     * "sl." on a slide; that one stays editor-only — the fork keeps alphaTab's
     * straight-line slide.)
     *
     * Only the origin-side segment is labelled: a slur broken over a system
     * break is painted by two glyphs and the letter belongs on it once.
     */
    protected override slurText(): string | undefined {
        if (this.isForEnd) {
            return undefined;
        }

        const start = this.startNote;
        const end = this.endNote;
        if (!start.isHammerPullOrigin && !end.isHammerPullOrigin) {
            return undefined;
        }

        // Pitch, not fret: a hammer/pull destination may sit on a different
        // string (a left-hand-tapped note), where a lower fret is a higher note.
        return end.realValueWithoutHarmonic > start.realValueWithoutHarmonic ? 'H' : 'P';
    }

    public override getTieHeight(startX: number, _startY: number, endX: number, _endY: number): number {
        return (Math.log(endX - startX + 1) * this.renderer.settings.notation.slurHeight) / 2;
    }

    public tryExpand(startNote: Note, endNote: Note, forSlide: boolean, forEnd: boolean): boolean {
        // same type required
        if (this._forSlide !== forSlide) {
            return false;
        }
        // same start and endbeat
        if (this.startNote.beat.id !== startNote.beat.id) {
            return false;
        }
        if (this.endNote.beat.id !== endNote.beat.id) {
            return false;
        }
        const isForEnd = this.renderer === this.lookupEndBeatRenderer();
        if (isForEnd !== forEnd) {
            return false;
        }
        // same draw direction
        if (this.tieDirection !== TabTieGlyph.getBeamDirectionForNote(startNote)) {
            return false;
        }
        // if we can expand, expand in correct direction
        switch (this.tieDirection) {
            case BeamDirection.Up:
                if (startNote.realValue > this.startNote.realValue) {
                    this.startNote = startNote;
                }
                if (endNote.realValue > this.endNote.realValue) {
                    this.endNote = endNote;
                }
                break;
            case BeamDirection.Down:
                if (startNote.realValue < this.startNote.realValue) {
                    this.startNote = startNote;
                }
                if (endNote.realValue < this.endNote.realValue) {
                    this.endNote = endNote;
                }
                break;
        }
        return true;
    }
}

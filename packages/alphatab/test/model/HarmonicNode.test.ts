import { Score } from '@coderline/alphatab/model/Score';
import { Settings } from '@coderline/alphatab/Settings';
import { HarmonicType } from '@coderline/alphatab/model/HarmonicType';
import { Note } from '@coderline/alphatab/model/Note';
import { Tuning } from '@coderline/alphatab/model/Tuning';
import { Bar } from '@coderline/alphatab/model/Bar';
import { Beat } from '@coderline/alphatab/model/Beat';
import { MasterBar } from '@coderline/alphatab/model/MasterBar';
import { Staff } from '@coderline/alphatab/model/Staff';
import { Track } from '@coderline/alphatab/model/Track';
import { Voice } from '@coderline/alphatab/model/Voice';
import { Duration } from '@coderline/alphatab/model/Duration';
import { expect } from 'chai';

/**
 * A natural harmonic's node (`Note.harmonicValue`) is the fret the string is
 * touched at, so it must follow the note's own fret — that is how Guitar Pro
 * stores it and how the importers derive it (`ModelUtils.deltaFretToHarmonicValue`
 * from `note.fret` in Gp3To5Importer and the alphaTex `nh` element). `Note.finish`
 * re-derives it so the value stays in sync when the fret changes after the
 * harmonic was set.
 */
describe('NoteTests - natural harmonic node', () => {
    /** One guitar staff, one 4/4 bar, one quarter beat holding the note. */
    const buildNote = (fret: number, type: HarmonicType = HarmonicType.Natural): { score: Score; note: Note } => {
        const score = new Score();
        const track = new Track();
        score.addTrack(track);
        const staff = new Staff();
        const tuning = new Tuning();
        tuning.tunings = [40, 45, 50, 55, 59, 64];
        staff.stringTuning = tuning;
        track.addStaff(staff);

        const masterBar = new MasterBar();
        masterBar.timeSignatureNumerator = 4;
        masterBar.timeSignatureDenominator = 4;
        score.addMasterBar(masterBar);

        const bar = new Bar();
        staff.addBar(bar);
        const voice = new Voice();
        bar.addVoice(voice);
        const beat = new Beat();
        beat.duration = Duration.Quarter;
        voice.addBeat(beat);

        const note = new Note();
        note.string = 1;
        note.fret = fret;
        note.harmonicType = type;
        beat.addNote(note);

        return { score, note };
    };

    const derive = (fret: number): number => {
        const { score, note } = buildNote(fret);
        score.finish(new Settings());
        return note.harmonicValue;
    };

    it('follows the fret: real nodes stay as they are', () => {
        expect(derive(12)).to.be.equal(12);
        expect(derive(7)).to.be.equal(7);
        expect(derive(5)).to.be.equal(5);
        expect(derive(4)).to.be.equal(4);
        expect(derive(9)).to.be.equal(9);
        expect(derive(19)).to.be.equal(19);
        expect(derive(24)).to.be.equal(24);
    });

    it('uses the fractional node values for the between-fret nodes', () => {
        expect(derive(2)).to.be.equal(2.4);
        expect(derive(3)).to.be.equal(3.2);
        expect(derive(8)).to.be.equal(8.2);
        expect(derive(10)).to.be.equal(9.6);
        expect(derive(14)).to.be.equal(14.7);
        expect(derive(21)).to.be.equal(21.7);
    });

    it('falls back to the octave node on frets without one', () => {
        expect(derive(0)).to.be.equal(12);
        expect(derive(6)).to.be.equal(12);
        expect(derive(13)).to.be.equal(12);
    });

    it('re-derives after the fret changes', () => {
        const { score, note } = buildNote(12);
        score.finish(new Settings());
        expect(note.harmonicValue).to.be.equal(12);

        note.fret = 7;
        score.finish(new Settings());
        expect(note.harmonicValue).to.be.equal(7);
    });

    it('leaves the other harmonic types alone', () => {
        for (const type of [
            HarmonicType.Artificial,
            HarmonicType.Pinch,
            HarmonicType.Tap,
            HarmonicType.Semi,
            HarmonicType.Feedback
        ]) {
            const { score, note } = buildNote(5, type);
            note.harmonicValue = 12;
            score.finish(new Settings());
            expect(note.harmonicValue, `type ${type}`).to.be.equal(12);
        }
    });
});

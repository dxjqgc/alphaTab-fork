// Offline verification for the stereo-sample loading fix in TinySoundFont:
// MuseScore_General.sf3's pianos are stereo-sampled (sampleType 0x12/0x14 —
// Right/Left vorbis pairs). Before the fix those samples were skipped as
// "unsupported", leaving program 0 (the vocal track's instrument) silent.
// Synthesizes a program-0 note end-to-end and asserts non-silence.
import { readFileSync } from 'node:fs';
import { ScoreLoader } from '@coderline/alphatab/importer/ScoreLoader';
import { AlphaSynthMidiFileHandler } from '@coderline/alphatab/midi/AlphaSynthMidiFileHandler';
import { MidiFile } from '@coderline/alphatab/midi/MidiFile';
import { MidiFileGenerator } from '@coderline/alphatab/midi/MidiFileGenerator';
import { AlphaSynth } from '@coderline/alphatab/synth/AlphaSynth';
import { TinySoundFont } from '@coderline/alphatab/synth/synthesis/TinySoundFont';
import { Hydra } from '@coderline/alphatab/synth/soundfont/Hydra';
import { ByteBuffer } from '@coderline/alphatab/io/ByteBuffer';
import { expect } from 'chai';
import { TestOutput } from 'test/audio/TestOutput';

const sfPath = '/opt/py-work/GuitarSheetGenerator/frontend/public/alphatab/soundfont/MuseScore_General.sf3';

describe('TinySoundFont stereo samples (MuseScore_General.sf3)', () => {
    it('grand-piano-stereo-samples-load', () => {
        const data: Uint8Array = readFileSync(sfPath);
        const hydra: Hydra = new Hydra();
        hydra.load(ByteBuffer.fromBuffer(data));

        const tsf: TinySoundFont = new TinySoundFont(44100);
        tsf.loadPresets(hydra, new Set<number>([0, 24]), new Set<number>(), false);

        const piano = tsf.presets!.find(p => p.bank === 0 && p.presetNumber === 0)!;
        const withSamples = piano.regions!.filter(r => r.samples && r.samples.length > 0).length;
        console.log(`piano regions with samples: ${withSamples}/${piano.regions!.length}`);
        // Before the fix this was 0 — all stereo pairs dropped.
        expect(withSamples).to.be.greaterThan(0);
    });

    it('grand-piano-stereo-samples-audible', async () => {
        // Program 0 (Grand Piano) chord followed by rests — tex shape copied
        // from the pcm-generation test (tuning needed for fret numbers).
        const tex: string =
            '\\tempo 120 \\tuning E4 B3 G3 D3 A2 E2 \\instrument 0 . r.8 (0.4 0.3 ).8 ' +
            '(3.4 3.3 ).2 | r.1 r.1 r.1 r.1 |';
        const score = ScoreLoader.loadAlphaTex(tex);
        const midi = new MidiFile();
        const gen = new MidiFileGenerator(score, null, new AlphaSynthMidiFileHandler(midi));
        gen.generate();

        const data: Uint8Array = readFileSync(sfPath);
        const testOutput = new TestOutput();
        const synth = new AlphaSynth(testOutput, 500);
        synth.loadSoundFont(data, false);
        synth.loadMidiFile(midi);

        expect(synth.isReadyForPlayback).to.be.true;
        expect(synth.hasSamplesForProgram(0)).to.be.true;

        synth.play();
        let finished = false;
        synth.finished.on(() => {
            finished = true;
        });
        while (!finished) {
            testOutput.next();
        }

        // TestOutput collects every rendered buffer — compute the peak.
        let peak = 0;
        for (const buf of testOutput.samples) {
            for (let i = 0; i < buf.length; i++) {
                peak = Math.max(peak, Math.abs(buf[i]));
            }
        }
        console.log(`synthesized peak amplitude (program 0): ${peak.toFixed(6)}`);
        // Before the fix: exactly 0 (all samples dropped). A real piano note
        // with slow attack reaches ~3.5e-4 within the first bars — assert
        // "clearly non-silent" rather than a loudness bar.
        expect(peak).to.be.greaterThan(0.0001, 'Grand Piano must be audible');
    });
});

/**
 * Build JianpuDrawNote[] from JianpuEvent + layout coordinates.
 * @internal
 */
import { MidiUtils } from '@coderline/alphatab/midi/MidiUtils';
import type { JianpuEvent } from '@coderline/alphatab/model/Bar';
import {
    beatValueFromDenominator,
    jianpuEventNodeTime,
    jianpuEventTicks,
    jianpuEventUnderlineCount
} from '@coderline/alphatab/rendering/jianpu/simpleNotation/durationUtils';
import type { JianpuDrawNote } from '@coderline/alphatab/rendering/jianpu/simpleNotation/types';

export interface JianpuEventLayoutCoords {
    eventIndex: number;
    preX: number;
    postX: number;
    centerX: number;
    width: number;
    centerY: number;
    playbackStart: number;
}

export function buildJianpuDrawNotes(
    events: JianpuEvent[],
    layouts: JianpuEventLayoutCoords[],
    timeSignatureDenominator: number
): JianpuDrawNote[] {
    const beatTicks = (MidiUtils.QuarterTime * (4.0 / timeSignatureDenominator)) | 0;
    const notes: JianpuDrawNote[] = [];

    for (const layout of layouts) {
        const event = events[layout.eventIndex];
        if (!event) {
            continue;
        }

        const ticks = jianpuEventTicks(event);
        const playbackEnd = layout.playbackStart + ticks;
        const startNote = beatTicks > 0 && layout.playbackStart % beatTicks === 0;
        const endNote = beatTicks > 0 && playbackEnd % beatTicks === 0;

        notes.push({
            eventIndex: layout.eventIndex,
            text: event.text,
            nodeTime: jianpuEventNodeTime(event, timeSignatureDenominator),
            underlineCount: jianpuEventUnderlineCount(event),
            startNote,
            endNote,
            centerX: layout.centerX,
            width: layout.width,
            preX: layout.preX,
            postX: layout.postX,
            centerY: layout.centerY,
            isRest: event.text === '0',
            tieToNext: event.tieToNext,
            tiedFromPrev: event.tiedFromPrev,
            splitBeamAfter: event.splitBeamAfter
        });
    }

    return notes;
}

export { beatValueFromDenominator };

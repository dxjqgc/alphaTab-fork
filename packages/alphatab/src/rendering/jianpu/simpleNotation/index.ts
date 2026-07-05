/**
 * simple-notation (MIT) jianpu rendering utilities.
 * @see https://github.com/open-source-project/simple-notation
 */
export { groupNotesForBeam } from '@coderline/alphatab/rendering/jianpu/simpleNotation/groupNotesForBeam';
export type { JianpuDrawNote, JianpuUnderlinePaintStyle } from '@coderline/alphatab/rendering/jianpu/simpleNotation/types';
export {
    beatValueFromDenominator,
    jianpuEventNodeTime,
    jianpuEventUnderlineCount,
    jianpuEventTicks
} from '@coderline/alphatab/rendering/jianpu/simpleNotation/durationUtils';
export { buildJianpuDrawNotes } from '@coderline/alphatab/rendering/jianpu/simpleNotation/eventAdapter';
export type { JianpuEventLayoutCoords } from '@coderline/alphatab/rendering/jianpu/simpleNotation/eventAdapter';

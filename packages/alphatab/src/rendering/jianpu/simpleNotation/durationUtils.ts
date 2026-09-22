/**
 * Duration helpers for simple-notation jianpu beam grouping.
 * Ported from simple-notation beam layer (MIT).
 * @internal
 */
import { MidiUtils } from '@coderline/alphatab/midi/MidiUtils';
import type { JianpuEvent } from '@coderline/alphatab/model/Bar';
import { ModelUtils } from '@coderline/alphatab/model/ModelUtils';

/** 拍号分母 → 一拍时值（与 simple-notation getCurrentBeatValue 一致） */
export function beatValueFromDenominator(timeSignatureDenominator: number): number {
    if (!timeSignatureDenominator || timeSignatureDenominator <= 0) {
        return 1;
    }
    return 4 / timeSignatureDenominator;
}

/** 一拍对应的 MIDI tick 数 */
export function beatDurationTicks(timeSignatureDenominator: number): number {
    return (MidiUtils.QuarterTime * (4.0 / timeSignatureDenominator)) | 0;
}

export function jianpuEventTicks(event: JianpuEvent): number {
    let ticks = MidiUtils.toTicks(event.duration);
    for (let dot = 0; dot < event.dots; dot++) {
        ticks = MidiUtils.applyDot(ticks, false);
    }
    if (jianpuEventHasTuplet(event)) {
        ticks = MidiUtils.applyTuplet(ticks, event.tupletNumerator, event.tupletDenominator);
    }
    return ticks;
}

/** 是否为 tuplet 事件（3:2 三连音等；-1/-1 或相等比例视为非 tuplet，与 Beat.hasTuplet 惯例一致） */
export function jianpuEventHasTuplet(event: JianpuEvent): boolean {
    return event.tupletNumerator > 0 && event.tupletDenominator > 0 && event.tupletNumerator !== event.tupletDenominator;
}

/** event 时值折算为拍数 */
export function jianpuEventNodeTime(event: JianpuEvent, timeSignatureDenominator: number): number {
    const beatTicks = beatDurationTicks(timeSignatureDenominator);
    if (beatTicks <= 0) {
        return 0;
    }
    return jianpuEventTicks(event) / beatTicks;
}

/** 减时线条数；短休止符也按时值画线，以便与短音同组横连 */
export function jianpuEventUnderlineCount(event: JianpuEvent): number {
    if (!event.text || event.text.length === 0) {
        return 0;
    }
    return Math.max(0, ModelUtils.getIndex(event.duration) - 2);
}

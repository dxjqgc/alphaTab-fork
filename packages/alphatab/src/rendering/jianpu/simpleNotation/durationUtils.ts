/**
 * Duration helpers for simple-notation jianpu beam grouping.
 * Ported from simple-notation beam layer (MIT).
 * @internal
 */
import { MidiUtils } from '@coderline/alphatab/midi/MidiUtils';
import type { JianpuEvent } from '@coderline/alphatab/model/Bar';
import { ModelUtils } from '@coderline/alphatab/model/ModelUtils';

/** 一组减时线覆盖的时值（以**分母音符**为单位，与 `jianpuEventNodeTime` 同单位）。
 *
 *  分组单位固定是**四分音符**，与拍号无关：`denominator / 4` —— /4 → 1（一个四分），
 *  /8 → 2（两个八分 = 一个四分），/16 → 4。这样 6/8 的减时线按「每两个八分一组」
 *  （一个小节三组），而不是按附点大拍分两组。
 *
 *  ★ 单位必须与 `jianpuEventNodeTime` 一致：后者把事件时值折算成分母音符数
 *    （八分 = 1.0）。旧实现返回 `4 / denominator`，在 /8 下得到 0.5 —— 而八分的
 *    nodeTime 是 1.0，于是 `nodeTime >= beatValue` 恒成立，**每个八分各自成组**，
 *    减时线永远连不起来（6/8 的六个八分变成六组）。
 */
export function beatValueFromDenominator(timeSignatureDenominator: number): number {
    if (!timeSignatureDenominator || timeSignatureDenominator <= 0) {
        return 1;
    }
    return timeSignatureDenominator / 4;
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

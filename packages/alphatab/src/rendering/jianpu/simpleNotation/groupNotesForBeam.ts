/**
 * Jianpu underline beam grouping — ported from simple-notation SNBeamLayer (MIT).
 * @see /opt/work/open-source-project/simple-notation/packages/simple-notation/src/layers/beam.ts
 * @public
 */
import type { JianpuDrawNote } from '@coderline/alphatab/rendering/jianpu/simpleNotation/types';

const EPS = 1e-6;

/**
 * 将小节内音符按 simple-notation 规则分组：
 * - splitBeamAfter 处断组（拍界）
 * - nodeTime >= 1 拍单独成组
 * - 短音 + 休止符累加至 1 拍为一组（最长减时线横连整拍）
 * - 组内 underlineCount 可不同，绘制时取 max
 */
export function groupNotesForBeam(notes: JianpuDrawNote[], beatValue: number): JianpuDrawNote[][] {
    const groups: JianpuDrawNote[][] = [];
    let current: JianpuDrawNote[] = [];
    let acc = 0;

    const flushCurrent = () => {
        if (current.length > 0) {
            groups.push(current);
            current = [];
            acc = 0;
        }
    };

    for (let i = 0; i < notes.length; i++) {
        const note = notes[i]!;
        const nodeTime = note.nodeTime ?? 0;

        if (i > 0 && notes[i - 1]!.splitBeamAfter) {
            flushCurrent();
        }

        if (nodeTime >= beatValue - EPS) {
            flushCurrent();
            groups.push([note]);
        } else {
            current.push(note);
            acc += nodeTime;
            if (Math.abs(acc - beatValue) < EPS) {
                flushCurrent();
            } else if (acc > beatValue + EPS) {
                flushCurrent();
            }
        }
    }

    flushCurrent();

    return groups;
}

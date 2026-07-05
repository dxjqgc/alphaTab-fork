/**
 * Jianpu draw model adapted from simple-notation (MIT).
 * @see https://github.com/open-source-project/simple-notation
 * @internal
 */
export interface JianpuDrawNote {
    eventIndex: number;
    /** 简谱显示文本（含 #/b 前缀） */
    text: string;
    /** 以拍为单位的时值（1 = 一拍） */
    nodeTime: number;
    /** 减时线条数（八分=1，十六分=2；休止/长音=0） */
    underlineCount: number;
    /** 是否从拍起点开始 */
    startNote: boolean;
    /** 是否在拍终点结束 */
    endNote: boolean;
    /** 音符中心 X（布局后，相对小节左缘） */
    centerX: number;
    /** 音符宽度 */
    width: number;
    /** 左缘 X（PreNotes） */
    preX: number;
    /** 右缘 X（PostNotes） */
    postX: number;
    /** 数字中心 Y（相对 renderer） */
    centerY: number;
    /** 是否休止符 */
    isRest: boolean;
    tieToNext: boolean;
    tiedFromPrev: boolean;
    /** 拍末强制断组（不横连到下一 event） */
    splitBeamAfter: boolean;
}

export interface JianpuUnderlinePaintStyle {
    lineSpacing: number;
    lineThickness: number;
    edgeInset: number;
    baseYOffset: number;
}

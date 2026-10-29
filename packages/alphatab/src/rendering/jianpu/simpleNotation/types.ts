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
    /**
     * 单层减时线的最小长度（layout unit）。
     *
     * `edgeInset` 会从两端各削掉一段；对单个音（尤其 16 分这种窄音符）来说两段加起来就
     * 把线削到 3px 左右 —— 印出来像一个点，读者会以为是附点/杂点。给一个下限，短音也还是"线"。
     */
    minLength?: number;
}

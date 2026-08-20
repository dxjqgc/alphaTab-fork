import { EngravingSettings } from '@coderline/alphatab/EngravingSettings';
import { MidiUtils } from '@coderline/alphatab/midi/MidiUtils';
import { type Bar, BarSubElement } from '@coderline/alphatab/model/Bar';
import { Beat, BeatBeamingMode, BeatSubElement } from '@coderline/alphatab/model/Beat';
import { Duration } from '@coderline/alphatab/model/Duration';
import { GraceType } from '@coderline/alphatab/model/GraceType';
import { ModelUtils } from '@coderline/alphatab/model/ModelUtils';
import { MusicFontSymbol } from '@coderline/alphatab/model/MusicFontSymbol';
import { Note } from '@coderline/alphatab/model/Note';
import { Voice } from '@coderline/alphatab/model/Voice';
import { NotationElement } from '@coderline/alphatab/NotationSettings';
import type { ICanvas } from '@coderline/alphatab/platform/ICanvas';
import { TextAlign } from '@coderline/alphatab/platform/ICanvas';
import { BeatXPosition } from '@coderline/alphatab/rendering/BeatXPosition';
import type { BeatContainerGlyphBase } from '@coderline/alphatab/rendering/glyphs/BeatContainerGlyph';
import { BarLineGlyph } from '@coderline/alphatab/rendering/glyphs/BarLineGlyph';
import { BarNumberGlyph } from '@coderline/alphatab/rendering/glyphs/BarNumberGlyph';
import {
    NumberedDashBeatContainerGlyph,
    NumberedNoteBeatContainerGlyphBase
} from '@coderline/alphatab/rendering/glyphs/NumberedDashBeatContainerGlyph';
import { LyricsGlyph } from '@coderline/alphatab/rendering/glyphs/LyricsGlyph';
import { ScoreTimeSignatureGlyph } from '@coderline/alphatab/rendering/glyphs/ScoreTimeSignatureGlyph';
import { SpacingGlyph } from '@coderline/alphatab/rendering/glyphs/SpacingGlyph';
import { LineBarRenderer } from '@coderline/alphatab/rendering/LineBarRenderer';
import { NumberedBeatContainerGlyph } from '@coderline/alphatab/rendering/NumberedBeatContainerGlyph';
import type { NumberedBeatGlyph } from '@coderline/alphatab/rendering/glyphs/NumberedBeatGlyph';
import type { ScoreRenderer } from '@coderline/alphatab/rendering/ScoreRenderer';
import { BeamDirection } from '@coderline/alphatab/rendering/utils/BeamDirection';
import type { BeamingHelper, BeamingHelperDrawInfo } from '@coderline/alphatab/rendering/utils/BeamingHelper';
import { ElementStyleHelper } from '@coderline/alphatab/rendering/utils/ElementStyleHelper';
import { buildJianpuDrawNotes, beatValueFromDenominator } from '@coderline/alphatab/rendering/jianpu/simpleNotation/eventAdapter';
import { groupNotesForBeam } from '@coderline/alphatab/rendering/jianpu/simpleNotation/groupNotesForBeam';
import { DEFAULT_UNDERLINE_STYLE, drawUnderlineGroup } from '@coderline/alphatab/rendering/jianpu/simpleNotation/drawUnderlines';
import { drawSingleTieLine } from '@coderline/alphatab/rendering/jianpu/simpleNotation/drawTieLine';
import { jianpuEventUnderlineCount } from '@coderline/alphatab/rendering/jianpu/simpleNotation/durationUtils';
import type { JianpuEventLayoutCoords } from '@coderline/alphatab/rendering/jianpu/simpleNotation/eventAdapter';
import type { JianpuDrawNote } from '@coderline/alphatab/rendering/jianpu/simpleNotation/types';

/**
 * This BarRenderer renders a bar using (Jianpu) Numbered Music Notation
 * @internal
 */
export class NumberedBarRenderer extends LineBarRenderer {
    public static readonly StaffId: string = 'numbered';

    public simpleWhammyOverflow: number = 0;

    private _isOnlyNumbered: boolean;
    public shortestDuration = Duration.QuadrupleWhole;
    private _jianpuBeats: Beat[] = [];
    private _maxJianpuBottom: number = -10000;
    private _maxJianpuBeamingBottom: number = -10000;
    private _jianpuLyrics: { beat: Beat; glyph: LyricsGlyph }[] = [];

    get dotSpacing(): number {
        return this.smuflMetrics.glyphHeights.get(MusicFontSymbol.AugmentationDot)! * 2;
    }

    public override get repeatsBarSubElement(): BarSubElement {
        return BarSubElement.NumberedRepeats;
    }

    public override get barNumberBarSubElement(): BarSubElement {
        return BarSubElement.NumberedBarNumber;
    }

    public override get barLineBarSubElement(): BarSubElement {
        return BarSubElement.NumberedBarLines;
    }

    public override get staffLineBarSubElement(): BarSubElement {
        return BarSubElement.NumberedStaffLine;
    }

    private _staffUsesJianpuEventsOnly(): boolean {
        return this.bar.staff.usesJianpuEventsOnly;
    }

    /** 是否在谱面绘制简谱符号（含休止符 0） */
    private _jianpuEventHasGlyph(beatIndex: number): boolean {
        const event = this.bar.jianpuEvents[beatIndex];
        return !!event?.text && event.text.length > 0;
    }

    /** 是否参与减时线分组/绘制（休止符除外） */
    private _jianpuEventIsBeamableNote(beatIndex: number): boolean {
        const event = this.bar.jianpuEvents[beatIndex];
        return !!event?.text && event.text.length > 0 && event.text !== '0';
    }

    private _jianpuEventShowsSymbol(beatIndex: number): boolean {
        return this._jianpuEventIsBeamableNote(beatIndex);
    }

    private _layoutJianpuLyrics(): void {
        if (this._jianpuLyrics.length === 0 || this._maxJianpuBottom <= -10000) {
            return;
        }
        const padding = this.settings.display.lyricLinesPaddingBetween;
        // 歌词基线必须避开下方减时线：减时线从 _simpleNotationUnderlineBaseY()
        // 起向下分层堆叠，层数越多下沿越低，否则 2 条以上减时线会与歌词重叠。
        const lyricBaseline = Math.max(this._maxJianpuBottom, this._lowestDurationBarBottom()) + padding;
        for (const { beat, glyph } of this._jianpuLyrics) {
            // 绝对 X 坐标：对应 Jianpu 数字的中线
            glyph.x = this.getBeatX(beat, BeatXPosition.MiddleNotes);
            glyph.y = lyricBaseline;
        }
    }

    /**
     * 当前小节最低减时线的下沿 Y（与 drawUnderlineGroup 几何一致）。
     * 无减时线时返回 -10000，表示不构成约束。
     */
    private _lowestDurationBarBottom(): number {
        const minGap = this.smuflMetrics.numberedBarRendererBarSpacing;
        const { lineSpacing, lineThickness } = DEFAULT_UNDERLINE_STYLE;
        let maxUnderlineCount = 0;
        for (const event of this.bar.jianpuEvents) {
            if (!event) {
                continue;
            }
            const count = jianpuEventUnderlineCount(event);
            if (count > maxUnderlineCount) {
                maxUnderlineCount = count;
            }
        }
        if (maxUnderlineCount <= 0) {
            return -10000;
        }
        const baseY = this._maxJianpuBeamingBottom + minGap;
        // 第 maxUnderlineCount 层下沿 = baseY + lineSpacing*(N-1) + lineThickness
        return baseY + lineSpacing * (maxUnderlineCount - 1) + lineThickness;
    }

    public constructor(renderer: ScoreRenderer, bar: Bar) {
        super(renderer, bar);
        this._isOnlyNumbered = !bar.staff.showSlash && !bar.staff.showTablature && !bar.staff.showStandardNotation;
    }

    public override get lineSpacing(): number {
        return this.smuflMetrics.oneStaffSpace;
    }

    public override get heightLineCount(): number {
        return 5;
    }

    public override get drawnLineCount(): number {
        return 0;
    }

    protected override get bottomGlyphOverflow(): number {
        return 0;
    }

    public override doLayout(): void {
        if (this._staffUsesJianpuEventsOnly() && this.bar.jianpuEvents.length === 0) {
            this._jianpuBeats = [];
            super.doLayout();
            return;
        }

        if (this.bar.jianpuEvents && this.bar.jianpuEvents.length > 0) {
            if (this.bar.index === 0) {
                this.bar.staff.jianpuPendingTieDrawX = -1;
                this.bar.staff.jianpuPendingTieDrawY = -1;
            }
            this._jianpuBeats = this._generateJianpuBeats();
            const originalVoices = this.bar.voices;
            const originalShortestDuration = this.bar.shortestDuration;

            const fakeVoice = new Voice();
            fakeVoice.bar = this.bar;
            fakeVoice.index = 0;
            fakeVoice.beats = this._jianpuBeats;

            for (const beat of this._jianpuBeats) {
                beat.voice = fakeVoice;
            }

            this.bar.voices = [fakeVoice];

            // update shortest duration for beaming rules
            for (const beat of this._jianpuBeats) {
                if (beat.duration > this.bar.shortestDuration) {
                    this.bar.shortestDuration = beat.duration;
                }
            }

            try {
                super.doLayout();
            } finally {
                this.bar.voices = originalVoices;
                this.bar.shortestDuration = originalShortestDuration;
            }
        } else {
            super.doLayout();
        }
    }

    private _generateJianpuBeats(): Beat[] {
        const beats: Beat[] = [];
        let currentTick = 0;
        let index = 0;

        // Create custom glyphs from JianpuEvents
        for (const event of this.bar.jianpuEvents) {
            // Create a fake beat
            const beat = new Beat();
            beat.index = index++;
            if (this.bar.voices.length > 0) {
                beat.voice = this.bar.voices[0];
            }
            beat.duration = event.duration;
            beat.dots = event.dots;
            if (event.splitBeamAfter) {
                beat.beamingMode = BeatBeamingMode.ForceSplitToNext;
            }
            // bind Jianpu display information from the event
            // (used later by the numbered glyphs)
            // lyrics are also propagated so the generic lyrics effect
            // can render them aligned to this fake beat.
            if (event.text) {
                // use beat text annotation to carry the custom Jianpu text
                beat.text = event.text;
            }
            if (event.lyric) {
                beat.lyrics = event.lyric.includes('\n') ? event.lyric.split('\n') : [event.lyric];
            }
            beat.displayStart = currentTick;
            // beaming 分组依赖 playbackStart；未设置时全为 0，减时线会错误跨拍连接
            beat.playbackStart = currentTick;

            let ticks = MidiUtils.toTicks(beat.duration);
            for (let dot = 0; dot < beat.dots; dot++) {
                ticks = MidiUtils.applyDot(ticks, false);
            }
            beat.displayDuration = ticks;
            beat.playbackDuration = ticks;
            currentTick += ticks;

            if (this._jianpuEventHasGlyph(beat.index)) {
                // We need at least one note for it to be considered non-empty/valid by some renderers
                // and to anchor effects if any (though here we just want the number)
                const note = new Note();
                note.beat = beat;
                beat.notes.push(note);
                beat.minNote = note;
                beat.maxNote = note;

                // 连音线仅由 _paintSimpleNotationTieLines 绘制，不在 fake Note 上挂 tieOrigin
            } else {
                beat.isEmpty = true;
            }

            beats.push(beat);
        }

        return beats;
    }

    protected override createBeatGlyphs(): void {
        if (this._staffUsesJianpuEventsOnly() && this.bar.jianpuEvents.length === 0) {
            this._jianpuLyrics = [];
            this._jianpuBeats = [];
            this.voiceContainer.doLayout();

            if (this.topEffects.isLinkedToPreviousRenderer || this.bottomEffects.isLinkedToPreviousRenderer) {
                this.isLinkedToPrevious = true;
            }
            return;
        }

        if (this.bar.jianpuEvents && this.bar.jianpuEvents.length > 0) {
            this._jianpuLyrics = [];
            const absoluteStart = this.bar.masterBar.start;
            for (const beat of this._jianpuBeats) {
                // ensure the beat voice points to a valid voice for rendering
                // if we don't have a fake voice injected currently
                if (this.bar.voices.length > 0 && beat.voice !== this.bar.voices[0]) {
                    beat.voice = this.bar.voices[0];
                }

                const container = new NumberedBeatContainerGlyph(beat);
                this.addBeatGlyph(container);

                // create extension dashes for durations longer than a quarter note
                // (e.g. half note gets one dash, whole note gets three dashes)
                if (this._jianpuEventHasGlyph(beat.index) && beat.duration < Duration.Quarter) {
                    const endTick = beat.displayStart + beat.displayDuration;
                    let dashTick = beat.displayStart + MidiUtils.QuarterTime;
                    while (dashTick < endTick) {
                        const isFullTick = endTick - dashTick >= MidiUtils.QuarterTime;
                        if (isFullTick) {
                            const dash = new NumberedDashBeatContainerGlyph(beat.voice?.index ?? 0, absoluteStart + dashTick);
                            this.addBeatGlyph(dash);
                            container.addDash(dash);
                        }
                        // keep parity with regular numbered renderer for dotted split edge-case
                        else if (beat.duration === Duration.Half && beat.dots > 1) {
                            const remainingTickNumber = new NumberedNoteBeatContainerGlyphBase(
                                beat,
                                absoluteStart + dashTick,
                                endTick - dashTick
                            );
                            this.addBeatGlyph(remainingTickNumber);
                            container.addNotes(remainingTickNumber);
                        }

                        dashTick += MidiUtils.QuarterTime;
                    }
                }
            }

            this.voiceContainer.doLayout();

            this._maxJianpuBottom = -10000;
            this._maxJianpuBeamingBottom = -10000;
            for (const beat of this._jianpuBeats) {
                const container = this.voiceContainer.getBeatContainer(beat);
                if (container) {
                    const bottom = container.getBoundingBoxBottom();
                    if (bottom > this._maxJianpuBottom) {
                        this._maxJianpuBottom = bottom;
                    }
                    const numberedContainer = container as NumberedBeatContainerGlyph;
                    const onNotes = numberedContainer.onNotes as NumberedBeatGlyph;
                    if (onNotes.noteHeads) {
                        const beamingBottom = container.y + onNotes.y + onNotes.noteHeads.getBeamingAnchorBottom();
                        if (beamingBottom > this._maxJianpuBeamingBottom) {
                            this._maxJianpuBeamingBottom = beamingBottom;
                        }
                    }
                }
            }
            if (this._maxJianpuBeamingBottom <= -10000) {
                this._maxJianpuBeamingBottom = this._maxJianpuBottom;
            }

            // 为每个带 lyric 的 JianpuEvent 创建歌词 glyph（具体坐标在绘制前根据最终布局再计算）
            const baseLyricsFont = this.resources.elementFonts.get(NotationElement.EffectLyrics);
            // 简谱行内歌词比通用歌词字号放大 1.5 倍
            const lyricsFont = baseLyricsFont ? baseLyricsFont.withSize(baseLyricsFont.size * 1.5) : undefined;
            if (lyricsFont) {
                for (let i = 0; i < this._jianpuBeats.length && i < this.bar.jianpuEvents.length; i++) {
                    const event = this.bar.jianpuEvents[i];
                    if (!event || !event.lyric) {
                        continue;
                    }
                    const beat = this._jianpuBeats[i];
                    const lyricLines = event.lyric.includes('\n') ? event.lyric.split('\n') : [event.lyric];
                    const lyricGlyph = new LyricsGlyph(0, 0, lyricLines, lyricsFont, TextAlign.Center);
                    lyricGlyph.renderer = this;
                    lyricGlyph.doLayout();
                    this._jianpuLyrics.push({ beat, glyph: lyricGlyph });
                }
            }

            if (this.topEffects.isLinkedToPreviousRenderer || this.bottomEffects.isLinkedToPreviousRenderer) {
                this.isLinkedToPrevious = true;
            }
        } else {
            super.createBeatGlyphs();
        }
    }

    protected override get flagsSubElement(): BeatSubElement {
        return BeatSubElement.NumberedDuration;
    }

    protected override get beamsSubElement(): BeatSubElement {
        return BeatSubElement.NumberedDuration;
    }

    protected override get tupletSubElement(): BeatSubElement {
        return BeatSubElement.NumberedTuplet;
    }

    protected override shouldPaintBeamingHelper(_h: BeamingHelper): boolean {
        return true;
    }

    protected override paintFlag(
        cx: number,
        cy: number,
        canvas: ICanvas,
        h: BeamingHelper,
        flagsElement: BeatSubElement
    ): void {
        if (this._staffUsesJianpuEventsOnly() && this.bar.jianpuEvents.length > 0) {
            return;
        }
        this.paintBar(cx, cy, canvas, h, flagsElement);
    }

    protected override paintBar(
        cx: number,
        cy: number,
        canvas: ICanvas,
        h: BeamingHelper,
        flagsElement: BeatSubElement
    ): void {
        if (this._staffUsesJianpuEventsOnly() && this.bar.jianpuEvents.length > 0) {
            return;
        }
        if (h.beats.length === 0 || h.graceType !== GraceType.None) {
            return;
        }
        for (let i: number = 0, j: number = h.beats.length; i < j; i++) {
            const beat: Beat = h.beats[i];

            if (this.bar.jianpuEvents.length > 0 && !this._jianpuEventShowsSymbol(beat.index)) {
                continue;
            }

            using _ = ElementStyleHelper.beat(canvas, flagsElement, beat);

            const direction: BeamDirection = this.getBeamDirection(h);
            const isGrace: boolean = h.graceType !== GraceType.None;
            const scaleMod: number = isGrace ? EngravingSettings.GraceScale : 1;

            let barSpacing: number = (this.beamSpacing + this.beamThickness) * scaleMod;
            let barSize = this.beamThickness * scaleMod;
            if (direction === BeamDirection.Down) {
                barSpacing = -barSpacing;
                barSize = -barSize;
            }

            let barCount: number = ModelUtils.getIndex(beat.duration) - 2;
            let beatLineX: number = this.getBeatX(beat, BeatXPosition.PreNotes);

            let barStartX: number = 0;
            let barEndX: number = 0;
            if (i === h.beats.length - 1) {
                barStartX = beatLineX;
                barEndX = this.getBeatX(beat, BeatXPosition.PostNotes);
            } else {
                barStartX = beatLineX;
                barEndX = this.getBeatX(h.beats[i + 1], BeatXPosition.PreNotes);
            }

            const barStart: number = cy + this.y + this.calculateBeamY(h, beatLineX);
            for (let barIndex: number = 0; barIndex < barCount; barIndex++) {
                const barY: number = barStart + barIndex * barSpacing;

                LineBarRenderer.paintSingleBar(
                    canvas,
                    cx + this.x + barStartX,
                    barY,
                    cx + this.x + barEndX,
                    barY,
                    barSize
                );
            }

            // dashes for additional numbers
            const container = this.voiceContainer.getBeatContainer(beat) as NumberedBeatContainerGlyph | undefined;
            if (container && container.hasAdditionalNumbers) {
                for (const additionalNumber of container.iterateAdditionalNumbers()) {
                    barCount = additionalNumber.barCount;
                    beatLineX =
                        this.beatGlyphsStart +
                        additionalNumber.x +
                        additionalNumber.getBeatX(BeatXPosition.PreNotes, false);
                    for (let barIndex = 0; barIndex < barCount; barIndex++) {
                        const barY: number = barStart + barIndex * barSpacing;
                        const additionalBarEndX =
                            this.beatGlyphsStart +
                            additionalNumber.x +
                            additionalNumber.getBeatX(BeatXPosition.PostNotes, false);
                        LineBarRenderer.paintSingleBar(
                            canvas,
                            cx + this.x + beatLineX,
                            barY,
                            cx + this.x + additionalBarEndX,
                            barY,
                            barSize
                        );
                    }
                }
            }
        }
    }

    protected override calculateOverflows(rendererTop: number, rendererBottom: number): void {
        super.calculateOverflows(rendererTop, rendererBottom);
        if (this.bar.isEmpty) {
            return;
        }
        this.calculateBeamingOverflows(rendererTop, rendererBottom);

        this._layoutJianpuLyrics();
        for (const { glyph } of this._jianpuLyrics) {
            const topY = glyph.getBoundingBoxTop();
            if (topY < rendererTop) {
                this.registerOverflowTop(rendererTop - topY);
            }

            const bottomY = glyph.getBoundingBoxBottom();
            if (bottomY > rendererBottom) {
                this.registerOverflowBottom(bottomY - rendererBottom);
            }
        }
    }

    protected override paintContent(cx: number, cy: number, canvas: ICanvas): void {
        super.paintContent(cx, cy, canvas);

        if (this._staffUsesJianpuEventsOnly() && this.bar.jianpuEvents.length > 0) {
            this._paintSimpleNotationTieLines(cx, cy, canvas);
            this._paintSimpleNotationUnderlines(cx, cy, canvas, BeatSubElement.NumberedDuration);
        }

        // Draw Jianpu lyrics last so they stay below note duration bars and are not overpainted.
        this._layoutJianpuLyrics();
        if (this._jianpuLyrics.length > 0) {
            canvas.color = this.resources.mainGlyphColor;
            for (const { glyph } of this._jianpuLyrics) {
                glyph.paint(cx + this.x, cy + this.y, canvas);
            }
        }
    }

    public getNoteLine(_note: Note) {
        return 0;
    }

    private _calculateBarHeight(beat: Beat) {
        const barCount: number = ModelUtils.getIndex(beat.duration) - 2;
        let barHeight = 0;
        if (barCount > 0) {
            const smufl = this.smuflMetrics;
            barHeight =
                smufl.numberedBarRendererBarSpacing +
                barCount * (smufl.numberedBarRendererBarSpacing + smufl.numberedBarRendererBarSize);
        }

        return barHeight;
    }

    protected override getFlagTopY(beat: Beat, direction: BeamDirection): number {
        const barHeight: number = this._calculateBarHeight(beat);
        const container = this.voiceContainer.getBeatContainer(beat);
        if (!container) {
            if (direction === BeamDirection.Up) {
                return this.voiceContainer.getBoundingBoxTop() - barHeight;
            }
            return this.voiceContainer.getBoundingBoxBottom();
        }

        if (direction === BeamDirection.Up) {
            return container.getBoundingBoxTop() - barHeight;
        }
        return container.getBoundingBoxBottom();
    }

    protected override getFlagBottomY(beat: Beat, direction: BeamDirection): number {
        const barHeight: number = this._calculateBarHeight(beat);

        const container = this.voiceContainer.getBeatContainer(beat);
        if (!container) {
            if (direction === BeamDirection.Down) {
                return this.voiceContainer.getBoundingBoxBottom() + barHeight;
            }
            return this.getLineY(0);
        }

        if (direction === BeamDirection.Down) {
            return container.getBoundingBoxBottom() + barHeight;
        }
        return this.getLineY(0);
    }

    protected override getBeamDirection(_helper: BeamingHelper): BeamDirection {
        return BeamDirection.Down;
    }

    protected override getTupletBeamDirection(_helper: BeamingHelper): BeamDirection {
        return BeamDirection.Up;
    }

    protected override createPreBeatGlyphs(): void {
        this.wasFirstOfStaff = this.isFirstOfStaff;
        if (this.index === 0 || (this.bar.masterBar.isRepeatStart && this._isOnlyNumbered)) {
            this.addPreBeatGlyph(new BarLineGlyph(false, this.bar.staff.track.score.stylesheet.extendBarLines));
        }
        this.createLinePreBeatGlyphs();
        const hasSpaceAfterStartGlyphs = this.createStartSpacing();
        if (this.shouldCreateBarNumber()) {
            this.addPreBeatGlyph(new BarNumberGlyph(0, this.getLineHeight(-0.5), this.bar.index + 1));
        } else if (!hasSpaceAfterStartGlyphs) {
            this.addPreBeatGlyph(new SpacingGlyph(0, 0, this.smuflMetrics.oneStaffSpace));
        }
    }

    protected override createLinePreBeatGlyphs(): void {
        if (
            this._isOnlyNumbered &&
            (!this.bar.previousBar ||
                (this.bar.previousBar &&
                    this.bar.masterBar.timeSignatureNumerator !==
                        this.bar.previousBar.masterBar.timeSignatureNumerator) ||
                (this.bar.previousBar &&
                    this.bar.masterBar.timeSignatureDenominator !==
                        this.bar.previousBar.masterBar.timeSignatureDenominator) ||
                (this.bar.previousBar &&
                    this.bar.masterBar.isFreeTime &&
                    this.bar.masterBar.isFreeTime !== this.bar.previousBar.masterBar.isFreeTime))
        ) {
            this.createStartSpacing();
            this._createTimeSignatureGlyphs();
        }
    }

    private _createTimeSignatureGlyphs(): void {
        const masterBar = this.bar.masterBar;
        const g = new ScoreTimeSignatureGlyph(
            0,
            this.getLineY(0),
            masterBar.timeSignatureNumerator,
            masterBar.timeSignatureDenominator,
            masterBar.timeSignatureCommon,
            masterBar.isFreeTime &&
                (masterBar.previousMasterBar == null ||
                    masterBar.isFreeTime !== masterBar.previousMasterBar!.isFreeTime)
        );
        g.barSubElement = BarSubElement.NumberedTimeSignature;
        this.addPreBeatGlyph(g);
    }

    protected override createPostBeatGlyphs(): void {
        if (this._isOnlyNumbered) {
            super.createPostBeatGlyphs();
        }
    }

    protected override createVoiceGlyphs(v: Voice): void {
        if (this._staffUsesJianpuEventsOnly()) {
            return;
        }

        if (v.index > 0) {
            return;
        }

        super.createVoiceGlyphs(v);

        const absoluteStart = this.bar.masterBar.start;
        for (const b of v.beats) {
            const mainContainer = new NumberedBeatContainerGlyph(b);
            this.addBeatGlyph(mainContainer);

            // create dashes and filler glyphs
            // we want a glyph on every quarter tick

            if (b.duration < Duration.Quarter) {
                const endTick = b.displayStart + b.displayDuration;
                let dashTick = b.displayStart + MidiUtils.QuarterTime;
                while (dashTick < endTick) {
                    const isFullTick = endTick - dashTick >= MidiUtils.QuarterTime;
                    if (isFullTick) {
                        const dash = new NumberedDashBeatContainerGlyph(v.index, absoluteStart + dashTick);
                        this.addBeatGlyph(dash);
                        mainContainer.addDash(dash);
                    }
                    // special case to create second note number, this logic doesn't play well with tuplets
                    else if (b.duration === Duration.Half && b.dots > 1) {
                        const remainingTickNumber = new NumberedNoteBeatContainerGlyphBase(
                            b,
                            absoluteStart + dashTick,
                            endTick - dashTick
                        );
                        this.addBeatGlyph(remainingTickNumber);
                        mainContainer.addNotes(remainingTickNumber);
                    }

                    dashTick += MidiUtils.QuarterTime;
                }
            }
        }
    }

    protected override paintBeamingStem(
        _beat: Beat,
        _cy: number,
        _x: number,
        _topY: number,
        _bottomY: number,
        _canvas: ICanvas
    ): void {}

    protected override get beamSpacing(): number {
        return this.smuflMetrics.numberedBarRendererBarSpacing;
    }

    protected override get beamThickness(): number {
        return this.smuflMetrics.numberedBarRendererBarSize;
    }

    protected override paintBeamHelper(
        cx: number,
        cy: number,
        canvas: ICanvas,
        h: BeamingHelper,
        flagsElement: BeatSubElement,
        beamsElement: BeatSubElement
    ): void {
        if (this._staffUsesJianpuEventsOnly() && this.bar.jianpuEvents.length > 0) {
            return;
        }
        if (h.voice?.index === 0) {
            super.paintBeamHelper(cx, cy, canvas, h, flagsElement, beamsElement);
        }
    }

    /**
     * simple-notation 减时线：groupNotesForBeam + drawUnderlineGroup（渲染期分组）。
     */
    private _paintSimpleNotationUnderlines(cx: number, cy: number, canvas: ICanvas, flagsElement: BeatSubElement): void {
        const drawNotes = this._collectJianpuDrawNotes();
        if (drawNotes.length === 0) {
            return;
        }

        const denom = this.bar.masterBar.timeSignatureDenominator;
        const beatValue = beatValueFromDenominator(denom);
        const groups = groupNotesForBeam(drawNotes, beatValue);
        const baseY = cy + this.y + this._simpleNotationUnderlineBaseY();

        const styleBeat = this._jianpuBeats[0];
        if (styleBeat) {
            using _ = ElementStyleHelper.beat(canvas, flagsElement, styleBeat);
        }

        for (const group of groups) {
            const underlineCount = Math.max(0, ...group.map(n => n.underlineCount ?? 0));
            drawUnderlineGroup(canvas, cx + this.x, baseY, group, underlineCount);
        }
    }

    /** 弧顶连音线：bar.jianpuTiePairs + event 标志 + 跨小节 pending */
    private _paintSimpleNotationTieLines(cx: number, cy: number, canvas: ICanvas): void {
        const layouts = this._collectJianpuEventLayouts(true);
        const drawNotes = buildJianpuDrawNotes(
            this.bar.jianpuEvents,
            layouts,
            this.bar.masterBar.timeSignatureDenominator
        );
        if (drawNotes.length === 0) {
            this.bar.staff.jianpuPendingTieDrawX = -1;
            this.bar.staff.jianpuPendingTieDrawY = -1;
            return;
        }

        const absCx = cx + this.x;
        const absCy = cy + this.y;
        const tieYOffset = -10;

        const layoutByEventIndex = new Map<number, JianpuDrawNote>();
        for (const note of drawNotes) {
            layoutByEventIndex.set(note.eventIndex, note);
        }

        const drawTieBetweenNotes = (from: JianpuDrawNote, to: JianpuDrawNote) => {
            const x1 = absCx + from.centerX;
            const y1 = absCy + from.centerY + tieYOffset;
            const x2 = absCx + to.centerX;
            const y2 = absCy + to.centerY + tieYOffset;
            drawSingleTieLine(canvas, x1, y1, x2, y2, Math.abs(x2 - x1));
        };

        canvas.color = this.resources.mainGlyphColor;

        const drawnPairs = new Set<string>();
        const tryDrawTiePair = (origin: number, dest: number) => {
            if (origin < 0 || dest <= origin) {
                return;
            }
            const key = `${origin}:${dest}`;
            if (drawnPairs.has(key)) {
                return;
            }
            const fromNote = layoutByEventIndex.get(origin);
            const toNote = layoutByEventIndex.get(dest);
            if (fromNote && toNote && !fromNote.isRest && !toNote.isRest) {
                drawTieBetweenNotes(fromNote, toNote);
                drawnPairs.add(key);
            }
        };

        let pendingX = this.bar.staff.jianpuPendingTieDrawX;
        let pendingY = this.bar.staff.jianpuPendingTieDrawY;
        const crossDest = this.bar.jianpuCrossBarTieDestIndex;
        if (crossDest != null && pendingX >= 0 && pendingY >= 0) {
            const destNote = layoutByEventIndex.get(crossDest);
            if (destNote && !destNote.isRest) {
                const x1 = pendingX;
                const y1 = pendingY + tieYOffset;
                const x2 = absCx + destNote.centerX;
                const y2 = absCy + destNote.centerY + tieYOffset;
                drawSingleTieLine(canvas, x1, y1, x2, y2, Math.abs(x2 - x1));
            }
            pendingX = -1;
            pendingY = -1;
        }

        const events = this.bar.jianpuEvents;
        for (const { origin, dest } of this.bar.jianpuTiePairs ?? []) {
            tryDrawTiePair(origin, dest);
        }
        for (let i = 0; i < events.length - 1; i++) {
            const fromEvent = events[i];
            const toEvent = events[i + 1];
            if (fromEvent?.tieToNext && toEvent?.tiedFromPrev) {
                tryDrawTiePair(i, i + 1);
            }
        }

        const pendingOrigin = this.bar.jianpuPendingTieOriginIndex;
        if (pendingOrigin != null) {
            const originNote = layoutByEventIndex.get(pendingOrigin);
            if (originNote && !originNote.isRest) {
                this.bar.staff.jianpuPendingTieDrawX = absCx + originNote.centerX;
                this.bar.staff.jianpuPendingTieDrawY = absCy + originNote.centerY;
            } else {
                this.bar.staff.jianpuPendingTieDrawX = -1;
                this.bar.staff.jianpuPendingTieDrawY = -1;
            }
        } else {
            this.bar.staff.jianpuPendingTieDrawX = -1;
            this.bar.staff.jianpuPendingTieDrawY = -1;
        }
    }

    private _collectJianpuDrawNotes(): JianpuDrawNote[] {
        const layouts = this._collectJianpuEventLayouts(true);
        if (layouts.length === 0) {
            return [];
        }
        return buildJianpuDrawNotes(
            this.bar.jianpuEvents,
            layouts,
            this.bar.masterBar.timeSignatureDenominator
        );
    }

    private _collectJianpuEventLayouts(includeAllEvents: boolean = false): JianpuEventLayoutCoords[] {
        const eventCount = Math.min(this._jianpuBeats.length, this.bar.jianpuEvents.length);
        const layouts: JianpuEventLayoutCoords[] = [];

        for (let i = 0; i < eventCount; i++) {
            if (!includeAllEvents && !this._jianpuEventHasGlyph(i)) {
                continue;
            }

            const beat = this._jianpuBeats[i]!;
            const preX = this._jianpuEventLineX(i, 'pre');
            const postX = this._jianpuEventLineX(i, 'post');
            const container = this._getBeatContainerForEventIndex(i);
            let centerY = this.getLineY(0);
            if (container) {
                const numberedContainer = container as NumberedBeatContainerGlyph;
                const onNotes = numberedContainer.onNotes as NumberedBeatGlyph;
                if (onNotes.noteHeads) {
                    centerY = container.y + onNotes.y + onNotes.noteHeads.y;
                }
            }

            layouts.push({
                eventIndex: i,
                preX,
                postX,
                centerX: (preX + postX) / 2,
                width: Math.max(0, postX - preX),
                centerY,
                playbackStart: beat.playbackStart
            });
        }

        return layouts;
    }

    private _simpleNotationUnderlineBaseY(): number {
        const minGap = this.smuflMetrics.numberedBarRendererBarSpacing;
        return this._maxJianpuBeamingBottom + minGap;
    }

    private _getBeatContainerForEventIndex(eventIndex: number): BeatContainerGlyphBase | undefined {
        const beat = this._jianpuBeats[eventIndex];
        if (!beat) {
            return undefined;
        }

        let container = this.voiceContainer.getBeatContainer(beat);
        if (container) {
            return container;
        }

        const voiceGlyphs = this.voiceContainer.beatGlyphs.get(beat.voice?.index ?? 0);
        if (!voiceGlyphs) {
            return undefined;
        }

        for (const glyph of voiceGlyphs) {
            if (glyph.beatId === beat.id) {
                return glyph;
            }
        }

        let mainIdx = 0;
        for (const glyph of voiceGlyphs) {
            if (glyph.beatId < 0) {
                continue;
            }
            if (mainIdx === eventIndex) {
                return glyph;
            }
            mainIdx++;
        }

        return undefined;
    }

    private _jianpuEventLineX(eventIndex: number, edge: 'pre' | 'post'): number {
        const beat = this._jianpuBeats[eventIndex];
        if (!beat) {
            return 0;
        }
        const pos = edge === 'pre' ? BeatXPosition.PreNotes : BeatXPosition.PostNotes;
        const container = this._getBeatContainerForEventIndex(eventIndex);
        if (container) {
            const inner = container.getBeatX(pos, false);
            return this.beatGlyphsStart + container.x + inner;
        }
        return this.getBeatX(beat, pos);
    }

    protected override applyBarShift(
        _h: BeamingHelper,
        _direction: BeamDirection,
        _drawingInfo: BeamingHelperDrawInfo,
        _barCount: number
    ): number {
        return 0;
    }

    protected override calculateBeamYWithDirection(h: BeamingHelper, _x: number, direction: BeamDirection): number {
        this.ensureBeamDrawingInfo(h, direction);
        const info = h.drawingInfos.get(direction)!;
        if (direction === BeamDirection.Up) {
            return Math.min(info.startY, info.endY);
        } else {
            return Math.max(info.startY, info.endY);
        }
    }

    /**
     * Y of the lowest duration underline (barIndex 0), placed fully below note digits.
     * Each line's filled rect extends upward by |barSize|, so we offset barStart accordingly.
     */
    private _jianpuDurationBarStartY(h: BeamingHelper): number {
        const barCount = ModelUtils.getIndex(h.shortestDuration) - 2;
        if (barCount <= 0) {
            return this._maxJianpuBeamingBottom;
        }
        const minGap = this.smuflMetrics.numberedBarRendererBarSpacing;
        const barSpacing = -(this.beamSpacing + this.beamThickness);
        const barSize = -this.beamThickness;
        const closestOffset = (barCount - 1) * barSpacing + barSize;
        return this._maxJianpuBeamingBottom + minGap - closestOffset;
    }

    public override ensureBeamDrawingInfo(h: BeamingHelper, direction: BeamDirection): void {
        super.ensureBeamDrawingInfo(h, direction);
        if (direction === BeamDirection.Down && this._maxJianpuBeamingBottom > -10000) {
            const info = h.drawingInfos.get(direction);
            if (info) {
                const startY = this._jianpuDurationBarStartY(h);
                info.startY = startY;
                info.endY = startY;
            }
        }
    }

    protected override paintTuplets(
        cx: number,
        cy: number,
        canvas: ICanvas,
        beatElement: BeatSubElement,
        _bracketsAsArcs: boolean = false
    ): void {
        super.paintTuplets(cx, cy, canvas, beatElement, true);
    }
}


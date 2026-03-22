import { NoteCloner } from '@coderline/alphatab/generated/model/NoteCloner';
import { NoteSerializer } from '@coderline/alphatab/generated/model/NoteSerializer';
import { Note } from '@coderline/alphatab/model/Note';
import { expect } from 'chai';

describe('NoteTests', () => {
    it('tab-display-text-is-serialized', () => {
        const original = new Note();
        original.tabDisplayText = 'X';

        const json = NoteSerializer.toJson(original)!;
        expect(json.get('tabdisplaytext')).to.equal('X');

        const restored = new Note();
        NoteSerializer.fromJson(restored, json);
        expect(restored.tabDisplayText).to.equal('X');
    });

    it('tab-display-text-is-cloned', () => {
        const original = new Note();
        original.tabDisplayText = 'X';

        const clone = NoteCloner.clone(original);
        expect(clone.tabDisplayText).to.equal('X');
    });
});

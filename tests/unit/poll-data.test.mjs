import test from 'node:test';
import assert from 'node:assert/strict';
import { readPollOptions } from '../../src/lib/poll-data.ts';

test('poll options validate nested data and reject duplicate IDs', () => {
  assert.deepEqual(readPollOptions([null, 2, {}, { id: '', text: 'Empty' }, { id: 'x', text: 'Yes', votes: 3 }, { id: 'x', text: 'Duplicate' }, { id: 'y', text: 'No', votes: -1 }]), [
    { id: 'x', text: 'Yes', votes: 3 }, { id: 'y', text: 'No', votes: 0 },
  ]);
  assert.deepEqual(readPollOptions({}), []);
});

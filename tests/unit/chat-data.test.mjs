import test from 'node:test';
import assert from 'node:assert/strict';
import { chatSettingsSchema, parseChatEmotes, parseChatFilterResult } from '../../src/lib/chat-data.ts';

test('chat moderation sends only explicit valid approved output', () => {
  assert.deepEqual(parseChatFilterResult([{is_blocked:false,filtered_message:'Great game!'}]),{blocked:false,message:'Great game!'});
  assert.deepEqual(parseChatFilterResult([{is_blocked:true}]),{blocked:true});
});

test('chat moderation never falls back to an unapproved original draft', () => {
  for (const value of [null, [], {}, [{is_blocked:'false',filtered_message:'text'}],
    [{filtered_message:'text'}], [{is_blocked:false}], [{is_blocked:false,filtered_message:''}],
    [{is_blocked:false,filtered_message:'   '}], [{is_blocked:false,filtered_message:'x'.repeat(2001)}],
    [{is_blocked:false,filtered_message:'one'},{is_blocked:false,filtered_message:'two'}]]) {
    assert.throws(()=>parseChatFilterResult(value),/moderation could not be confirmed/);
  }
});

test('chat settings default to enabled abuse protections', () => {
  const settings = chatSettingsSchema.parse({});
  assert.equal(settings.auto_mod_settings.enabled, true);
  assert.equal(settings.auto_mod_settings.spam_detection, true);
  assert.equal(settings.auto_mod_settings.link_protection, true);
  assert.equal(settings.auto_mod_settings.caps_limit_percent, 80);
  assert.equal(settings.auto_mod_settings.max_emotes, 20);
  assert.deepEqual(settings.auto_mod_settings.blocked_terms, []);
  assert.equal(settings.slow_mode, false);
});
test('chat settings reject malformed JSON and invalid limits', () => {
  for (const input of [true, [], { slow_mode: 'false' }, { slow_mode_interval: -1 },
    { auto_mod_settings: { caps_limit_percent: 101 } }]) {
    assert.equal(chatSettingsSchema.safeParse(input).success, false);
  }
});
test('emotes validate nested permissions instead of trusting JSON', () => {
  const emote = { id: 'one', name: 'Wave', url: 'https://example.com/wave.png', created_at: '2026-09-09' };
  assert.equal(parseChatEmotes([emote]).length, 1);
  assert.equal(parseChatEmotes([{ ...emote, permissions: true }]).length, 0);
  assert.equal(parseChatEmotes([{ ...emote, permissions: { subscriber_only: true } }])[0].permissions.subscriber_only, true);
  assert.equal(parseChatEmotes([null, 42, {}]).length, 0);
});

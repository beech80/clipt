import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {inspectH264Mp4} from '../../supabase/functions/_shared/mp4-proof.ts';
const source=readFileSync(new URL('../fixtures/clip-test-h264.mp4',import.meta.url));
test('server parser recognizes actual H264 fixture metadata',()=>{
 const proof=inspectH264Mp4(source);assert.ok(proof.width>0&&proof.height>0&&proof.durationSeconds>0);assert.equal(proof.codec,'avc1');
});
test('server parser rejects forged MIME text and truncated containers',()=>{
 assert.throws(()=>inspectH264Mp4(Buffer.from('video/mp4 not a real movie')));
 for(const length of [32,100,Math.floor(source.length/2),source.length-1])assert.throws(()=>inspectH264Mp4(source.subarray(0,length)));
});
test('server parser rejects HEVC sample entries and overflowing sizes',()=>{
 const hevc=Buffer.from(source),at=hevc.indexOf(Buffer.from('avc1'),hevc.indexOf(Buffer.from('stsd')));assert.ok(at>0);hevc.write('hvc1',at);assert.throws(()=>inspectH264Mp4(hevc));
 const oversized=Buffer.from(source);oversized.writeUInt32BE(0xffffffff,0);assert.throws(()=>inspectH264Mp4(oversized));
});
test('duplicate media identity ignores MP4 metadata padding',()=>{
 const padding=Buffer.alloc(32,65);padding.writeUInt32BE(32,0);padding.write('free',4);
 const modified=Buffer.concat([source,padding]);
 const hash=bytes=>{const proof=inspectH264Mp4(bytes),hasher=createHash('sha256');for(const range of proof.mediaRanges)hasher.update(bytes.subarray(range.start,range.end));return hasher.digest('hex');};
 assert.equal(hash(source),hash(modified));
});

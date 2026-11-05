import {execFileSync} from 'node:child_process';import {mkdirSync} from 'node:fs';import {fileURLToPath} from 'node:url';
const dir=fileURLToPath(new URL('../tests/fixtures/channel-hls/',import.meta.url));mkdirSync(dir,{recursive:true});
execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-i',fileURLToPath(new URL('../tests/fixtures/clip-test-h264.mp4',import.meta.url)),'-c','copy','-f','hls','-hls_time','1','-hls_list_size','0','-hls_segment_filename',dir+'segment-%03d.ts',dir+'index.m3u8'],{stdio:'inherit'});console.log('Generated synthetic HLS fixture for isolated live-page playback.');

// A real portrait H.264 file exercises intrinsic dimensions on both browser engines.
execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-i',fileURLToPath(new URL('../tests/fixtures/clip-test-h264.mp4',import.meta.url)),'-vf','transpose=1','-an','-c:v','libx264','-preset','ultrafast','-pix_fmt','yuv420p','-movflags','+faststart',dir+'portrait.mp4'],{stdio:'inherit'});
console.log('Generated synthetic portrait H.264 fixture.');

import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
// Synthetic, one-second fixture; never reads or uploads customer media.
const file=fileURLToPath(new URL('../tests/fixtures/clip-test-hevc.mp4',import.meta.url));
execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-f','lavfi','-i','testsrc2=size=160x90:rate=10','-f','lavfi','-i','sine=frequency=440:sample_rate=44100','-t','1','-c:v','libx265','-threads','1','-x265-params','pools=1:frame-threads=1:log-level=error','-tag:v','hvc1','-pix_fmt','yuv420p','-c:a','aac','-movflags','+faststart','-y',file],{stdio:'inherit'});
console.log('Generated a synthetic HEVC + AAC test fixture.');

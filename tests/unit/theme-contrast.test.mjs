import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const css = readFileSync(new URL('../../src/index.css',import.meta.url),'utf8');
function luminance(name) {
  const match = css.match(new RegExp(`--${name}:\\s*([\\d.]+) ([\\d.]+)% ([\\d.]+)%`));
  assert.ok(match,`Missing theme token ${name}`);
  const hue = Number(match[1])/60, saturation = Number(match[2])/100, light = Number(match[3])/100;
  const chroma = (1-Math.abs(2*light-1))*saturation;
  const x = chroma*(1-Math.abs(hue%2-1)), m = light-chroma/2;
  const rgb = [[chroma,x,0],[x,chroma,0],[0,chroma,x],[0,x,chroma],[x,0,chroma],[chroma,0,x]][Math.floor(hue)%6];
  const linear = rgb.map(component => {const value = component+m; return value <= .04045 ? value/12.92 : ((value+.055)/1.055)**2.4;});
  return linear[0]*.2126+linear[1]*.7152+linear[2]*.0722;
}
test('dark theme text token pairs meet normal-text WCAG AA contrast', () => {
  for (const [foreground,background] of [['foreground','background'],['card-foreground','card'],['popover-foreground','popover'],['primary-foreground','primary'],['secondary-foreground','secondary'],['muted-foreground','muted'],['muted-foreground','card'],['accent-foreground','accent'],['destructive-foreground','destructive']]) {
    const values = [luminance(foreground),luminance(background)].sort((a,b) => b-a);
    assert.ok((values[0]+.05)/(values[1]+.05)>=4.5,`${foreground} on ${background} is below 4.5:1`);
  }
});

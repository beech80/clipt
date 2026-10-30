import {readFile,mkdir} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from '@playwright/test';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const css=await readFile(resolve(root,'src/components/GameBoyControls.css'),'utf8');
const appearance=css.match(/\.clipt-controller-home\s*\{([^}]+)\}/)?.[1];
if(!appearance)throw Error('Original CLIPT button appearance was not found.');
const reference=await readFile(resolve(root,'public/img/clipt-start-reference-v1.png'));
const output=resolve(root,'outputs/native-brand');
await mkdir(output,{recursive:true});
const browser=await chromium.launch();
try{
 const page=await browser.newPage({viewport:{width:256,height:256},deviceScaleFactor:4,reducedMotion:'reduce'});
 const html='<!doctype html><html><head><meta charset="utf-8"><style>*{box-sizing:border-box}html,body{margin:0;width:256px;height:256px;background:#000;font-family:Arial,sans-serif}.clipt-controller-home{'+appearance+'}button.clipt-controller-home{position:absolute;left:96px;top:96px;transform:scale(2.75);animation:none!important;transition:none!important}</style></head><body><button class="clipt-controller-home" aria-label="CLIPT">CLIPT</button></body></html>';
 await page.route('**/*',async route=>{
  const url=new URL(route.request().url());
  if(url.origin!=='http://clipt-native-assets.invalid')return route.abort();
  if(url.pathname==='/')return route.fulfill({status:200,contentType:'text/html',body:html});
  if(url.pathname==='/img/clipt-start-reference-v1.png')return route.fulfill({status:200,contentType:'image/png',body:reference});
  return route.abort();
 });
 await page.goto('http://clipt-native-assets.invalid/');
 await page.locator('.clipt-controller-home').evaluate(async()=>{await document.fonts.ready;});
 // Wait for the actual original background to decode before capturing it.
 await page.evaluate(async()=>{const image=new Image();image.src='/img/clipt-start-reference-v1.png';await image.decode();});
 const png=await page.screenshot({path:resolve(output,'clipt-icon-1024.png'),animations:'disabled'});
 if(png.readUInt32BE(16)!==1024||png.readUInt32BE(20)!==1024)throw Error('Native icon dimensions were not verified.');
 if(png[25]!==2)throw Error('Native app icons must use opaque RGB PNG output.');
 console.log('Rendered original CLIPT control artwork for native launch assets (1024x1024).');
}finally{await browser.close();}

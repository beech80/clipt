import {readFile,appendFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {developmentPreviewEnvironment,verifyPreviewPublicKey} from './preview-environment.mjs';

// This file accepts browser-safe development configuration only. It never
// imports server secrets or changes hosted settings, billing, or release gates.
export function nativeDeviceEnvironment(value) {
 if(!value||typeof value!=='object'||Array.isArray(value)
  ||Object.keys(value).sort().join(',')!=='supabaseAnonKey,supabaseUrl')
  throw Error('Use only the reviewed public development configuration fields.');
 const key=value.supabaseAnonKey;
 if(typeof key!=='string'||!/^sb_publishable_[A-Za-z0-9_-]{16,}$/.test(key))
  throw Error('A native phone test requires a valid publishable key; server credentials are forbidden.');
 const config=developmentPreviewEnvironment({
  VITE_SUPABASE_URL:value.supabaseUrl,VITE_SUPABASE_ANON_KEY:key,
 });
 return {VITE_APP_ENV:'staging',VITE_SUPABASE_URL:config.supabaseUrl,VITE_SUPABASE_ANON_KEY:config.supabaseAnonKey};
}
export async function prepareNativeDeviceEnvironment(config,{verify=verifyPreviewPublicKey,write}={}) {
 const env=nativeDeviceEnvironment(config);
 await verify({supabaseUrl:env.VITE_SUPABASE_URL,supabaseAnonKey:env.VITE_SUPABASE_ANON_KEY});
 if(typeof write!=='function')throw Error('A destination for the reviewed build environment is required.');
 await write(Object.entries(env).map(([name,value])=>name+'='+value+'\n').join(''));
 return {stage:env.VITE_APP_ENV,supabaseUrl:env.VITE_SUPABASE_URL};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 if(!process.env.GITHUB_ENV)throw Error('Run this build helper in the native owner-test workflow.');
 const config=JSON.parse(await readFile(new URL('../native/development-client.json',import.meta.url),'utf8'));
 await prepareNativeDeviceEnvironment(config,{write:body=>appendFile(process.env.GITHUB_ENV,body)});
 console.log('Verified and selected browser-safe development configuration. No hosted settings were changed.');
}

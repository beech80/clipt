"""Read built artifacts; never sign, upload, or print client/server credentials."""
import json, pathlib, sys, zipfile

results=[]
for argument in sys.argv[1:]:
    path=pathlib.Path(argument)
    prefix='base/' if path.suffix=='.aab' else ''
    with zipfile.ZipFile(path) as archive:
        names=archive.namelist()
        if any(n.endswith('.so') for n in names):
            raise RuntimeError('Unexpected native ELF library: review 16 KB alignment before release.')
        if any(n.startswith('META-INF/') and n.upper().endswith(('.RSA','.DSA','.EC','.SF')) for n in names):
            raise RuntimeError('A private signing identity must not enter the unsigned preparation artifact.')
        for name in names:
            if name.endswith('.dex'):
                binary=archive.read(name)
                if b'Lcom/clipt/broadcast/' in binary or b'CLIPT-native-smoke.json' in binary:
                    raise RuntimeError('Broadcasting or the debug smoke probe entered the Release binary.')
        config=json.loads(archive.read(prefix+'assets/capacitor.config.json'))
        plugins=json.loads(archive.read(prefix+'assets/capacitor.plugins.json'))
        receipt=json.loads(archive.read(prefix+'assets/public/clipt-native-release.json'))
        classes=[p['classpath'] for p in plugins]
        if config.get('appId')!='com.slnjliheyiiummxhrgmk.clip' or config.get('server',{}).get('url') or config.get('server',{}).get('cleartext') is not False:
            raise RuntimeError('Foreign identity or a remotely loaded/cleartext native bridge was found.')
        if set(classes)!={'com.capacitorjs.plugins.app.AppPlugin','com.capacitorjs.plugins.share.SharePlugin'}:
            raise RuntimeError('Unexpected native plugin registration.')
        if receipt.get('profile')!='play-store' or receipt.get('backend')!='https://slnjliheyiiummxhrgmk.supabase.co' or any(receipt.get(k) is not False for k in ['broadcasting','purchases','tracking']):
            raise RuntimeError('Store receipt failed closed.')
        if prefix and 'BundleConfig.pb' not in names:
            raise RuntimeError('The Google Play bundle configuration is missing.')
        results.append({'file':path.name,'receipt':receipt,'pluginClasses':classes,'nativeELFLibraries':0,'debugProbeInRelease':False,'nativeBroadcasterIncluded':False})
print(json.dumps(results))

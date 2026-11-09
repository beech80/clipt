import hashlib, pathlib, shutil, zipfile

root=pathlib.Path.cwd()
out=root/'outputs/android-store'
out.mkdir(parents=True,exist_ok=True)
project=out/'CLIPT-prepared-Android-Studio.zip'
excluded={'build','.gradle','.git','.idea','node_modules'}
with zipfile.ZipFile(project,'w',zipfile.ZIP_DEFLATED) as archive:
    for location in [root/'android',root/'node_modules/@capacitor/android',root/'node_modules/@capacitor/app',root/'node_modules/@capacitor/share']:
        for file in location.rglob('*'):
            relative=file.relative_to(location)
            if not file.is_file() or any(p in excluded for p in relative.parts) or file.name=='local.properties' or file.suffix in {'.jks','.keystore'}:
                continue
            archive.write(file,'CLIPT-Android-prepared/'+str(file.relative_to(root)))
    archive.write(root/'docs/ANDROID-STORE-PREPARATION.md','CLIPT-Android-prepared/READ-ME.md')
    archive.write(out/'BUILD-INFO.json','CLIPT-Android-prepared/BUILD-INFO.json')
for source,name in [('android/app/build/outputs/apk/release/app-release-unsigned.apk','CLIPT-unsigned-release.apk'),('android/app/build/outputs/bundle/release/app-release.aab','CLIPT-unsigned-release.aab')]:
    shutil.copyfile(root/source,out/name)
with (out/'SHA256SUMS.txt').open('w') as checks:
    for file in [project,out/'CLIPT-unsigned-release.apk',out/'CLIPT-unsigned-release.aab']:
        checks.write(hashlib.sha256(file.read_bytes()).hexdigest()+'  '+file.name+'\n')
print('Packaged the Android Studio source project and unsigned artifacts; no private keys or SDK paths included.')

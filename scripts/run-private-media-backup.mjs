import {connectBackup,BackupError} from './lib/media-backup.mjs';
import {backupContext,privateSourceClient,runPrivateBackup} from './lib/private-media-backup.mjs';
let stage='context';
try{
 backupContext(process.env);stage='destination-preflight';
 const client=await connectBackup({keyId:process.env.CLIPT_B2_KEY_ID,applicationKey:process.env.CLIPT_B2_APPLICATION_KEY,writeScope:'private-recurring-v1'});
 delete process.env.CLIPT_B2_KEY_ID;delete process.env.CLIPT_B2_APPLICATION_KEY;
 const source=privateSourceClient(process.env);stage='private-inventory';const inventory=await source.inventory();
 stage='private-copy-and-restore';
 console.log(JSON.stringify(await runPrivateBackup(inventory,client,source,{progress:value=>console.log(JSON.stringify(value))})));
}catch(error){
 console.error(JSON.stringify({stage,backupCompleted:false,restoreCompleted:false,code:error instanceof BackupError?error.code:'private-backup-stopped-for-review',productionFilesModified:false,bucketPrivacyChanged:false}));process.exitCode=1;
}finally{delete process.env.CLIPT_B2_KEY_ID;delete process.env.CLIPT_B2_APPLICATION_KEY;}

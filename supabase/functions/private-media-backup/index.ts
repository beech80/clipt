import {createPrivateBackupHandler} from '../_shared/private-backup-handler.mjs';
import {REVIEWED_BACKUP_FILES} from './reviewed-runner.mjs';
Deno.serve(createPrivateBackupHandler({reviewedFiles:REVIEWED_BACKUP_FILES,getEnv:(key:string)=>Deno.env.get(key)}));

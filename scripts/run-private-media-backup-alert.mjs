import {reportPrivateBackup} from './report-private-media-backup.mjs';
try{console.log(JSON.stringify(await reportPrivateBackup({env:process.env})));}catch{console.error(JSON.stringify({alert:'delivery-failed'}));process.exitCode=1;}

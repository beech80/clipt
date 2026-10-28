import { readFile } from 'node:fs/promises';
import { connectBackup, bootstrapTransport, openInventory, backupAndRestore, CONTROL, BackupError } from './lib/media-backup.mjs';

let stage = 'connect';
try {
  if (process.env.GITHUB_REPOSITORY !== 'beech80/clipt' || process.env.GITHUB_REF !== 'refs/heads/main') throw Error('runner-context');
  const client = await connectBackup({ keyId: process.env.CLIPT_B2_KEY_ID, applicationKey: process.env.CLIPT_B2_APPLICATION_KEY });
  delete process.env.CLIPT_B2_KEY_ID; delete process.env.CLIPT_B2_APPLICATION_KEY;
  let envelopeText;
  try { envelopeText = await readFile('operations/media-backup-envelope.json', 'utf8'); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  if (!envelopeText) {
    stage = 'bootstrap-transport'; console.log(JSON.stringify(await bootstrapTransport(client)));
  } else {
    stage = 'decrypt-inventory';
    const keyFile = await client.find(CONTROL); if (!keyFile) throw Error('transport-missing');
    const privateKey = (await client.get(keyFile, 20_000)).toString();
    const inventory = openInventory(JSON.parse(envelopeText), privateKey);
    stage = 'backup-and-isolated-restore';
    console.log(JSON.stringify(await backupAndRestore(inventory, client, { progress: r => console.log(JSON.stringify(r)) })));
  }
} catch (error) {
  // Never print exceptions, HTTP bodies, source paths, private keys or storage tokens.
  console.error(JSON.stringify({ stage, backupCompleted: false, verificationCompleted: false,
    code: error instanceof BackupError ? error.code : 'backup-stopped-for-review', productionFilesModified: false }));
  process.exitCode = 1;
} finally {
  delete process.env.CLIPT_B2_KEY_ID; delete process.env.CLIPT_B2_APPLICATION_KEY;
}

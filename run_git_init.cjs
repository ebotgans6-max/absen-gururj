const git = require('isomorphic-git');
const fs = require('fs');
const path = require('path');

const dir = 'c:/Absen-GuruRj';

async function main() {
  console.log('1. Initializing Git repository...');
  await git.init({ fs, dir, defaultBranch: 'main' });
  console.log('Git repo initialized at', dir);

  console.log('2. Staging files...');
  // Using git.statusMatrix to list and stage files respecting .gitignore
  const statusMatrix = await git.statusMatrix({ fs, dir });
  let addedCount = 0;
  for (const [filepath, head, workdir, stage] of statusMatrix) {
    if (workdir !== 0) { // exists in workdir
      await git.add({ fs, dir, filepath });
      addedCount++;
    }
  }
  console.log(`Staged ${addedCount} files.`);

  console.log('3. Committing...');
  const sha = await git.commit({
    fs,
    dir,
    author: {
      name: 'Guru RJ',
      email: 'gururj@example.com',
    },
    message: 'Versi awal Guru RJ',
  });

  console.log('Committed successfully with SHA:', sha);
}

main().catch(err => {
  console.error('Git error:', err);
  process.exit(1);
});

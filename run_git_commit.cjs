const git = require('isomorphic-git');
const fs = require('fs');

const dir = 'c:/Absen-GuruRj';

async function main() {
  const statusMatrix = await git.statusMatrix({ fs, dir });
  for (const [filepath, head, workdir, stage] of statusMatrix) {
    if (workdir !== head || workdir !== stage) {
      if (workdir === 0) {
        await git.remove({ fs, dir, filepath });
      } else {
        await git.add({ fs, dir, filepath });
      }
    }
  }

  const sha = await git.commit({
    fs,
    dir,
    author: {
      name: 'Guru RJ',
      email: 'gururj@example.com',
    },
    message: 'Update jadwal pelajaran, jam batas absen, dan proteksi batalkan badal',
  });

  console.log('Committed update with SHA:', sha);
}

main().catch(err => {
  console.error('Git error:', err);
  process.exit(1);
});

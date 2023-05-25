import fs from "fs-extra";
import FurtiveFileSystem from "..";

const ffs = new FurtiveFileSystem('./src/__test__/build');
ffs.setPassword('juln1234');

fs.emptyDir('./src/__test__/build');
fs.emptyDir('./src/__test__/build-restore');
// ffs.pushProject('./src', {
//   scope: 'dir1/dir2',
//   rename: 'project1',
//   ignore: [
//     './src/__test__/build/**',
//     './src/__test__/build-restore/**',
//   ],
// })
//   .then(() => {
//     console.log('=== pushProject okk');
//     ffs.restoreProject('dir1/dir2/project1', './src/__test__/build-restore', { rename: 'furtive-file-system-src' })
//       .then(() => console.log('=== restoreProject okk'));
//   })
//   .catch(() => console.log('error'));

// ffs.ls('dir1/dir2')
//   .then(tree => {
//     console.log('tree', JSON.stringify(tree, null, 2));
//     ffs.rmProject('project1', 'dir1/dir2')
//       .then(() => console.log('=== rmProject <dir1/dir2/project1> ok'));
//   });

// ffs.ls()
//   .then(tree => {
//     console.log('tree', JSON.stringify(tree, null, 2));
//     ffs.rmScope('dir1/dir2')
//       .then(() => console.log('=== rmScope <dir1/dir2> ok'));
//   });

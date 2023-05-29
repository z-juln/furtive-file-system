# furtive-file-system

Create a file system called `furtive file system`, where the directory name, file name, and file content are encrypted using `base64` + `blowfish` encryption method

## install

use api: `npm i furtive-file-system` or `yarn add furtive-file-system`

use cli: `npm i furtive-file-system -g` or `yarn global add furtive-file-system`

## use api

```typescript
import FurtiveFileSystem from 'furtive-file-system';

const cwd = '/Volumes/dev/furtive-workspace';
const password = 'you-password';

const ffs = new FurtiveFileSystem(cwd);
// if the password is illegal, an exception will be thrown
ffs.setPassword(password);

// push project <scope1/scope2/project1> from targetDir
ffs.pushProject('targetDir', {
  scope: 'scope1/scope2', // it can be one layer or multiple layers of scope
  rename: 'project1',
  ignore: [
    '.git/**/**',
    'node_modules/**/**',
  ],
})
  .then(() => console.log('=== pushProject okk'))
  .catch((error) => console.log('error', error?.message ?? error));
// result of furtive-file-system
// |-- scope1
//      |-- scope2
//            |-- project1

// restore project <scope1/scope2/project1> to <targetDir/rename-xxx>
ffs.restoreProject('scope1/scope2/project1', 'targetDir', { rename: 'rename-xxx' })
  .then(() => console.log('=== restoreProject okk'))
  .catch((error) => console.log('error', error?.message ?? error));

// ls all file-tree
ffs.ls()
  .then(tree => console.log('tree', JSON.stringify(tree, null, 2)))
  .catch((error) => console.log('error', error?.message ?? error));

// ls file-tree from scope <scope1/scope2>
ffs.ls('scope1/scope2')
  .then(tree => console.log('tree', JSON.stringify(tree, null, 2)))
  .catch((error) => console.log('error', error?.message ?? error));

// rmProject <scope1/scope2/project1> from furtive-file-system
ffs.rmProject('project1', 'scope1/scope2')
  .then(() => console.log('=== rmProject ok'))
  .catch((error) => console.log('error', error?.message ?? error));

// rmScope <scope1/scope2> from furtive-file-system
ffs.rmScope('scope1/scope2')
  .then(() => console.log('=== rmScope ok'))
  .catch((error) => console.log('error', error?.message ?? error));

// clean furtive-file-system
ffs.clean()
  .then(() => console.log('=== clean furtive-file-system ok'))
  .catch((error) => console.log('error', error?.message ?? error));
```

## use cli

help: `ffs -h`

version: `ffs -v`

set cwd: `ffs config set cwd=xxx`

get cwd: `ffs config get cwd`

ls all tree: `ffs ls`

ls scope: `ffs ls -l`

ls scope: `ffs ls scope1/scope2`

push project (by inquirer): `ffs push`

rm project: `ffs rm scope1/scope2/project1 --project`

rm scope: `ffs rm scope1/scope2 --scope`

clean all `ffs clean`

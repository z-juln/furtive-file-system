import path from 'path';
import os from 'os';
import fs from 'fs-extra';
import cac from 'cac';
import Configstore from 'configstore';
import { getConfigCli, cacHelpWithConfigCli } from 'config-cli-helper';
import FurtiveFileSystem, { SimpleFileTree } from '.';
const { name: pkgName, version } = require('../package.json');

const cliName = 'ffs';

const localStore = new Configstore(`config-cli__${pkgName}`, {
  config: {
    cwd: path.join(os.tmpdir(), pkgName),
  },
});

const ffs = new FurtiveFileSystem(localStore.get('cwd'));

if (process.argv[2] === 'config') {
  const configCli = getConfigCli({ cliName, configStore: localStore });
  configCli.parse(process.argv.slice(1));
  process.exit();
}

// TODO cli
const cli = cac(cliName);

cli
  .command('ls [scope]', 'List file tree')
  .action(async (scope) => {
    const tree = await ffs.ls(scope);
    if (!tree.length) {
      console.log('<empty>');
      return;
    }
    function treeToString(node: Pick<SimpleFileTree, 'realName' | 'children'>, indent = ''): string {
      let result = indent + node.realName + '\n';
      if (node.children) {
        const lastChild = node.children[node.children.length - 1];
        for (const child of node.children) {
          const isLastChild = child === lastChild;
          const symbol = isLastChild ? '└──' : '├──';
          const childIndent = indent + (isLastChild ? '    ' : '│   ');
          result += indent + symbol + treeToString(child, childIndent).slice(indent.length + 3);
        }
      }
      return result;
    }
    console.log(treeToString({ realName: '', children: tree }));
  });

cli
  .command('push', 'Push project')
  .option('--target <dir>', 'Set target directory')
  .option('--scope <scope>', 'Set project scope')
  .option('--rename <name>', 'Set project rename')
  .option('--ignore <globs>', 'Set ignore globs')
  .action(async ({ target, scope, rename, ignore }) => {
    await ffs.pushProject(target, { scope, rename, ignore });
    console.log('Push project successfully');
  });

cli
  .command('restore <scope>', 'Restore project')
  .option('--target <dir>', 'Set target directory')
  .option('--rename <name>', 'Set project rename')
  .action(async (scope, { target, rename }) => {
    await ffs.restoreProject(scope, target, { rename });
    console.log('Restore project successfully');
  });

cli
  .command('rm <scope>', 'Remove project or scope')
  .option('--project', 'Set remove project')
  .option('--scope', 'Set remove scope')
  .action(async (scope, { project, scope: rmScope }) => {
    if (project) {
      await ffs.rmProject(scope, rmScope);
      console.log(`Remove project ${scope} successfully`);
    } else if (rmScope) {
      await ffs.rmScope(scope);
      console.log(`Remove scope ${scope} successfully`);
    }
  });

cli
  .command('clean', 'Clean FurtiveFileSystem')
  .action(async () => {
    await ffs.clean();
    console.log('Clean FurtiveFileSystem successfully');
  });

cli.help(
  cacHelpWithConfigCli(cliName)
);
cli.version(version);

cli.parse();

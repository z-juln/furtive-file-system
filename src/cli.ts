import path from 'path';
import os from 'os';
import fs from 'fs-extra';
import cac from 'cac';
import inquirer from 'inquirer';
import Configstore from 'configstore';
import { getConfigCli, cacHelpWithConfigCli } from 'config-cli-helper';
import TtyTable from 'tty-table';
import { checkPassword } from 'gulp-dir-cipher';
import FurtiveFileSystem, { SimpleFileTree } from '.';
const { name: pkgName, version } = require('../package.json');

const cliName = 'ffs';

const defaultCwd = path.join(os.tmpdir(), pkgName);

const localStore = new Configstore(`config-cli__${pkgName}`, {
  config: {
    cwd: defaultCwd,
  },
});

const ffs = new FurtiveFileSystem(localStore.get('config').cwd);

if (process.argv[2] === 'config') {
  const configCli = getConfigCli({ cliName, configStore: localStore });
  configCli.parse(process.argv.slice(1));
  process.exit();
}

const inquirePassword = async () => {
  const answers = await inquirer
    .prompt<{ password: string; }>([
      {
        type: 'password',
        name: 'password',
        message: 'inquire password',
        validate(input: string) {
          try {
            if (checkPassword(input)) {
              return true;
            }
          } catch (error: any) {
            return error?.message ?? error;
          }
          return 'the password is illegal and must consist of an 8-byte string';
        },
      },
    ]);
  ffs.setPassword(answers.password);
};

const cli = cac(cliName);

cli
  .command('ls [scope]', 'List file tree')
  .option('-l, --list', 'List detailed information for the next layer of `scope`')
  .action(async (scope, { list }) => {
    await inquirePassword();
    const tree = await ffs.ls(scope);
    if (!tree.length) {
      console.log('<empty>');
      return;
    }
    if (list) {
      console.log(
        TtyTable(
          // @ts-ignore
          [{ value: 'realName' }, { value: 'size' }, { value: 'filename' }, { value: 'type' }],
          tree.map(({ realName, size, name, type }) => ({ realName, size, filename: name, type })),
          [],
          // @ts-ignore
          { headerAlign: 'center', align: "left", borderStyle: 'none' },
        ).render()
        // 去掉第一行的\n
        .replace('\n', '')
      );
      return;
    }
    function treeToString(node: Pick<SimpleFileTree, 'realName' | 'children'>, indent = '', result = ''): string {
      result += `${indent}${node.realName}\n`;
        if (node.children) {
        const lastChild = node.children[node.children.length - 1];
          for (let i = 0; i < node.children.length; i++) {
          const child = node.children[i];
          const isLastChild = child === lastChild;
          const symbol = isLastChild ? '└──' : '├──';
          const childIndent = indent + (isLastChild ? '    ' : '│   ');
          result += `${indent}${symbol}${treeToString(child, childIndent).slice(indent.length + 3)}`;
        }
      }
      return result;
    }
    console.log(treeToString({ realName: '', children: tree }));
  });

interface PushAnswers {
  target: string;
  scope?: string;
  name: string;
  /** Set ignore globs, separated by commas */
  ignore?: string;
}

cli
  .command('push', 'Push project')
  .action(async () => {
    await inquirePassword();
    const answers = await inquirer
      .prompt<PushAnswers>([
        {
          type: 'input',
          name: 'target',
          message: 'Set target directory',
          validate(input: string) {
            if (fs.existsSync(input)) {
              return true;
            }
            return `directory(${path.resolve(input)}) is not exists`;
          },
        },
        {
          type: 'input',
          name: 'scope',
          message: 'Push project to scope, separated by slash',
          default: '',
        },
        {
          type: 'input',
          name: 'name',
          message: 'rename project',
          default(answers: { target: string }) {
            return path.basename(path.resolve(answers.target));
          },
        },
        {
          type: 'input',
          name: 'ignore',
          message: 'Set ignore globs, separated by commas',
          default: 'node_modules',
        },
      ]);
    const target = path.resolve(answers.target);
    await ffs.pushProject(target, { scope: answers.scope, rename: answers.name, ignore: answers.ignore?.split(',') });
    console.log('Push project successfully');
  });

cli
  .command('restore <path>', 'Restore project')
  .option('-t, --target <dir>', 'Set target directory')
  .option('-r, --rename <name>', 'Set project rename')
  .action(async (path, { target, rename }) => {
    await inquirePassword();
    await ffs.restoreProject(path, target, { rename });
    console.log('Restore project successfully');
  });

cli
  .command('rm <name>', 'Remove project or scope')
  .option('-p, --project', 'Set remove project')
  .option('-s, --scope', 'Set remove scope')
  .action(async (name, { project, scope: rmScope }) => {
    await inquirePassword();
    if (project) {
      await ffs.rmProject(name, rmScope);
      console.log(`Remove project ${name} successfully`);
    } else if (rmScope) {
      await ffs.rmScope(name);
      console.log(`Remove scope ${name} successfully`);
    }
  });

cli
  .command('clean', 'Clean FurtiveFileSystem')
  .action(async () => {
    await inquirePassword();
    await ffs.clean();
    console.log('Clean FurtiveFileSystem successfully');
  });

cli.help(
  cacHelpWithConfigCli(cliName)
);
cli.version(version);

cli.parse();

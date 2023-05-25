import path from 'path';
import fs from 'fs-extra';
import gulp from 'gulp';
import gulpZip from 'gulp-zip';
// @ts-ignore
import gulpUnZip from 'gulp-unzip';
import gulpDirCipher, { checkPassword, decodeDirname, encodeDirname } from 'gulp-dir-cipher';
import { Dree, Type as DreeFileType, scanAsync as getDirTree } from 'dree';

export interface SimpleFileTree extends Pick<Dree, 'name' | 'size' | 'path' | 'relativePath'> {
  realName: string;
  type: 'scope' | 'project';
  children?: SimpleFileTree[];
};

class FurtiveFileSystem {
  public cwd: string;
  private password: string | null = null;

  constructor(cwd: string, opts?: { password?: string; }) {
    this.cwd = path.resolve(cwd);
    if (opts?.password) {
      this.setPassword(opts.password);
    }
  }

  setPassword(password: string) {
    if (!checkPassword(password)) {
      throw new Error('the password is illegal and must consist of an 8-byte string');
    }
    this.password = password;
  }

  async ls(scope?: string): Promise<SimpleFileTree[]> {
    const { cwd } = this;
    const encodedScope = scope ? scope.split('/').map(encodeDirname).join('/') : null;
    const tree = await getDirTree(encodedScope ? path.join(cwd, encodedScope) : cwd) as Dree | null;
    if (!tree) return [];
    const getSimpleFileTree = (dree: Dree, isRoot = false): SimpleFileTree => {
      return {
        realName: isRoot ? dree.name : decodeDirname(dree.name),
        name: dree.name,
        path: dree.path,
        relativePath: dree.relativePath,
        type: dree.type === DreeFileType.DIRECTORY ? 'scope' : 'project',
        size: dree.size,
        children: dree.children?.map(file => getSimpleFileTree(file)),
      };
    };
    return getSimpleFileTree(tree, true).children ?? [];
  }

  pushProject(dir: string, opts?: {
    /** it can be one layer or multiple layers of scope */
    scope?: string;
    rename?: string;
    /** glob pattern */
    ignore?: string | string[];
  }) {
    const { cwd, password } = this;

    if (!password)  {
      throw new Error('password is be invalid');
    }

    const { scope, rename } = opts ?? {};
    const encodedScope = scope ? scope.split('/').map(encodeDirname).join('/') : null;

    dir = path.resolve(dir);
    const projectName = rename ?? path.basename(dir);

    const ignore = opts?.ignore
      ? typeof opts.ignore === 'string'
        ? [dir, opts.ignore] : [dir, ...opts.ignore]
        : [];

    return new Promise<void>((resolve, reject) => {
      gulp.src(
        path.join(dir, '**/**'),
        { ignore },
      )
        .pipe(
          gulpZip(encodedScope ? path.join(encodedScope, projectName) : projectName)
            .on('error', reject)
        )
        .pipe(
          gulpDirCipher(password, 'encoding', { debug: true })
            .on('error', reject)
        )
        .pipe(
          gulp.dest(cwd)
            .on('error', reject)
        )
        .on('end', resolve)
        .on('error', reject);
    });
  }

  restoreProject(projectPath: string, outputDir: string, opts?: { rename?: string; }) {
    const { cwd, password } = this;

    if (!password)  {
      throw new Error('password is be invalid');
    }

    const scope = path.dirname(projectPath);
    const projectName = path.basename(projectPath);
    const encodedScope = scope.split('/').map(encodeDirname).join('/');
    const encodedProjectName = encodeDirname(projectName);
    const outputPath = path.resolve(outputDir, opts?.rename ?? projectName);

    const encodedProjectPath = path.join(
      cwd,
      encodedScope,
      encodedProjectName,
    );

    return new Promise<void>((resolve, reject) => {
      gulp.src(encodedProjectPath)
        .pipe(
          gulpDirCipher(password, 'decoding', { debug: true })
            .on('error', reject)
        )
        .pipe(
          gulpUnZip()
            .on('error', reject)
        )
        .pipe(
          gulp.dest(outputPath)
            .on('error', reject)
        )
        .on('end', resolve)
        .on('error', reject);
    });
  }

  async rmScope(scope: string) {
    const { cwd } = this;
    if ((await this.ls(scope)).length === 0) {
      throw new Error('the scope <scope> cannot be found');
    }
    const encodedScope = scope.split('/').map(encodeDirname).join('/');
    await fs.rm(
      path.join(cwd, encodedScope),
      { recursive: true },
    );
  }

  async rmProject(name: string, scope?: string) {
    const { cwd } = this;
    if (!(await this.ls(scope)).find(p => p.realName === name)) {
      throw new Error(`the project <${path.join(scope ?? '', name)}> cannot be found`);
    }
    const encodedScope = scope ? scope.split('/').map(encodeDirname).join('/') : null;
    await fs.rm(
      path.join(cwd, encodedScope ?? '', encodeDirname(name))
    );
  }
}

export default FurtiveFileSystem;

import { cac } from 'cac';

const cli = cac();

const argv = cli
  .option('input', {
    alias: 'i',
    describe: 'The input directory to compress and encrypt',
    demandOption: true,
    type: 'string',
  })
  .option('output', {
    alias: 'o',
    describe: 'The output file name',
    demandOption: true,
    type: 'string',
  })
  .option('algorithm', {
    alias: 'a',
    describe: 'The compression algorithm to use',
    choices: ['zip', 'tar', 'tar.gz', 'tar.bz2'],
    default: 'zip',
    type: 'string',
  })
  .option('password', {
    alias: 'p',
    describe: 'The password to encrypt the output file',
    type: 'string',
  })
  .option('git', {
    alias: 'g',
    describe: 'The URL of the Git repository to upload to',
    type: 'string',
  })
  .option('branch', {
    alias: 'b',
    describe: 'The Git branch to upload to',
    default: 'master',
    type: 'string',
  })
  .help()
  .argv;

const inputDir = path.resolve(argv.input);
const outputFileName = path.resolve(argv.output);
const compressionAlgorithm = argv.algorithm;
const password = argv.password;
const gitUrl = argv.git;
const gitBranch = argv.branch;

#!/usr/bin/env node

// Node.jsのモジュールをインポート
import fs from 'node:fs/promises';
import path from 'node:path';
// カスタムコンソールモジュールをインポート
import { debug, error, info } from './console.ts';
import { createAst } from './createAst.ts';
import { checkAst } from './checkAst.ts';

// configの型を定義
export type Config = {
  'call-super-in-constructor': 'error' | 'warn' | 'off';
  'use-this-in-method': 'error' | 'warn' | 'off';
};

console.log('Welcome to the Lint CLI!');

const helpMessage = 'Usage: lint-cli <file-path> [--debug]';

// コマンドの引数を取得（0番目はnodeの実行パス、1番目はスクリプトのパスなので省く）
const args = process.argv.slice(2);
// 引数が不足している場合はヘルプメッセージを表示
if (args.length === 0) {
  info(helpMessage);
  process.exit(1);
}

let [inputFilePath, ...restArgs] = args;
// コマンドの1つ目の引数に、入力ファイルパスが指定されていない場合はエラーにする
if (!inputFilePath || inputFilePath.startsWith('--')) {
  error('Input file path is required');
  info(helpMessage);
  process.exit(1);
}

// コマンドが実行されたディレクトリにconfigファイルがない場合はエラーにする
const configFilePath = path.resolve('config.json');
const isConfigFileExists = await fs.access(configFilePath).then(() => true).catch(() => false);
if (!isConfigFileExists) {
  error('Config file not found: config.json');
  process.exit(1);
}

for (let i = 0; i < restArgs.length; i++) {
  const arg = restArgs[i];

  if (arg === '--debug') {
    // --debugオプションが指定された場合、デバッグモードを有効にする
    process.env.DEBUG = 'true';
  } else {
    error(`Unknown argument: ${arg}`);
    process.exit(1);
  }
}

// 入力ファイルを読み込む
try {
  const absoluteInputPath = path.resolve(inputFilePath);
  const data = (await fs.readFile(absoluteInputPath)).toString();

  debug(`Input file path: ${absoluteInputPath}`);
  debug(`Input file content:\n${data}`);

  // configファイルを読み込む
  const config: Config = JSON.parse(
    (await fs.readFile(configFilePath)).toString()
  );
  debug(`Config file content:\n${JSON.stringify(config, null, 2)}`);

  const ast = await createAst(absoluteInputPath);

  // AST を走査して情報を出力する
  const violated = checkAst(ast, 0, config);
  if (!violated) {
    info('No issues found');
  }
} catch (err) {
  if (err instanceof Error) {
    error(err.message);
  } else {
    error('An unknown error occurred');
  }
  process.exit(1);
}

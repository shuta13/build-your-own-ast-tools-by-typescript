#!/usr/bin/env node

// Node.jsのモジュールをインポート
import fs from 'node:fs/promises';
import path from 'node:path';
// カスタムコンソールモジュールをインポート
import { debug, error, info } from './console.ts';
import { createSourceFromAst } from './createSourceFromAst.ts';

console.log('Welcome to the Generate Code CLI!');

const helpMessage =
  'Usage: basic-cli <file-path> [--out <output-path>] [--debug]';

// コマンドの引数を取得(0番目はnodeの実行パス、1番目はスクリプトのパスなので省く)
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

let outputFilePath = '';
for (let i = 0; i < restArgs.length; i++) {
  const arg = restArgs[i];

  if (arg === '--out') {
    // --outオプションが指定された場合、次の引数を出力ファイルパスとして取得する
    // 次の引数がない、または次の引数がオプション形式(--で始まる)ならエラーにする
    if (i + 1 >= args.length || restArgs[i + 1].startsWith('--')) {
      error('--out requires a file path');
      process.exit(1);
    }
    outputFilePath = restArgs[++i];
  } else if (arg === '--debug') {
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

  const ast = JSON.parse(data);
  const source = createSourceFromAst(ast);

  if (outputFilePath) {
    // 出力ファイルパスが指定されている場合、内容を逆順にしてファイルに書き込む
    const absoluteOutputPath = path.resolve(outputFilePath);
    await fs.writeFile(absoluteOutputPath, source);
    debug(`Output written to: ${absoluteOutputPath}`);
  } else {
    // 出力ファイルパスが指定されていない場合、コンソールに出力する
    info(`Source:\n${source}`);
  }
} catch (err) {
  if (err instanceof Error) {
    error(err.message);
  } else {
    error('An unknown error occurred');
  }
  process.exit(1);
}

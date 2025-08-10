# build-your-own-ast-tools-by-typescript

「TypeScriptでCLIを作って学ぶAST」のサンプルコード用リポジトリです。

各回のコードは以下のディレクトリにあります。

- 第1回: [ASTの基礎知識とTypeScriptの環境構築から始めるCLIツール開発](./001-hello-world)
- 第2回: [TypeScript×Node.jsでCLIを開発してnpmで公開する基本手順を学ぶ](./002-create-cli)
- 第3回: [ASTの解析とCLIの実装によるTypeScript製Lintツール開発](./003-analyze-ast) 
- 第4回: [ASTからソースコードをFormatするCLIを開発する](./004-generate-code) 

## 環境構築(Docker版)

本誌で案内しているasdfの他に、[Docker](https://www.docker.com)を用いた環境構築も可能です。macOS 以外を利用している方は、Dockerを用いた環境構築をお勧めします。

はじめに、このリポジトリをクローンし、プロジェクトのルートディレクトリに移動します。

```bash
git clone https://github.com/shuta13/build-your-own-ast-tools-by-typescript
cd build-your-own-ast-tools-by-typescript
```

Dockerイメージをビルドします。

```bash
docker build -t my-ast-tools .
```

ビルドしたイメージを実行します。実行時、Dockerコンテナ内のボリュームに、ルートディレクトリをマウントしています。

これで、ルートディレクトリ内の作業内容がコンテナ内に反映されます。

```bash
docker run -it --rm -v "$(pwd)":/usr/src/app my-ast-tools
```

`001-hello-world` に移動して `helloWorld.ts` を実行してみましょう。

```bash
node --experimental-default-config-file helloWorld.ts
```

`Hello, World!` と表示されれば正常に実行できています。

次に、`001-hello-world/helloWorld.ts` を以下のように変更して、同じように実行してみましょう。

```typescript
const greeting: string = "Hello, World with Docker!";

console.log(greeting);
```

`Hello, World with Docker!` と表示されれば正常に実行できています。

以上で、Dockerを用いた環境構築は完了です。お疲れ様でした！

import * as ts from 'typescript';
import { debug } from './console.ts';

export type AstNode = {
  kind: string;
  text: string;
  children: AstNode[];
};

const f = ts.factory;

export function createSourceFromAst(astNode: AstNode): string {
  const tsNode = buildTsNodeFromAst(astNode);

  if (tsNode === null) {
    return '';
  }

  const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
  if (ts.isSourceFile(tsNode)) {
    return printer.printFile(tsNode);
  }
  const source = ts.createSourceFile(
    'generated.ts',
    '',
    ts.ScriptTarget.Latest
  );
  return printer.printNode(ts.EmitHint.Unspecified, tsNode, source);
}

function buildTsNodeFromAst(astNode: AstNode, depth = 0): ts.Node | null {
  const indent = '  '.repeat(depth);
  debug(`${indent}Kind: ${astNode.kind}, Text: ${astNode.text}`);

  switch (astNode.kind) {
    // SourceFileノードを生成します
    case 'SourceFile': {
      const statements: ts.Statement[] = [];

      for (const child of astNode.children) {
        if (child.kind === 'FirstStatement') {
          // FirstStatement が複数ある場合、すべての子ノードを処理します
          const inner = child.children
            .map((c) => buildTsNodeFromAst(c, depth + 2))
            .filter((n): n is ts.Statement => n !== null);
          statements.push(...inner);
        } else {
          // それ以外の子ノードは個別に処理します
          const node = buildTsNodeFromAst(child, depth + 1);
          if (node && ts.isStatement(node)) {
            statements.push(node);
          }
        }
      }

      return f.createSourceFile(
        statements,
        f.createToken(ts.SyntaxKind.EndOfFileToken),
        ts.NodeFlags.None
      );
    }

    // 変数宣言のリストからVariableStatementノードを生成します
    case 'VariableDeclarationList': {
      const varDeclaration = astNode.children
        .map((child) => buildTsNodeFromAst(child, depth + 1))
        .filter((node): node is ts.VariableDeclaration => node !== null);
      const varDeclarationList = f.createVariableDeclarationList(
        varDeclaration,
        ts.NodeFlags.Const
      );
      return f.createVariableStatement(undefined, varDeclarationList);
    }

    // 変数宣言の場合、VariableDeclarationノードを生成します
    case 'VariableDeclaration': {
      const [identifierNode, typeNode, initializerNode] = astNode.children;
      return f.createVariableDeclaration(
        identifierNode.text,
        undefined,
        toTsTypeNode(typeNode),
        toTsPremitiveNode(initializerNode)
      );
    }

    // 識別子の場合、Identifierノードを生成します
    case 'Identifier':
      return f.createIdentifier(astNode.text);

    // 型の場合、TypeNodeノードを生成します
    case 'StringKeyword':
      return toTsTypeNode(astNode);

    // Premitiveな値の場合、Literalノードを生成します
    case 'StringLiteral':
      return toTsPremitiveNode(astNode);

    // ファイルの末尾の改行またはサポートされていないノードの場合、nullを返します
    case 'EndOfFileToken':
    default:
      return null;
  }
}

function toTsTypeNode(node: AstNode): ts.TypeNode {
  switch (node.kind) {
    case 'StringKeyword':
      return f.createKeywordTypeNode(ts.SyntaxKind.StringKeyword);
    default:
      throw new Error(`Unsupported type: ${node.kind}`);
  }
}

function toTsPremitiveNode(node: AstNode): ts.Expression {
  switch (node.kind) {
    case 'StringLiteral':
      // 両端のクォートを除去して生成します
      return f.createStringLiteral(node.text.slice(1, -1));
    default:
      throw new Error(`Unsupported literal: ${node.kind}`);
  }
}

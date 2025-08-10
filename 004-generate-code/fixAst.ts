import type { AstNode } from './createAst.ts';
import type { Config } from './formatterCli.ts';
import { debug, info } from './console.ts';

export function fixAst(astNode: AstNode, depth = 0, config: Config, root: AstNode): AstNode {
  const indent = '  '.repeat(depth);
  debug(
    `${indent}Kind: ${astNode.kind}, Text: ${astNode.text.replaceAll('\n', ' ')}`
  );

  // configのuse-let-never-reassignedが有効な場合、ルールを適用してASTを修正します
  if (config['use-let-never-reassigned'] !== 'off') {
    const letHead = /^(\s*)let\b/;

    if (
      astNode.kind === 'VariableDeclarationList' &&
      letHead.test(astNode.text)
    ) {
      // 宣言に含まれる識別子名を抽出します
      const identifiers = astNode.children
        .filter((c) => c.kind === 'VariableDeclaration')
        .map(
          (v) =>
            v.children.find((n) => n.kind === 'Identifier')?.text || '__dummy__'
        );

      // 後続で再代入が無ければ const に置換します
      if (isNeverReassigned(root, astNode, identifiers)) {
        astNode.text = astNode.text.replace(letHead, '$1const');
        info('[use-let-never-reassigned] letをconstに置換しました');
      }
    }
  }


  // configのdouble-quotesが有効な場合、ルールを適用してASTを修正します
  if (config['double-quotes'] !== 'off') {
    if (astNode.kind === 'StringLiteral') {
      const text = astNode.text.trim();
      if (text.startsWith('"') && text.endsWith('"')) {
        // 本体を取り出し、シングルクォートをエスケープします
        const inner = text.slice(1, -1).replace(/'/g, "\\'");
        astNode.text = `'${inner}'`;

        info('[double-quotes] ダブルクオートをシングルクオートに修正しました');
      }
    }
  }


  for (const child of astNode.children) {
    // 子ノードを再帰的に修正します
    fixAst(child, depth + 1, config, root);
  }

  return astNode;
}

/**
 * let → const に変換して良いか判定するユーティリティ関数です
 */
function isNeverReassigned(
  root: AstNode,
  declNode: AstNode,
  identifiers: string[]
): boolean {
  /** 変数宣言ノード自身は検索対象から除外したいので引数で受け取り比較します */
  const walk = (node: AstNode): boolean => {
    if (node === declNode) return false; // 宣言部分は無視します

    // `Identifier = ...` という BinaryExpression があれば再代入とみなします
    if (
      node.kind === 'BinaryExpression' &&
      node.children.length >= 1 &&
      node.children[0].kind === 'Identifier' &&
      identifiers.includes(node.children[0].text)
    ) {
      return true;
    }

    return node.children.some(walk);
  };

  return !walk(root);
}

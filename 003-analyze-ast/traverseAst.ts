import type { AstNode } from './createAst.ts';

export function traverseAst(astNode: AstNode, depth = 0) {
  const indent = '  '.repeat(depth);
  console.log(
    `${indent}Kind: ${astNode.kind}, Text: ${astNode.text.replaceAll('\n', ' ').slice(0, 20)}`
  );

  for (const child of astNode.children) {
    traverseAst(child, depth + 1);
  }
}

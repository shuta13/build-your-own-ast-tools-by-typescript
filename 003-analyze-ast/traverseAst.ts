import type { AstNode } from './createAst.ts';
import type { Config } from './lintCli.ts';
import { debug, error, info, warn } from './console.ts';

export function traverseAst(astNode: AstNode, depth = 0, config: Config) {
  const indent = '  '.repeat(depth);
  debug(
    `${indent}Kind: ${astNode.kind}, Text: ${astNode.text.replaceAll('\n', ' ').slice(0, 20)}`
  );

  // configのcall-super-in-constructorが有効な場合、ルールを適用してASTを検査する
  if (
    config['call-super-in-constructor'] !== 'off' &&
    astNode.kind === 'ClassDeclaration' &&
    // extendsキーワードが存在する場合、親クラスがあると判断する
    astNode.children.some((child) => child.kind === 'HeritageClause')
  ) {
    // ClassDeclarationのASTノードの中からConstructorのASTノードを探す
    const constructor = astNode.children.find(
      (child) => child.kind === 'Constructor'
    );
    if (!constructor) return;

    // ConstructorのASTノードの中からBlockのASTノードを探す
    const block = constructor.children.find((child) => child.kind === 'Block');
    if (!block) return;

    // BlockのASTノードの中からExpressionStatementのASTノードを探す
    const expressionStatement = block.children.find(
      (child) => child.kind === 'ExpressionStatement'
    );
    if (!expressionStatement) return;

    // ExpressionStatementのASTノードの中からCallExpressionのASTノードを探す
    const callExpression = expressionStatement.children.find(
      (child) => child.kind === 'CallExpression'
    );
    // CallExpressionのASTノードが見つからない場合は、super()が呼び出されていないと判断する
    // また、CallExpressionのtextに'super'が含まれていない場合も同様にする
    if (!callExpression || !callExpression.text.includes('super')) {
      const message = 'Constructor should call super() but does not.';
      if (config['call-super-in-constructor'] === 'error') {
        error(message);
      }
      if (config['call-super-in-constructor'] === 'warn') {
        warn(message);
      }
    } else {
      info('No issues found with `call-super-in-constructor` rule.');
    }
  }

  for (const child of astNode.children) {
    traverseAst(child, depth + 1, config);
  }
}

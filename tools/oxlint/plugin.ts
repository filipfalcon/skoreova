import * as Effect from 'effect/Effect';
import { Comment, Diagnostic, Plugin, Rule, RuleContext, SourceCode, Visitor } from 'effect-oxlint';
import type { ESTree } from 'effect-oxlint';

/**
 * Reports an exported declaration that carries no TSDoc block.
 *
 * The convention's one purely syntactic requirement, and the only one the stock rule sets leave to
 * review: oxlint ships no `require-jsdoc`. Re-exports are skipped — the block belongs with the
 * declaration, and a barrel that repeats it creates a second copy to drift.
 */
const requireExportDoc = Rule.define({
  name: 'require-export-doc',
  meta: Rule.meta({
    type: 'suggestion',
    description: 'Every export carries a TSDoc block.',
  }),
  create: function* () {
    const ctx = yield* RuleContext;
    // The carve-out is decided by the filename, while the rule is switched on by
    // directory; without this a fixture exported from a test beside its subject
    // would be reported for a block the convention forbids it to carry.
    const inTest = ctx.filename.includes('.test.');

    const check = (node: ESTree.Node): Effect.Effect<void, never, RuleContext> =>
      Effect.gen(function* () {
        const comments = yield* SourceCode.getCommentsBefore(node);
        if (comments.some(Comment.isJSDoc)) return;
        yield* ctx.report(
          Diagnostic.make({
            node,
            message: 'Every export carries a TSDoc block.',
          }),
        );
      });

    // Visitor.on, not a hand-built object: oxlint's `Visitor` carries a string
    // index signature, so `keyof Visitor` collapses to `string` and every key of
    // the mapped TypedEffectVisitor resolves its handler to the WIDE ESTree.Node.
    // A literal whose handlers name the node they actually receive is then
    // rejected — the narrowing has to come from `on`, which resolves the key
    // through VisitorNodeType before building the map.
    return Visitor.merge(
      Visitor.on('ExportNamedDeclaration', (node) =>
        inTest || node.declaration === null || node.declaration === undefined
          ? Effect.void
          : check(node),
      ),
      Visitor.on('ExportDefaultDeclaration', (node) => (inTest ? Effect.void : check(node))),
    );
  },
});

/**
 * The repository's own lint rules.
 *
 * Named `skoreova` because `jsdoc` is reserved for the plugin oxlint implements natively.
 */
export default Plugin.define({
  name: 'skoreova',
  specifier: './tools/oxlint/plugin.ts',
  rules: {
    'require-export-doc': requireExportDoc,
  },
});

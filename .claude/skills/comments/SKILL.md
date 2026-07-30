---
name: comments
description: The convention governing code comments and TSDoc blocks in this repository. Use it when writing, rewriting, shortening, or deleting any comment or doc block; when adding an export, since every export carries one; when the user calls a comment too long, too obvious, too explicit, or asks whether something needs a comment at all; when a refactor moves, splits, renames, or merges code that carries commentary; when asked to audit, sweep, review, or check the comments in a file or directory; when a comment's claim about paths, names, ordering, or "only X does Y" needs verifying rather than trusting; before declaring a file or module finished, since a comment stranded from its subject is the most common defect here; and when asked how comments work in this codebase, or which form applies where. Not for README files, the docs site, or commit messages.
---

## Principle

A comment carries what the code cannot: the constraint, the regulation, the protocol, or the measurement that produced this shape. Nothing checks whether one is true, so write only what a reader cannot recover from the code, and only in terms that stay true when the code around them moves.

## Scope and boundary

Two questions get argued repeatedly: which files the convention covers, and what in them must carry a comment. Both are settled here, before any question of how to write one.

### Files

TypeScript sources — all of them, including tests and config files.

### The requirement

Every export carries a TSDoc block, including those whose names already say everything, where the block will be one sentence that echoes the name. The carve-outs below are settled the same way — by looking at the file, not by judging who reads it.

### Where it stops

- **Non-exported declarations** take no TSDoc, ambient members aside. Their audience is the file they sit in, which is what `//` is for.
- **Re-exports** — `export * from`, `export { x } from` — carry nothing. The block belongs with the declaration.
- **Statements** take `//` or nothing, never TSDoc.
- **Files** take no header in either form. A contract spanning the file goes on the export that establishes it — the function that sets the order, the constant that fixes the format — never copied onto each export that depends on it. Where no export establishes it, it belongs in the commit message or in the project's own records.

### Exceptions

- **Ambient members** — `declare global` properties — take a TSDoc block despite not being exports.
- **Tests** (a `.test.` segment in the filename) are outside the requirement, including one that exports a fixture. The `//` rules apply in full.
- **Config files** are outside the requirement. The `//` rules apply, and these files often carry the heaviest rationale in a project.

## Deciding whether to write

The decision differs by form: on an export it is already made, on a statement it is yours every time.

### On an export

Already decided — scope requires a block. The only open question is whether anything follows the summary, and that is answered in content rules: a second paragraph exists to carry a constraint the code cannot show, or it does not exist.

### On a statement

The default is nothing. Four questions, in order; the first "no" ends it.

1. **Can the reader recover this from the code in front of them?** If yes, write nothing. This eliminates most candidates.
2. **Can you name what they would lose?** Not "context" — the specific thing: a regulation, a protocol detail, a measured number, an ordering guarantee, an outside limit that ruled out the obvious approach. If you cannot name which, you do not have a comment yet.
3. **Will it still be true in a year with nobody maintaining it?** A fact about a law, a protocol, or a measurement will be. A claim about the code next to it will not.
4. **Is it already stated on the declaration above?** If so, the local copy is a second version that will disagree with the first.

### Before writing either

**If the comment exists to excuse the code, change the code.** A comment cannot fix a name that misleads or a function doing three things, and writing one converts a fixable defect into a permanent one.

**If the guarantee can be enforced, enforce it.** A test, a type, or a lint rule fails when someone breaks the invariant; a paragraph asking them not to does not. Where enforcement exists, the comment shrinks to stating what the invariant is, and stops arguing for it.

## Forms

Two shapes, and the choice between them is settled by what the comment sits on, not by how much there is to say.

### TSDoc block

`/** */`, on declarations. It is the only form that reaches a use site on hover and the only one a documentation generator can read, which is what makes it worth its space — and why it is reserved for things other code can refer to.

Blocks stay multi-line even when they would fit on one. A collapsed block turns every later edit into a rewrite of the whole line, which costs more in review than the two lines it saves.

### Line comment

`//`, on statements, on **one line however long**. The formatter reflows a block's prose to fit the print width; it does not touch line-comment breaks. A wrapped `//` therefore has to be rewrapped by hand after every edit that shifts it, and nothing reports it when someone doesn't. One long line has no such failure mode.

The line-scoped diff that keeps blocks expanded argues the other way here, and loses. It is the same trade decided by who owns the breaks: in a block the formatter owns them, so more lines cost nothing to keep; in a line comment you own them, and every one is a line to maintain by hand.

### Placement

Directly above the subject, with no blank line between them. A comment separated from what it explains is the first step toward being stranded from it entirely.

Never trailing on the same line as code. A trailing comment is pushed around by every reformat of the line it shares, and it is the first thing lost when that line is edited.

### Inside a block

Prose in paragraphs, separated by a blank `*` line. Write it as prose and let the formatter wrap it — hand-broken lines are re-joined anyway, so the breaks are effort that does not survive.

No examples. An example is a claim about behavior that nothing compiles, and it is the highest-rot construct available — rename an export and every example still names the old one, with nothing reporting it. The call sites are the examples: compiled, current, in context, and one reference lookup away. Inline code spans naming an identifier or a value are prose, and stay.

The before-and-after pairs in this document are not the same construct. They record edits that already happened, and a past event cannot stop being true; an example inside a block asserts that the current API behaves that way, which is a live claim nothing checks.

## Content rules

Scope settles that a block exists; this settles what goes in it. The pressure runs one way: a block that must exist invites filling, and every rule below is there to resist that.

### Language

American English, in both forms — _behavior_, _normalize_, _canceled_. Identifiers keep whatever spelling the code or the vendor gave them, and proper nouns keep their own; a comment naming a `colour` property spells it the way the property is spelled.

### Ordering

Summary first, always: one sentence naming what the thing is or is for. Then rationale, if there is any. Then tags, last.

Within a sentence, subject before constraint: "The queue takes only arguments objects, because the consumer branches on the runtime shape of each entry" rather than "Because the consumer branches on the runtime shape of each entry, the queue takes only arguments objects." Opening with the reason leaves the reader holding it with nothing to attach it to.

### What earns more than a summary

A second paragraph earns its place when it carries a constraint the code cannot show — a regulation, a protocol detail, a measurement, an ordering guarantee, or an outside limit that ruled out the obvious shape. Nothing else does.

It is a paragraph, not a labeled section. A heading announcing that rationale follows is one more thing to write, to keep accurate, and to feel obliged to fill; the paragraph break already says everything the label would.

Most blocks are a summary line and nothing more. That is the expected shape, not a sign of an unfinished one.

### Tag policy

`@param` for every parameter, on every block that documents a function. The signature settles it, and no parameter is exempt for being self-evident — deciding which ones are costs a judgment call at every one of them. The tag describes the value's role, never its type: the signature owns the type, and where that role is already evident from the name, a short restatement is the accepted cost.

- **`@returns`** — omit. The summary and the return type already state it, and where a generator runs it builds the returns section from the type regardless.
- **Types and defaults** are never repeated in a tag. No `{braces}`, no `[name=default]`: both create a second source of truth that nothing checks against the first, while the signature holds the one that is checked.
- **No other tags.** Each one is a claim nothing verifies, and the tempting ones duplicate a record that already exists elsewhere — version history in the repository, grouping in the file layout.

## Prohibitions

A fixed list. The one exception noted below is not an entry but a boundary, drawn where this list and the Files rule met. Each entry is here because it cost a real edit — a comment that had to be rewritten or deleted, not a style someone dislikes. Nothing joins the list without that provenance, or it stops being a list of defects and becomes a list of preferences.

- **Mechanics of the language or type system.** "Arrows have no `arguments`", "a zero-parameter function is assignable to a rest-parameter type". A competent reader knows, and it ages badly as the language moves.
- **A restatement of the name, past the summary.** The summary may echo the name — that is the cost of a mandatory block. A rationale paragraph that echoes it at greater length is padding wearing the shape of content.
- **The architectural decision.** Why a thing was split rather than merged, injected rather than declared, tested rather than typed. That belongs in the commit message: it is a preference about structure, and someone who organizes it differently gets code that still works. A constraint from outside the code is not this — violate one of those and the code is wrong, not merely different — and it stays on the declaration.
- **Imperatives.** "Must be set before…" becomes "…is set before the first request fires." Describe the property; instructing the reader dates the comment to the moment someone got it wrong.
- **Provenance.** "Verified against the shipped source", "confirmed by testing". It is a boast, it rots the first time someone doubts it, and it invites trusting the comment instead of checking. A measurement is not an exception: give the number and what it measures, never the act of measuring. If a reader cannot repeat it from what you wrote, what is missing is the subject, not the provenance.
- **Vendor names where a role works.** "The consumer" outlives the vendor's name, and reads as a property of the design rather than a note about a third party. Keep the literal name only where it is the identifier under discussion.
- **Positions and counts.** "The two below", "LAST", "the block above". These break silently when a line moves and nothing checks them. State the property instead — what makes the ordering true, not where the code currently sits.
- **Claims about neighboring code.** "Matches what the banner promises", "same list as the router uses". The moment that other code changes, the comment is false and nothing fails. Cite the thing both of them derive from — the regulation, the protocol, the measurement — or say nothing.

  One exception, and it is the one the Files rule relies on: a contract the export itself establishes. There the dependency runs the other way, so a change that would falsify the comment has to pass through the code the comment sits on, where it is visible.

- **Markers and asides.** TODOs, FIXMEs, review notes, questions to a future reader. A tracker holds work; a comment holds why the code is the way it is.

## Worked examples

Every pair below is a real edit. Where a side was a deletion, or too long to quote whole, it is described rather than shown.

**Vendor name → role.**

- Before: `gtag.js drops arrays, so we push the arguments object instead.`
- After: `Arrays take the consumer's legacy branch and get dropped.`

The fact survives a change of vendor, and reads as a property of the design rather than a note about a third party.

**Mechanism → nothing.**

- Before: `// Preserve an existing queue if one is already there.`
- After: deleted. The line was `(window.dataLayer ??= [])`, which says exactly that.

**Position → property.**

- Before: `// LAST, so everything above is queued first.`
- After: `// Fetching is asynchronous, so later emissions are queued well before the consumer reads them.`

The first breaks silently when a line moves. The second states why the ordering holds, which no edit can invalidate without also breaking the code.

**Stranded by a refactor.**

- Before: `a cache would have to be invalidated on changes to consent.ts AND analytics.ts`
- After: `a cache would have to be invalidated on changes to any module the inlined entry reaches`

Both files had been split into a directory before anyone noticed, and nothing failed when they moved. The replacement names the property the cache depends on rather than the files it happens to reach today, so no later move can strand it.

**Trailing clause that explained the type system.**

- Before: `…and callee is the single property enforcing that — widening this element type to accept anything else removes the guarantee.`
- After: `…and callee is the single property enforcing that.`

The reader considering a wider type already has the fact. Spelling out the inference is mechanics.

**A `@returns` tag.**

- Before: `@returns Those values as an arguments object`
- After: removed.

The type states what comes back, the summary states what it means, and a tag has nothing left to say. That holds for every function, which is why the rule is unconditional rather than a judgment about whether a particular tag duplicates.

**Described → enforced.**

- Before: a block asserting that a call is pushed "verbatim", with nothing checking it.
- After: the same summary, plus a test asserting the shape of what actually lands.

The comment states what the invariant is; the test is what fails when someone breaks it.

## Auditing

An audit is not a prose review. It looks for what has quietly stopped holding: a comment that is no longer true, a shape the convention does not allow.

Two passes, divided by who does the checking.

### What the linter reports

Run it and read what it reports. It checks form, and which rules it runs is a question for the lint config — the only place that stays current, and the reason this section does not list them.

What it cannot do is weigh a claim: whether a comment is true, whether it earns its place, whether it belongs somewhere else entirely.

### What you read yourself

Work through the file in order. For each comment:

1. **Check its shape against Scope, Forms and Content rules.** Whether a block may collapse, whether a statement may carry one, whether a re-export or a file has picked one up, whether a tag appears that the policy does not write — among others. Whatever the linter did not report is yours to read for, and how much that is depends on the config.
2. **Read what it claims**, separately from what the code does. If it is more than one fact, write them down separately — mixed claims hide the false one.
3. **Verify every claim that can be checked.** Paths, symbol names, ordering, counts, "only X does Y", references to other files. Read the code; do not reason from the comment's plausibility. Most rot is a path or a name that moved in a refactor, and it always reads fine. These are the categories the prohibitions ban outright, so an audit meets them only in inherited text — verify first anyway, because a false one is a defect to correct now, while a true one is a rewrite that the prohibitions will call for.
4. **Check it against the prohibitions.** A comment can be entirely true and still belong in the commit message.
5. **Check it is still attached to its subject.** A comment describing code that now lives elsewhere, or sitting above the statement that replaced the one it explained, is a defect even when every word is accurate.
6. **Decide: keep, rewrite, or delete.** Deleting is a normal outcome, and the most common one. A file with fewer load-bearing comments is better than one with a comment per statement.

### Output

Report findings; do not rewrite in place unless asked. The list is the deliverable, because the decision to delete someone's comment is theirs.

Group by severity: claims that are now false or stranded from their subject first, then breaches of scope or form, then prohibited categories, then style. Scope outranks craft here for the same reason it is settled first — a comment in the wrong place is not improved by being well written. For each, quote the comment, state what is wrong with it, and propose the replacement, or propose deletion and say what is lost.

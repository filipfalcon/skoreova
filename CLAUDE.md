# Skóreová — project conventions

## Commentary: the house deviation

This codebase deliberately deviates from the generic "no inline comments" rule: dense inline **design-rationale commentary is house style and binds here**. The comments record _why_ — measured values, device-specific workarounds (WebKit rasterization, iOS observer quirks), rejected alternatives, and explicit user design calls ("user call", "user pick") that exist nowhere else. They are load-bearing documentation for a hand-tuned visual product; audits should not flag their density, and refactors must move them with the code they explain. What stays banned: comments that narrate _what_ the next line does, TODO markers, and PR-reviewer asides.

## Styling a state: read the emitted attributes first

Four separate blockers in this repo were the same mistake — a state styled through a selector that never matches. Before writing a variant for a state, check what the markup actually carries:

- **`disabled:` needs the native attribute.** `@foldkit/ui`'s `Button` never emits it; `isDisabled` produces `aria-disabled="true"`, `data-disabled=""` and `tabindex="0"`. Style the blocked look off `data-disabled:` or off a second class string, never `disabled:`.
- **`outline-none` sets `--tw-outline-style: none`,** which defeats a later `outline-2` on the same element. Focus rings need `outline-solid` at the same variant.
- **Utilities emit in Tailwind's order, not the order you concatenate them.** Overlaying `cursor-not-allowed bg-neutral-400` on a string that already has `cursor-pointer bg-neutral-900` loses. Express mutually exclusive looks as two DISJOINT strings the caller picks between (`drawerSaveStyle`/`drawerSaveInertStyle` is the pattern).
- **Reduced motion is one universal `!important` block,** not a list of selectors. An animation whose last keyframe isn't its resting position opts out by name with `animation-name: none`.

Assert the class, not the look — a Scene test can reach `toHaveClass`, and the class is what has broken every time.

## Everything else

Follow the Foldkit canon (Elm-style Model/update/view, Commands/Subscriptions/Mounts, `evo`, `Option`, keyed lists, Story/Scene tests). Verify per app with `bunx tsgo --build tsconfig.json --emitDeclarationOnly`, `bunx vp lint`, `bunx vp fmt`, `bunx vite build`, `bunx vp test run`.

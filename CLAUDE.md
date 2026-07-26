# Skóreová — project conventions

## Commentary: the house deviation

This codebase deliberately deviates from the generic "no inline comments" rule: dense inline **design-rationale commentary is house style and binds here**. The comments record _why_ — measured values, device-specific workarounds (WebKit rasterization, iOS observer quirks), rejected alternatives, and explicit user design calls ("user call", "user pick") that exist nowhere else. They are load-bearing documentation for a hand-tuned visual product; audits should not flag their density, and refactors must move them with the code they explain. What stays banned: comments that narrate _what_ the next line does, TODO markers, and PR-reviewer asides.

## Styling a state: the CSS you wrote may never take effect

Five separate blockers in this repo shared one shape — CSS that is present, plausible, and inert. It fails by three distinct routes, and knowing which one you are risking is the point:

**The selector never matches.**

- **`disabled:` needs the native attribute.** `@foldkit/ui`'s `Button` never emits it; `isDisabled` produces `aria-disabled="true"`, `data-disabled=""` and `tabindex="0"`. Style the blocked look off `data-disabled:` or off a second class string, never `disabled:`.
- **Reduced motion is one universal `!important` block,** not a list of selectors. An animation whose last keyframe isn't its resting position opts out by name with `animation-name: none`.

**A sibling utility defeats the declaration.**

- **`outline-none` sets `--tw-outline-style: none`,** which defeats a later `outline-2` on the same element — both classes are on the element and no ring renders. Focus rings need `outline-solid` at the same variant.

**It loses the cascade at equal specificity.**

- **Utilities emit in Tailwind's order, not the order you concatenate them.** Overlaying `cursor-not-allowed bg-neutral-400` on a string that already has `cursor-pointer bg-neutral-900` loses. Express mutually exclusive looks as two DISJOINT strings the caller picks between (`drawerSaveStyle`/`drawerSaveInertStyle` is the pattern).

Where the two looks are disjoint strings, assert the class — a Scene test can reach `toHaveClass`, and picking the wrong string is what has broken every time. Where they are not, a class assertion proves nothing: with `outline-none outline-2` both classes are present, and reduced motion involves no class at all. Those want a compiled-CSS check or a measured value in the commentary.

And the look itself has to be checked against its own reason: the disjoint rewrite of the blocked buttons landed `text-neutral-400`, 2.58:1 on white, in a change whose stated purpose was escaping a ratio under 3:1. Measure the contrast, and record the number where the class is written.

## Everything else

Follow the Foldkit canon (Elm-style Model/update/view, Commands/Subscriptions/Mounts, `evo`, `Option`, keyed lists, Story/Scene tests).

Verify from the repo root with `bunx vp lint`, `bunx vp fmt`, `bunx vp test run`, plus `bunx vite build` per app. There is no separate typecheck step and no task runner: `vp lint` runs `typeAware` + `typeCheck`, so it reports TypeScript's own diagnostics from the same program it lints with.

Two rules that follow from that. Tests import Vitest as `vite-plus/test` (and `vite-plus/test/browser`) — never bare `vitest`, which is not installed; Vite+ re-exports it. And every source file must belong to a tsconfig project, or the linter types it without one and invents errors: `src/**/*.ts` per app, `alchemy.run.ts` via `tsconfig.tools.json`.

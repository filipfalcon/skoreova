# Skóreová — project conventions

## Commentary: the house deviation

This codebase deliberately deviates from the generic "no inline comments" rule: dense inline **design-rationale commentary is house style and binds here**. The comments record _why_ — measured values, device-specific workarounds (WebKit rasterization, iOS observer quirks), rejected alternatives, and explicit user design calls ("user call", "user pick") that exist nowhere else. They are load-bearing documentation for a hand-tuned visual product; audits should not flag their density, and refactors must move them with the code they explain. What stays banned: comments that narrate _what_ the next line does, TODO markers, and PR-reviewer asides.

## Everything else

Follow the Foldkit canon (Elm-style Model/update/view, Commands/Subscriptions/Mounts, `evo`, `Option`, keyed lists, Story/Scene tests). Verify per app with `bunx tsgo --build tsconfig.json --emitDeclarationOnly`, `bunx vp lint`, `bunx vp fmt`, `bunx vite build`, `bunx vp test run`.

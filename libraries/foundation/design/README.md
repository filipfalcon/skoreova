# @skoreova/design

The one design language both apps draw from: StyleX tokens and styles, consumed by the landing page and the platform.

## Scale

`src/scale.stylex.ts` holds the scale's axioms, the math that derives every token from them, and the StyleX vars, imported as `@skoreova/design/scale.stylex`. `src/scale.test.ts` recomputes every token from the axioms, so the vars cannot drift from the math.

**Method.** [Utopia](https://utopia.fyi): a fluid value interpolates linearly between its size at the narrowest and the widest viewport, clamped at both ends, written in `rem` + `vw` so browser zoom scales it (WCAG 1.4.4):

```
slope     = (maxPx − minPx) / (maxVw − minVw)
intercept = minPx − slope × minVw
value     = clamp(minPx/16 rem, intercept/16 rem + slope×100 vw, maxPx/16 rem)
```

Every length is in `rem`, rounded to four decimals. No type step grows more than 2.5× from its minimum to its maximum: Utopia's rule of thumb for text passing 200% zoom under WCAG 1.4.4, not a ratio WCAG itself states.

**Sources, in order.** Utopia first. WCAG where it does not break Utopia's math. Material 3 for what neither defines. Bringhurst for the measure.

**Axioms.** The only hand-chosen numbers:

| Axiom              | Value         | Source                                                                                                            |
| ------------------ | ------------- | ----------------------------------------------------------------------------------------------------------------- |
| Viewport           | 320 → 1280 px | WCAG 1.4.10 Reflow; 1280 = 4 × 320                                                                                |
| Step 0 (body text) | 16 → 20 px    | browser default and M3 Body Large; Utopia's default maximum. 20 ÷ 5/4 = 16, so phone body text is desktop step −1 |
| Type ratio         | 6/5 → 5/4     | Utopia's defaults: minor third → major third                                                                      |
| Body line height   | 1.5           | WCAG 1.4.8; M3 Body Large 16/24                                                                                   |
| Measure            | 66ch          | Bringhurst's ideal; within WCAG 1.4.8's 80-character limit                                                        |
| Header height      | 4rem, fixed   | M3 top app bar, 64dp                                                                                              |
| Touch target       | 3rem, fixed   | M3 48dp; above WCAG 2.5.5's 44px                                                                                  |
| Icon               | 1.5rem, fixed | M3 icon, 24dp; Utopia and WCAG define none                                                                        |

**Derived.**

- Type steps −2 to +5: step 0 × ratio^n at each end. Between the ends each step interpolates linearly between its own two end values (Utopia's method), not step 0 × an interpolated ratio^n.
- Line height: one token per type step, the step plus space `2xs`. The rule is ours: it gives step 0 exactly 1.5 (WCAG 1.4.8) and resembles M3's display and headline styles (size + 7–8dp), while M3's smaller styles use +4–6dp. Not one inherited `calc(1em + 2xs)`: a length line height inherits as its computed px value, so a child at another step would take its parent's.
- Space: Utopia's multipliers of step 0 and its one-up pairs, plus `s-l`.
- Grid: Utopia's defaults, twelve columns, gutter and gap `s-l`, container 80rem including the gutters.
- Header block padding: (header height − touch target) / 2 = (4rem − 3rem) / 2 = 0.5rem, fixed like both axioms it comes from. Not space `2xs`, which is fluid and equals 8px only at 320.
- The header height's var keeps a literal name, `--layout-header-height`, so stylesheets outside StyleX (anchored sections' scroll margin, the cookie banner) read it with `var()`.

**Data tables.** A row pads its block by space `xs`, so a row of step 0 text, its line height plus two `xs`, equals space `xl` exactly: 3 × step 0, 48 → 60 px. Height comes from padding (or a minimum height), never a fixed height, so a row grows with its content.

**Grid on narrow screens.** Blocks span multiples of three columns: twelve is four groups of three, Material 3's compact grid. Tables do not use the page grid.

## Font

Archivo is the language's plain typeface, self-hosted under the SIL Open Font License (`src/font/archivo-OFL.txt`). The files are Google Fonts' own, committed as served: one variable WOFF2 per subset, `src/font/archivo-latin.woff2` and `src/font/archivo-latin-ext.woff2`, each over the full axes (width 62–125%, weight 100–900). Nothing loads from Google at run time. `@skoreova/design/font.css` is their `@font-face` sheet; `src/font.stylex.ts` holds the tokens, and `src/font.test.ts` checks the sheet and the tokens against the files.

- One face per subset, with Google's `unicode-range`: the browser fetches a subset's file only when the page draws a character in its range. The faces declare only the range the language uses, weight 400–700 and width 75–100%, and swap in.
- Fallback faces stand in until Archivo arrives, each a system face scaled so a line sets as long as Archivo's, with Archivo's ascent, descent and line gap, so the swap does not reflow a line. The body cut's is Arial (or Liberation Sans), scaled to the body cut's average advance. The display cut's, in its own family, are a condensed bold system face where one is installed (Helvetica Neue Condensed Bold, then Arial Narrow Bold), then Arial Bold (or Liberation Sans Bold), each scaled to the display cut's average capital advance; the caps tracking is a share of the type size, which `size-adjust` leaves alone. `font-size-adjust` is not used anywhere: matching the fallback's x-height instead would widen fallback text and reflow lines on the swap.
- `@skoreova/design/archivo` opens the files with `fontkit` at a cut, for tests that measure type, fallbacks and rows. fontkit varies a WOFF2 file's advances but not its outlines, so a varied outline is measured in the browser.

**The brand face.** Anton, under the SIL Open Font License (`src/font/anton-OFL.txt`), is the brand face, set in the hero's monumental headline alone: Material 3 gives the brand role a typeface of its own beside the plain one. Archivo's narrowest, heaviest cut (62.5%, 900) still sets capitals 24% shorter than Anton's at the same line width. Its files are Google Fonts' own, one static Regular WOFF2 per subset with the same `unicode-range` as Archivo's, in `@skoreova/design/brand-font.css`, never preloaded. Its fallbacks are Impact, then Arial Narrow Bold, then Arial Bold, each scaled to Anton's average capital advance with Anton's vertical metrics; `@skoreova/design/anton` opens the files for the tests.

**Refreshing the files.** `scripts/fetch-google-font.ts` re-fetches a family's latin and latin-ext WOFF2 files from the Google Fonts CSS2 API on demand (`node scripts/fetch-google-font.ts anton`, or `archivo`; `--dry-run` reports without writing). The committed files are the source of truth; nothing fetches at build or run time.

**Tokens.**

| Token         | Value                                       | Source                                                                                                                                                                                                                                                 |
| ------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Family        | `'Archivo', 'Archivo Fallback', sans-serif` | the plain typeface, then its metric-matched fallback; the display cut sets in `display-family`, Archivo then its own fallbacks; the brand face in `brand-family`, Anton at weight 400, then its own                                                    |
| Body cut      | width 100%, weight 400                      | Archivo's Normal width and Regular weight                                                                                                                                                                                                              |
| Bold          | 700                                         | CSS bold; WCAG 1.4.3's bold for large-scale text                                                                                                                                                                                                       |
| Display cut   | width 75%, weight 700                       | OpenType/CSS Condensed and Bold                                                                                                                                                                                                                        |
| Caps tracking | 0.05em                                      | capitals letterspaced 5–10% of the type size (Bringhurst), the lower bound; mixed case is not tracked                                                                                                                                                  |
| Data numerals | `tabular-nums`                              | scores, tables and times align in columns                                                                                                                                                                                                              |
| Cap height    | 0.686                                       | Archivo's OS/2 cap height, 686 of 1000 units, held by both cuts, as a share of the type size: a mark beside capitals (an arrow, an icon) stands 0.686em tall on the baseline, and type whose capitals must stand a given height is that height ÷ 0.686 |

## Color

`src/color.stylex.ts` holds the color roles, the brand colors, the focus ring and the chrome; `src/color.test.ts` recomputes every role with Material 3's color utilities and asserts the contrast rules.

**Method.** Material 3's dynamic color: dark scheme, variant Fidelity, spec 2021, contrast level 0. Two sources: primary `#ff2f8e`, neutral `#f3efe8` (the neutral palette takes its hue and chroma, the neutral-variant palette the same hue at chroma + 4, Material 3's own rule). No secondary or tertiary roles.

**Contrast.** `on-surface` and `on-surface-variant` read at 4.5:1 or more on the surface and every surface container; `on-primary-container` at 4.5:1 or more on `primary-container`; `outline` at 3:1 or more on the surface (WCAG 1.4.11). `outline-variant` is decorative only.

**Focus.** One ring for every control: primary, 2px (WCAG 2.4.13's minimum), offset by its own width so it always sits on the surface, where primary reads at 10.9:1.

**Brand.** The logo is an asset, not interface, so the color roles do not apply to it: `brand` holds its own fixed colors, outside the dynamic-color algorithm. `logo-type`, the letters, is `on-surface`'s value; `logo-mark`, the period, is the brand pink `#ff2f8e` itself, the primary source before Fidelity shifts it. The logo keeps them in every state: it does not recolor on hover, and keyboard focus draws the standard ring. Pink stays in the interface for action and now only, without exceptions.

**Chrome.** Over any content the translucent bar stays a surface of the palette: it fills with the surface at alpha 0.858 (0.8575 rounded up), the lowest at which, composited over pure white in sRGB, its tone (CIELAB L\*) does not exceed tone 22 of `surface-container-highest`, the lightest surface role. On-surface, on-surface-variant and primary then keep 4.5:1 over white as a consequence (9.6, 7.3 and 7.3:1). It blurs by space `m`, one body line, unsaturated, and is exactly the header height: no rule ends it.

## Motion

`src/motion.stylex.ts` holds Material 3's baseline durations (short1–4, medium1–4, long1–4 in 50ms steps; extra-long1–4 in 100ms steps) and easings, verbatim. A state change runs short4 on standard; an element entering runs medium4 on emphasized decelerate; an element leaving runs short4 on emphasized accelerate. Under `prefers-reduced-motion` transforms are dropped, while color and opacity transitions stay (WCAG 2.3.3).

## Layers

`src/layer.stylex.ts` names the stacking order in consecutive ordinals: content 0, banner 1 (the cookie notice, under the menu that covers it), overlay 2 (the menu, sliding out beneath the bar), chrome 3 (the bar), skip-link 4. Content isolates its own stacking, so no z-index inside it reaches the layers above.

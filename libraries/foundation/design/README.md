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

**Data tables.** A row pads its block by space `xs`, so a row of step 0 text, its line height plus two `xs`, equals space `xl` exactly: 3 × step 0, 48 → 60 px. Height comes from padding (or a minimum height), never a fixed height, so a row grows with its content.

**Grid on narrow screens.** Blocks span multiples of three columns: twelve is four groups of three, Material 3's compact grid. Tables do not use the page grid.

## Font

Archivo is the language's one typeface, self-hosted under the SIL Open Font License (`fonts/source/OFL.txt`). `src/font/archivo.woff2` is one variable file, imported with its `@font-face` sheet as `@skoreova/design/font.css`; `src/font.stylex.ts` holds its tokens, and `src/font.test.ts` checks them against the font. The source it is built from is exported as `@skoreova/design/font-source.ttf`, for tests that measure the cuts.

**Build.** `scripts/build-font.py` builds the file and the sheet from the pinned sources in `fonts/source/` (their commits and checksums are in the script), and the same sources build the same bytes:

```
python3 -m venv .venv && .venv/bin/pip install -r scripts/requirements.txt
.venv/bin/python scripts/build-font.py
```

- Axes limited to what the language uses: weight 400–700, width 75–100%.
- Glyphs subset to Google Fonts' GF Latin Core, keeping kern, mark, mkmk, ccmp, locl and tnum, and rvrn, which swaps in the currency signs' heavier drawings from weight 500 up.
- A fallback face over Arial (or Liberation Sans, which shares its advances), scaled to the body cut's average advance and carrying Archivo's ascent, descent and line gap, so the swap to the web font does not reflow a line. `font-size-adjust` is not used anywhere: matching the fallback's x-height instead (Arial at 101.44% rather than 98.61%) would widen fallback text by 2.9% and reflow lines on the swap.

**Tokens.**

| Token         | Value                                       | Source                                                                                                                                       |
| ------------- | ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Family        | `'Archivo', 'Archivo Fallback', sans-serif` | the one typeface, then its metric-matched fallback                                                                                           |
| Body cut      | width 100%, weight 400                      | Archivo's Normal width and Regular weight                                                                                                    |
| Bold          | 700                                         | CSS bold; WCAG 1.4.3's bold for large-scale text                                                                                             |
| Display cut   | width 75%, weight 700                       | OpenType/CSS Condensed and Bold, where the font's ranges end                                                                                 |
| Caps tracking | 0.05em                                      | capitals letterspaced 5–10% of the type size (Bringhurst), the lower bound; mixed case is not tracked                                        |
| Data numerals | `tabular-nums`                              | scores, tables and times align in columns                                                                                                    |
| Cap height    | 0.686em                                     | Archivo's OS/2 cap height, 686 of 1000 units, held by both cuts; a mark beside capitals (an arrow, an icon) stands this tall on the baseline |

## Color

`src/color.stylex.ts` holds the color roles, the focus ring and the chrome; `src/color.test.ts` recomputes every role with Material 3's color utilities and asserts the contrast rules.

**Method.** Material 3's dynamic color: dark scheme, variant Fidelity, spec 2021, contrast level 0. Two sources: primary `#ff2f8e`, neutral `#f3efe8` (the neutral palette takes its hue and chroma, the neutral-variant palette the same hue at chroma + 4, Material 3's own rule). No secondary or tertiary roles.

**Contrast.** `on-surface` and `on-surface-variant` read at 4.5:1 or more on the surface and every surface container; `on-primary-container` at 4.5:1 or more on `primary-container`; `outline` at 3:1 or more on the surface (WCAG 1.4.11). `outline-variant` is decorative only.

**Focus.** One ring for every control: primary, 2px (WCAG 2.4.13's minimum), offset by its own width so it always sits on the surface, where primary reads at 10.9:1.

**Chrome.** Over any content the translucent bar stays a surface of the palette: it fills with the surface at alpha 0.858 (0.8575 rounded up), the lowest at which, composited over pure white in sRGB, its tone (CIELAB L\*) does not exceed tone 22 of `surface-container-highest`, the lightest surface role. On-surface, on-surface-variant and primary then keep 4.5:1 over white as a consequence (9.6, 7.3 and 7.3:1). It blurs by space `m`, one body line, unsaturated; and ends in a 1px `outline-variant` rule.

## Motion

`src/motion.stylex.ts` holds Material 3's baseline durations (short1–4, medium1–4, long1–4 in 50ms steps; extra-long1–4 in 100ms steps) and easings, verbatim. A state change runs short4 on standard; an element entering runs medium4 on emphasized decelerate; an element leaving runs short4 on emphasized accelerate. Under `prefers-reduced-motion` transforms are dropped, while color and opacity transitions stay (WCAG 2.3.3).

## Layers

`src/layer.stylex.ts` names the stacking order in consecutive ordinals: content 0, banner 1 (the cookie notice, under the menu that covers it), overlay 2 (the menu, sliding out beneath the bar), chrome 3 (the bar), skip-link 4. Content isolates its own stacking, so no z-index inside it reaches the layers above.

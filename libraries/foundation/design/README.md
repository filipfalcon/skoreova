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

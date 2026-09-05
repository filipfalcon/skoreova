import * as stylex from '@stylexjs/stylex';

// Design tokens — typed StyleX handles over the palette. StyleX requires
// defineVars to sit in a `.stylex.ts` file that exports only variable groups.
//
// The RAW values live in styles.css's `:root` block, not here: the global
// stylesheet (ticker, honor roll, focus ring, consent banner tones) reads
// `var(--color-*)` by name and cannot reach StyleX's hashed variables, so the
// custom properties are the one place a hex value is written and these tokens
// alias them. Alpha tints (`text-ink/50` in the old Tailwind vocabulary) are
// written at the point of use as `color-mix(in srgb, var(--color-*) N%,
// transparent)` rather than pre-minted here — the app uses dozens of steps,
// and a token per step would just be the utility scale rebuilt by hand.
export const tokens = stylex.defineVars({
  ink: 'var(--color-ink)',
  panel: 'var(--color-panel)',
  paper: 'var(--color-paper)',
  // The raised surface on paper — a card's whole frame, since the platform
  // draws no rims and casts no shadows.
  surface: 'var(--color-surface)',
  // The drawn line on paper, for anything outlined rather than filled.
  hairline: 'var(--color-hairline)',
  // `pink` IS the accent token — the one the nav's active trophy, the phase
  // bar and the hero's chevrons all read. Named for the color rather than
  // the role because it predates the role, and renaming it would touch
  // every view in the app for no behavioural gain.
  pink: 'var(--color-pink)',
  pinkLive: 'var(--color-pink-live)',
  // The single muted grey. Quiet text on dark surfaces reads THIS, rather
  // than each site mixing its own percentage of paper.
  muted: 'var(--color-muted)',
  mutedInk: 'var(--color-muted-ink)',
  inkLift: 'var(--color-ink-lift)',
  formWin: 'var(--color-form-win)',
  formDraw: 'var(--color-form-draw)',
  formLoss: 'var(--color-form-loss)',
  rise: 'var(--color-rise)',
  fall: 'var(--color-fall)',
  ucl: 'var(--color-ucl)',
  uec: 'var(--color-uec)',
  drop: 'var(--color-drop)',
  uecInk: 'var(--color-uec-ink)',
  riseInk: 'var(--color-rise-ink)',
  fontDisplay: 'var(--font-display)',
  fontBody: 'var(--font-body)',
});

// THE spacing scale — a three-step rhythm, doubling. Values are literal
// here rather than aliased through `:root` (the reason colours are: global
// CSS reads them by name) because no rule outside StyleX needs a gap.
//
// The steps are meant to be used for what they SAY: `xs` binds a mark to
// the text it belongs to, `sm` holds two lines that form one statement (the
// hero's name and its facts), and `md` is the gap between blocks — facts to
// phase bar, and phase bar to the end of the section.
//
// The steps are 8 / 12 / 20, and none of them came from arithmetic — each
// was settled by what it costs. `md` is 20 because 24 spent enough of the
// hero's height to push the standings panel's heading back under the fold
// on a 667pt screen. `sm` is 12 because the name and its facts read as one
// statement only when they sit distinctly closer than the blocks around
// them, and it was walked down 16 → 14 → 12 to get there.
// `lg` is the fourth step, and it arrived for one reason: the home page's
// weekly carousel needs the next card to peek past the edge of the current
// one, and that peek is a distance the reader measures against the gaps
// beside it. 24 is twice `sm`, which is what makes a peek read as "there is
// more" rather than as a mis-set gap.
export const spacing = stylex.defineVars({
  xs: '0.5rem',
  sm: '0.75rem',
  md: '1.25rem',
  lg: '1.5rem',
  // The gap between a profile's sections on a phone: 40px, one value where the sections had drifted between 48 and 120.
  section: '2.5rem',
});

// The two rungs of quiet type. `meta` is the app's label scale — breadcrumb,
// season value, phase labels, section labels. `subtitle` is the step above
// it, the hero's middle voice between that scale and the display headline.
//
// Their TRACKING differs on purpose. It began as a fit constraint — at the
// subtitle's size the meta 0.2em ran the line past a 390px screen, and this
// line must not wrap — and 0.07em was the figure that held down to 360px,
// the narrowest phone still in circulation. The copy has since shortened
// twice, to "8 TEAMS · 2 PHASES", so the constraint no longer binds and
// this is a choice: tightening tracking as size grows is the ordinary
// typographic move, since wide letterspacing earns its keep on small caps
// and stops doing so as the type gets bigger. There is now room to widen it
// back toward the meta value if the line ever wants more air.
export const type = stylex.defineVars({
  // Two rungs for the hero's display name. XL is the size the hero was
  // designed at; L exists ONLY because some competition names are longer
  // than others, and the headline must never take a second line. Which name
  // gets which is measured, not guessed — see HEADLINE_L_SLUGS in the view.
  headlineXL: 'clamp(3.75rem, 17vw, 9rem)',
  headlineL: 'clamp(3rem, 14.5vw, 9rem)',
  metaSize: '0.625rem',
  metaTracking: '0.2em',
  subtitleSize: '1.125rem',
  subtitleTracking: '0.07em',
  // A match card's two rungs. `cardName` is the club name in a card row —
  // the subtitle size, because a card is a small surface and the two names
  // are its subject, not its headline. `scoreSize` is the goals column: the
  // one number on a finished card that has to be readable at a glance from
  // the far side of a carousel, and the size at which two of them still fit
  // beside a name on a 360px screen.
  cardName: '1.125rem',
  scoreSize: '1.5rem',
  // THE HERO CARD'S HEADLINE — "SPARTA × SLAVIA" in the display face, the
  // profile heroes' voice brought down to card scale. It is NOT headlineL:
  // that rung starts at 3rem and a card is 314px wide, so the shortest
  // pairing in the league would still take three lines. This clamp holds the
  // common pairings on one line at 390px and lets the longest fall to two,
  // which is the range the layout is built for.
  cardHeadline: 'clamp(1.875rem, 9vw, 2.75rem)',
});

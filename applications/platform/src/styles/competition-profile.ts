import * as stylex from '@stylexjs/stylex';

import { spacing, tokens, type } from '../tokens.stylex';

// Styles for the competition profile (page/competition-profile.ts): the
// profile header, the standings/format/history panels, the round-by-round
// matches panel, and the edition picker.

const SM = '@media (min-width: 640px)';
const MD = '@media (min-width: 768px)';
const LG = '@media (min-width: 1024px)';

export const styles = stylex.create({
  // ——— The hero opening — the club profile's dark act, value for value
  // (deliberately copied, not shared, the same way the two apps' headers
  // are: the pages should FEEL like one grammar while each keeps its own
  // styles module). ———
  heroBand: {
    position: 'relative',
    marginTop: {
      default: '-2.5rem',
      [MD]: '-3.5rem',
    },
    marginInline: 'calc(50% - 50vw)',
    overflow: 'hidden',
    backgroundColor: tokens.ink,
    paddingInline: {
      default: '1.25rem',
      [MD]: '2.5rem',
    },
    paddingTop: '2rem',
    // The same step that separates the name, the facts and the bar, so the
    // black closes the section on the rhythm it kept inside it.
    //
    // This is also THE PEEK's lever. The band has no viewport lock, so how
    // much of the standings panel clears the fold is simply its height, and
    // this padding is the part of that height with nothing riding on it.
    // `heroArt`'s height is not a substitute: it moves the artwork's bottom
    // edge, which `heroScrim`'s stops are measured from.
    paddingBottom: spacing.md,
  },
  heroArt: {
    position: 'relative',
    marginInline: {
      default: '-1.25rem',
      [MD]: '-2.5rem',
    },
    marginTop: '-2rem',
    height: {
      default: '22rem',
      [MD]: '34rem',
    },
    overflow: 'hidden',
    willChange: 'transform',
  },
  // Phones ZOOM the artwork in (the club hero's call — the wide frame
  // shrank the players to specks); md+ shows the full crop.
  heroArtImage: {
    position: 'absolute',
    inset: 0,
    height: '100%',
    width: '100%',
    transform: {
      default: 'scale(1.45)',
      [MD]: 'scale(1)',
    },
    objectFit: 'cover',
  },
  // The scrim that carries the name. Pinned to the BAND, so the parallax
  // can't drag it off the type; `bottom: 0` and length-based gradient stops
  // (not percentages) keep the ramp identical however tall the band grows.
  //
  // The stops put FULL opacity 19rem down the band on phones and 32rem at
  // md. The display name starts at or below that line — it used to sit
  // exactly on it, and now clears it by 0.75rem after the column was eased
  // down — so every letter lands on ink that is already solid. That is the
  // invariant: the name may move DOWN freely, but moving it up, or growing
  // `heroArt`, walks type back onto lit photograph and these stops have to
  // follow. Past its last stop the ramp holds ink, which also covers the
  // strip the artwork drifts into: the visible photo window then holds
  // still while the image moves inside it.
  heroScrim: {
    pointerEvents: 'none',
    position: 'absolute',
    insetInline: 0,
    top: {
      default: '6rem',
      [MD]: '14rem',
    },
    bottom: 0,
    // Past the solid point the ramp keeps going, ink → --color-ink-lift, so
    // the zone the headline and the phase bar live in is not a dead flat
    // field (user call). It is a 7-value lift across the whole depth —
    // enough to read as a surface, nowhere near enough to threaten the
    // type: cream on the lift measures 16:1 against the 4.5:1 it needs.
    backgroundImage: {
      default:
        'linear-gradient(to bottom, transparent 0, color-mix(in srgb, var(--color-ink) 25%, transparent) 5rem, color-mix(in srgb, var(--color-ink) 70%, transparent) 9rem, var(--color-ink) 13rem, var(--color-ink-lift) 100%)',
      [MD]: 'linear-gradient(to bottom, transparent 0, color-mix(in srgb, var(--color-ink) 25%, transparent) 7rem, color-mix(in srgb, var(--color-ink) 70%, transparent) 13rem, var(--color-ink) 18rem, var(--color-ink-lift) 100%)',
    },
  },
  // The TOP scrim — ~150px of ink ramping off the photo so the wayfinding
  // line never lands on a bright frame.
  //
  // NO flat run at the top (user call): it used to hold pure ink for the
  // first 2rem, and that read as a black STRIP pasted over the photo rather
  // than as the picture darkening. The ramp now starts at 88% and moves
  // immediately, so the image is present from the first pixel.
  //
  // 88% is the floor, not a taste call. The breadcrumb's ink sits ~11–26px
  // down; against the worst backdrop a photo can put there — blown white —
  // 88% ink still returns about 6:1, and the value and chevron more. Lower
  // the opening stop and that margin is what gets spent.
  heroTopScrim: {
    pointerEvents: 'none',
    position: 'absolute',
    insetInline: 0,
    top: 0,
    height: '9.5rem',
    backgroundImage:
      'linear-gradient(to bottom, color-mix(in srgb, var(--color-ink) 88%, transparent) 0, color-mix(in srgb, var(--color-ink) 62%, transparent) 3.5rem, color-mix(in srgb, var(--color-ink) 22%, transparent) 6.5rem, transparent 9.5rem)',
  },
  // The wayfinding line, pinned to the BAND rather than to the artwork —
  // the same reason as heroScrim: anything inside `.club-hero-art` rides
  // the parallax down the page. zIndex clears the scrim and the grain (both
  // auto) and the text column (10).
  heroTopRow: {
    position: 'absolute',
    // As high in the band as it goes (user call). The band's top edge IS
    // the header's bottom edge — it starts there and the artwork with it —
    // so this 0.25rem is the last of the travel; anything more and the row
    // touches the header chrome. Riding this high also puts it inside
    // heroTopScrim's solid first 2rem, so the breadcrumb's contrast went UP
    // as it moved, not down.
    top: '0.25rem',
    insetInline: {
      default: '1.25rem',
      [MD]: '2.5rem',
    },
    zIndex: 20,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1rem',
  },
  // Positioning only — size, stroke and color come from the shared chevron.
  // The negative margin is SIDE BEARING, not spacing: a left-pointing
  // chevron fills only the middle third of its box horizontally, so sitting
  // the box on the row's inset would leave its ink further from the screen
  // edge than the caret's is from the other one.
  backChevron: {
    marginLeft: '-0.25rem',
    // And the mirror of it on the other side, so the flex `gap` IS the gap
    // you see. Without this the chevron's right-hand bearing is added to
    // the token instead of absorbed by it, and the pair reads nearly twice
    // as loose as the select's — which is exactly how they diverged.
    marginRight: '-0.35rem',
  },
  // Size, tracking, case and weight arrive from shared.metaText; the colour
  // is the one property overridden, and it is a TOKEN SWAP — muted → paper
  // (user call), never a literal. That puts the whole top row on paper and
  // leaves `fontWeight` as the only thing separating this label from the
  // season value beside it. The subtitle below keeps metaText's muted, so
  // the bottom zone's hierarchy is untouched. Still no hover colour: the
  // accent belongs to the glyph, not the label.
  heroBackLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: spacing.xs,
    color: tokens.paper,
  },
  // The select and its drawn caret share one box: the caret is positioned
  // against this, and the control reserves room for it on the right.
  seasonField: {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
  },
  // The hero's one control — and it has NO container at all now (user
  // call): no fill, no outline, just the value in paper with a pink chevron.
  // Container and outline were each tried and each pulled; what carries the
  // affordance instead is the colored arrow, which is the one mark in the
  // band that is pink without being a state readout.
  //
  // With nothing drawn behind it, the value sits directly on heroTopScrim's
  // ramp over the photograph — which is why that ramp's opening stop is a
  // contrast budget rather than a look.
  //
  // The padding is FUNCTIONAL, not visual. With nothing drawn, it is pure
  // touch target: 0.75rem block padding on a 1.25rem line box makes the hit
  // area 44px, the Apple HIG / WCAG 2.5.5 figure. The negative margin then
  // takes those same 16px back out of LAYOUT, so the row stays the height it
  // was and the breadcrumb beside it does not shift down — the target grows
  // without anything moving.
  seasonSelect: {
    appearance: 'none',
    cursor: 'pointer',
    borderWidth: 0,
    backgroundColor: 'transparent',
    paddingLeft: '0.75rem',
    // The caret's clearance, expressed as the SAME step the breadcrumb uses
    // plus the glyph box it sits over. Derived from the token rather than
    // typed, so the two pairs move together if the step ever changes.
    paddingRight: `calc(${spacing.xs} + 0.635rem)`,
    paddingBlock: '0.75rem',
    marginBlock: '-0.5rem',
    // Composed on shared.metaText, not copied from it. Colour is now the
    // only override: the row settled on paper regular for BOTH halves (user
    // call), so label and value are typographically identical and the pair
    // is told apart by position and by which way its chevron points.
    // Paper, full stop — pink in this control is the chevron's alone (user
    // call). Hover used to take the value pink as well; that also meant a
    // TAP left it pink, because StyleX ':hover' here is not gated behind
    // `@media (hover: hover)` and touch devices keep the state applied after
    // the finger leaves. Press feedback is the ':active' opacity below,
    // which releases on its own.
    color: tokens.paper,
    fontFamily: tokens.fontBody,
    opacity: {
      default: 1,
      ':active': 0.7,
    },
    // No focus style of its own: the ring is the app-wide `:focus-visible`
    // rule in styles.css, whose offset went to 3px for EVERY control rather
    // than this one carrying an exception. Square, like the hit area it
    // traces and everything else here.
    // The native popup is the one part of this no rule here can style —
    // this is what keeps the option list from opening as white-on-white.
    colorScheme: 'dark',
    // Opacity is the only thing that moves here now — the inherited
    // color/background/border list was left over from the filled block and
    // named three properties this control no longer changes.
    transitionProperty: 'opacity',
    transitionDuration: '0.15s',
    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
  // THE affordance (user call). With the box gone, this arrow is the only
  // thing saying the value can be changed, so it is pink — the accent the
  // nav's own trophy uses — and drawn at a size that carries: 18px against a
  // 14px value, not the 14px muted-grey mark it was when a bordered block
  // was doing the work. Explicitly centered rather than left to the flex
  // parent, since an absolutely positioned child's static position is not
  // somewhere to place a load-bearing glyph. Clicks fall through to the
  // select underneath.
  // `right` is NEGATIVE by the width of the glyph's own side bearing. The
  // chevron's path spans the middle half of its 24-unit viewBox, so its INK
  // stops a quarter-box short of its right edge; sitting the box flush with
  // the row would leave the mark visibly further from the screen edge than
  // the back arrow's ink is from the other one. This pushes the box out by
  // exactly that bearing so the two rows of INK, which is what anyone
  // actually sees, end the same distance from their respective edges.
  seasonCaret: {
    pointerEvents: 'none',
    position: 'absolute',
    right: '-0.14rem',
    top: '50%',
    transform: 'translateY(-50%)',
  },
  heroColumn: {
    position: 'relative',
    zIndex: 10,
    marginInline: 'auto',
    width: '100%',
    maxWidth: '64rem',
  },
  // The NAME pulls up into the photo — it is the first thing in the column
  // now that the badge is gone, so this pull is the name's own. Its depth
  // and `heroScrim`'s stops are ONE measurement: the scrim goes fully ink
  // exactly where these two values put the first letter, so moving either
  // without the other is what puts type back on a lit photo. The band only
  // renders when artwork exists, so there is no plain variant here.
  hero: {
    position: 'relative',
    // How far the whole text column rides up into the artwork. Easing it
    // by 0.75rem drops the name, the facts and the bar together and grows
    // the band by the same amount (user call) — heroScrim is untouched, so
    // the gradient still begins exactly where it did and only the content
    // below it moves.
    //
    // The DIRECTION matters and only one way is safe. The scrim turns solid
    // ink at 19rem down the band on phones, 32rem at md; these values used
    // to put the first letter on precisely that rem. Sliding the column
    // DOWN keeps every letter on ink that is already fully opaque. Sliding
    // it up is what would walk the type back onto lit photograph, so if
    // this number ever grows again, heroScrim's stops have to move with it.
    marginTop: {
      default: '-3.75rem',
      [MD]: '-3.25rem',
    },
    textAlign: 'center',
  },
  // The name takes one of two sizes; everything else about it is shared.
  // Shrinking the whole hero to fit the longest name cost every competition
  // presence for the sake of three, so the size is per-name instead.
  heroNameXL: {
    fontSize: type.headlineXL,
  },
  heroNameL: {
    fontSize: type.headlineL,
  },
  heroName: {
    marginTop: {
      default: '1.5rem',
      [MD]: '2rem',
    },
    lineHeight: 0.95,
    // Anton is drawn tight, and `.display` pulls it tighter still (-0.01em)
    // — right for a headline, mean at this size, where the letters lock
    // into one mass. A small POSITIVE tracking overrides it and lets the
    // name breathe; em-based, so it scales with the clamp.
    letterSpacing: '0.02em',
    color: tokens.paper,
  },
  // Two steps below the headline and level with the breadcrumb in voice —
  // same 0.2em tracking, same uppercase, no surface, nothing to click. One
  // line: the derived string is short by construction. This replaced the
  // pink tagline block and the bordered stage chip both, which is what
  // leaves the selector as the hero's only filled surface.
  // The hero's MIDDLE voice — lifted out of shared.metaText into its own
  // rung (user call) rather than composed on it: it is no longer the label
  // scale, so inheriting from it and overriding two properties would just
  // be a lie about where it belongs. Same muted colour and regular weight,
  // one step up in size, and tracking tightened to the subtitle token so
  // the line still holds at 390px.
  // Closer to the name than the bar is to it: the headline and the facts
  // are one statement, the bar is the next thing (user call).
  heroSubtitle: {
    marginTop: spacing.sm,
    fontSize: type.subtitleSize,
    lineHeight: 1.4,
    letterSpacing: type.subtitleTracking,
    textTransform: 'uppercase',
    color: tokens.muted,
  },
  // The separator carries the pink, not the words — the same dot the
  // SKÓREOVÁ wordmark ends on, at the one place in this line a mark can sit
  // without turning quiet text into a coloured label.
  //
  // DRAWN, not typed: a "·" is placed by whatever font resolves it, and in
  // the body face it sits at x-height — visibly low against a line that is
  // all capitals. A square block instead, in the app's own square grammar
  // and the wordmark's, positioned off the BASELINE: `vertical-align` puts
  // its underside 0.22em up, which centers a 0.3em mark on the cap band of
  // a face whose capitals stand about 0.73em. Both values are `em`, so the
  // mark holds its place if the line is ever resized.
  heroSubtitleDot: {
    display: 'inline-block',
    width: '0.42em',
    height: '0.42em',
    // Measured to land the square's centre ON the cap band's centre, not
    // the line box's — the line is all capitals and figures, so the cap
    // band is what the eye reads as the middle.
    verticalAlign: '0.127em',
    // The spaces either side are TEXT (they have to be: the mark is hidden
    // from assistive tech, and without them the phrases run together in the
    // accessible name). That leaves the optical gaps at the mercy of the
    // neighbouring glyphs' own side bearings, and they are not symmetric —
    // "S" ends with more built-in space than "2" or "3" begins with, which
    // measured as ~1.4px tighter on the right. This shifts the mark half
    // that distance left; the two margins cancel, so the line's width and
    // everything after it are untouched.
    // 0.17em of air on each side, plus/minus the 0.04em bearing nudge above.
    marginLeft: '0.13em',
    marginRight: '0.21em',
    backgroundColor: tokens.pink,
  },
  heroGrain: {
    pointerEvents: 'none',
    position: 'absolute',
    inset: 0,
  },
  // ——— The season timeline — the LiveSport strip reshaped into phase bars
  // cut into one PIECE per matchday, in the platform's vocabulary: paper
  // pieces, pink for the ones behind us, square edges like every bar in the
  // app. ———
  // One step, like every other gap down here (user call): name → facts →
  // bar → the section's end all sit `sm` apart, and only the phase labels
  // stay closer to the bar they belong to.
  timeline: {
    marginInline: 'auto',
    marginTop: spacing.md,
    width: '100%',
    maxWidth: '36rem',
  },
  timelineRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  // The bar itself carries no color — the pieces are the bar. flexGrow is
  // set inline per phase (its round count), so a piece measures the same in
  // a 14-round phase and a 6-round one.
  timelineTrack: {
    display: 'flex',
    height: '6px',
    flexShrink: 1,
    flexBasis: '0%',
    gap: '2px',
  },
  timelinePiece: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: '0%',
  },
  timelinePiecePlayed: {
    backgroundColor: tokens.pink,
  },
  // The round we are IN — "you are here", not just "this far". Lighter pink
  // is the whole signal on its own; the `phase-now` pulse in styles.css is
  // an addition to it, so a reader with reduced motion still sees which
  // segment is live rather than losing the distinction with the animation.
  timelinePieceCurrent: {
    backgroundColor: tokens.pinkLive,
  },
  timelinePieceRest: {
    backgroundColor: 'color-mix(in srgb, var(--color-paper) 15%, transparent)',
  },
  // Smallest step: the labels belong to the bar above them.
  timelineLabels: {
    marginTop: spacing.xs,
    display: 'flex',
    alignItems: 'baseline',
    gap: '0.75rem',
  },
  // Each label centers under its own bar — flexGrow rides inline with the
  // same round count the bar above uses, so the two rows share one set of
  // column widths. The CURRENT phase carries the pink: "you are here".
  timelineLabel: {
    flexShrink: 1,
    flexBasis: '0%',
    textAlign: 'center',
    // The meta rung, like every other label in this band — the subtitle is
    // the only voice between it and the headline.
    fontSize: type.metaSize,
    // A label's column is its PHASE's share of the season, so a short phase
    // gets a narrow column: the Second League's six-round split leaves
    // 84.5px for a word needing 85.9px, and it stacked. Overflowing the
    // column is the better failure — the label stays one line, still
    // centred on its own bar, and the long phase beside it has 60px of
    // slack either side for the overflow to sit in.
    whiteSpace: 'nowrap',
    letterSpacing: type.metaTracking,
    textTransform: 'uppercase',
  },
  timelineLabelActive: {
    color: tokens.pink,
  },
  timelineLabelRest: {
    color: 'color-mix(in srgb, var(--color-paper) 50%, transparent)',
  },
  // The paper-act twin of heroBackLink, on the competitions that have no
  // artwork. It was still declaring its own size, tracking and case on top
  // of shared.metaText — the same values, said twice, with the tracking
  // quietly disagreeing at 0.25em. Only what genuinely differs stays: this
  // one sits on the light page, so metaText's muted (tuned for dark) has to
  // be re-inked. Outside the hero, so it keeps its hover.
  backLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: spacing.xs,
    color: {
      default: 'color-mix(in srgb, var(--color-ink) 45%, transparent)',
      ':hover': tokens.pink,
    },
    transitionProperty: 'color, background-color, border-color',
    transitionDuration: '0.15s',
    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
  // Was a flex row pairing the badge with the title block; with the badge
  // gone the title simply stacks, so all this owes the page is its air.
  headerBlock: {
    marginTop: '2rem',
  },
  title: {
    fontSize: {
      default: '3rem',
      [MD]: '4.5rem',
    },
    lineHeight: 1,
    color: tokens.ink,
  },
  chipRow: {
    marginTop: '1rem',
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
  },
  honorChip: {
    display: 'inline-block',
    backgroundColor: tokens.pink,
    paddingInline: '0.75rem',
    paddingBlock: '0.375rem',
    fontSize: '0.875rem',
    lineHeight: '1.25rem',
    letterSpacing: '0.15em',
    color: tokens.ink,
  },
  mutedChip: {
    display: 'inline-block',
    borderWidth: 1,
    borderColor: 'color-mix(in srgb, var(--color-ink) 15%, transparent)',
    paddingInline: '0.75rem',
    paddingBlock: '0.375rem',
    fontSize: '10px',
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    color: 'color-mix(in srgb, var(--color-ink) 50%, transparent)',
  },
  panelBody: {
    padding: {
      default: '1.5rem',
      [MD]: '2rem',
    },
  },
  list: {
    marginTop: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
  },
  // No card: the section is a chip plus a table on the page's paper, so the
  // only frame is the rules between rows.
  standingsSection: {
    display: 'flex',
    flexDirection: 'column',
    // Clears the FIXED header plus a little air, the same figure the club
    // profile's sections use — without it an anchored jump parks the
    // section's own chip behind the chrome, which reads as landing in the
    // wrong place.
    scrollMarginTop: {
      default: '7rem',
      [MD]: '8rem',
    },
  },
  standingsHeading: {
    display: 'flex',
  },
  // Only the two right-hand columns are labelled; the tracks below them are
  // the same widths the row uses, so each sits over its own column.
  standingsHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    paddingBottom: spacing.xs,
  },
  standingsHeaderForm: {
    width: '5rem',
    textAlign: 'center',
  },
  standingsHeaderPoints: {
    width: '2.25rem',
    textAlign: 'right',
  },
  standingsList: {
    display: 'flex',
    flexDirection: 'column',
  },
  standingsRow: {
    borderTopWidth: {
      default: 1,
      ':first-child': 0,
    },
  },
  // The link IS the row (user call), so the whole strip is one target and
  // the 44px floor is the Apple HIG / WCAG 2.5.5 figure.
  standingsRowLink: {
    display: 'flex',
    minHeight: '44px',
    alignItems: 'center',
    gap: spacing.sm,
    paddingBlock: '0.625rem',
  },
  // A thin accent rule under the last title-group place — where the table
  // splits. Drawn on the row rather than as an element of its own so it can
  // never fall out of step with the row it belongs to.
  standingsSplitBoundary: {
    borderBottomWidth: 2,
    borderBottomColor: tokens.pink,
  },
  standingsRowHighlighted: {
    borderTopColor: tokens.pink,
    backgroundColor: tokens.pink,
    color: tokens.ink,
  },
  standingsRowRest: {
    borderTopColor: 'color-mix(in srgb, var(--color-ink) 10%, transparent)',
  },
  standingsRank: {
    width: '1.75rem',
    flexShrink: 0,
    fontSize: '1.125rem',
    lineHeight: '1.75rem',
    fontVariantNumeric: 'tabular-nums',
  },
  standingsRankHighlighted: {
    color: 'color-mix(in srgb, var(--color-ink) 60%, transparent)',
  },
  standingsRankRest: {
    color: 'color-mix(in srgb, var(--color-ink) 30%, transparent)',
  },
  standingsCrest: {
    height: '1.5rem',
    width: '1.5rem',
    flexShrink: 0,
    objectFit: 'contain',
  },
  // Name over its own played count. `min-width: 0` is what lets the name
  // truncate instead of pushing the form and points off the row.
  standingsNameBlock: {
    display: 'flex',
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: '0%',
    minWidth: 0,
    flexDirection: 'column',
  },
  standingsTeam: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontSize: '1.125rem',
    lineHeight: '1.5rem',
    color: tokens.ink,
  },
  // metaText's muted grey is tuned for the dark band; on this paper it
  // reads at 2:1. The paper-side token is the same idea re-inked.
  standingsPlayed: {
    color: tokens.mutedInk,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  standingsPlayedHighlighted: {
    color: 'color-mix(in srgb, var(--color-ink) 60%, transparent)',
  },
  // Five squares, oldest first. Fixed width so the column lines up with its
  // header and with every other row.
  formStrip: {
    display: 'flex',
    width: '5rem',
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: '3px',
  },
  formSquare: {
    height: '0.5rem',
    width: '0.5rem',
    flexShrink: 0,
  },
  formWin: {
    backgroundColor: tokens.formWin,
  },
  formDraw: {
    backgroundColor: tokens.formDraw,
  },
  formLoss: {
    backgroundColor: tokens.formLoss,
  },
  // Not played yet: an outline, no fill. The empty square is the one state
  // that must not read as a result.
  formUpcoming: {
    borderWidth: 1,
    borderColor: tokens.mutedInk,
  },
  standingsPoints: {
    width: '2.25rem',
    flexShrink: 0,
    textAlign: 'right',
    fontSize: '1.125rem',
    lineHeight: '1.75rem',
    fontWeight: 700,
    // The column has to read as a column — figures of one width.
    fontVariantNumeric: 'tabular-nums',
  },
  standingsPointsPink: {
    color: tokens.pink,
  },
  tieRow: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    columnGap: '1rem',
    borderTopWidth: {
      default: 1,
      ':first-child': 0,
    },
    borderTopColor: 'color-mix(in srgb, var(--color-ink) 10%, transparent)',
    paddingBlock: '0.875rem',
  },
  tiePrimary: {
    fontSize: '1.25rem',
    lineHeight: '1.75rem',
    color: tokens.ink,
  },
  tieSecondary: {
    fontSize: '10px',
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    color: tokens.pink,
  },
  formatRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '1rem',
    borderTopWidth: {
      default: 1,
      ':first-child': 0,
    },
    borderTopColor: 'color-mix(in srgb, var(--color-ink) 10%, transparent)',
    paddingInline: '0.5rem',
    paddingBlock: '1rem',
  },
  formatNumber: {
    fontSize: '1.5rem',
    lineHeight: '2rem',
    color: tokens.pink,
  },
  formatRule: {
    fontSize: '0.875rem',
    lineHeight: 1.625,
    color: 'color-mix(in srgb, var(--color-ink) 80%, transparent)',
  },
  historyGrid: {
    marginTop: '2rem',
    display: 'grid',
    gap: '2rem',
    gridTemplateColumns: {
      default: null,
      [SM]: 'repeat(3, minmax(0, 1fr))',
    },
  },
  historyValue: {
    marginTop: '0.75rem',
    fontSize: '2.25rem',
    lineHeight: '2.5rem',
    color: tokens.ink,
  },
  historyLabel: {
    marginTop: '0.5rem',
    fontSize: '10px',
    lineHeight: 1.625,
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    color: 'color-mix(in srgb, var(--color-ink) 50%, transparent)',
  },
  matchesHeader: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1rem',
  },
  arrowRow: {
    display: 'flex',
    gap: '0.5rem',
  },
  arrow: {
    borderWidth: 1,
    paddingInline: '0.875rem',
    paddingBlock: '0.375rem',
    fontSize: '1rem',
    lineHeight: '1.5rem',
    transitionProperty: 'color, background-color, border-color',
    transitionDuration: '0.15s',
    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
  arrowBlocked: {
    cursor: 'default',
    borderColor: 'color-mix(in srgb, var(--color-ink) 10%, transparent)',
    color: 'color-mix(in srgb, var(--color-ink) 20%, transparent)',
  },
  arrowLive: {
    cursor: 'pointer',
    borderColor: {
      default: 'color-mix(in srgb, var(--color-ink) 20%, transparent)',
      ':hover': tokens.pink,
    },
    color: {
      default: tokens.ink,
      ':hover': tokens.pink,
    },
  },
  matchRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    borderTopWidth: {
      default: 1,
      ':first-child': 0,
    },
    borderTopColor: 'color-mix(in srgb, var(--color-ink) 10%, transparent)',
    paddingBlock: '0.875rem',
    fontSize: '0.875rem',
    lineHeight: '1.25rem',
  },
  matchTeam: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: '0%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    color: tokens.ink,
  },
  matchTeamHome: {
    textAlign: 'right',
  },
  scoreChip: {
    flexShrink: 0,
    backgroundColor: tokens.pink,
    paddingInline: '0.625rem',
    paddingBlock: '0.25rem',
    fontSize: '1rem',
    lineHeight: '1.5rem',
    color: tokens.ink,
  },
  vsChip: {
    flexShrink: 0,
    borderWidth: 1,
    borderColor: 'color-mix(in srgb, var(--color-ink) 15%, transparent)',
    paddingInline: '0.625rem',
    paddingBlock: '0.25rem',
    fontSize: '1rem',
    lineHeight: '1.5rem',
    color: 'color-mix(in srgb, var(--color-ink) 40%, transparent)',
  },
  // Closing the page, not a panel: a hairline sets it off from the format
  // and history cards above without wrapping it in a third card.
  archive: {
    borderTopWidth: 1,
    borderTopColor: 'color-mix(in srgb, var(--color-ink) 10%, transparent)',
    paddingTop: '2rem',
  },
  editionGroup: {
    marginTop: '1rem',
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
  },
  editionOption: {
    cursor: 'pointer',
    borderWidth: 1,
    paddingInline: '1rem',
    paddingBlock: '0.5rem',
    fontSize: '10px',
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    transitionProperty: 'color, background-color, border-color',
    transitionDuration: '0.15s',
    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
  editionChecked: {
    borderColor: tokens.pink,
    backgroundColor: tokens.pink,
    color: tokens.ink,
  },
  editionRest: {
    borderColor: {
      default: 'color-mix(in srgb, var(--color-ink) 15%, transparent)',
      ':hover': tokens.pink,
    },
    color: {
      default: 'color-mix(in srgb, var(--color-ink) 60%, transparent)',
      ':hover': tokens.ink,
    },
  },
  archiveDetail: {
    marginTop: '1.5rem',
    fontSize: {
      default: '1.875rem',
      [MD]: '2.25rem',
    },
    lineHeight: {
      default: '2.25rem',
      [MD]: '2.5rem',
    },
    color: tokens.ink,
  },
  archiveNote: {
    marginTop: '0.75rem',
    fontSize: '0.75rem',
    lineHeight: 1.625,
    color: 'color-mix(in srgb, var(--color-ink) 40%, transparent)',
  },
  stack: {
    marginTop: '2rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem',
  },
  panelPair: {
    display: 'grid',
    gap: '2rem',
    gridTemplateColumns: {
      default: null,
      [LG]: 'repeat(2, minmax(0, 1fr))',
    },
  },
});

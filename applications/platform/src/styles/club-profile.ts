import * as stylex from '@stylexjs/stylex';

import { spacing, tokens, type } from '../tokens.stylex';

// Styles for the club profile (page/club-profile.ts): the full-bleed dark
// editorial band — the hero's fixed template of photo slot, crest disc, name
// box, honors badge and commentary — and the paper data act's cup run,
// scorer boards, history grid and follow call.

const SM = '@media (min-width: 640px)';
const MD = '@media (min-width: 768px)';
const LG = '@media (min-width: 1024px)';
const REDUCE = '@media (prefers-reduced-motion: reduce)';
// The width from which a history card holds its full detail line (see historyDetail).
const CARD_FITS_DETAIL = '@media (min-width: 375px)';

// The honors badge's crossfade: the incoming honor fades in over the paper.
const honorFade = stylex.keyframes({
  from: { opacity: 0 },
  to: { opacity: 1 },
});

export const styles = stylex.create({
  // The dark act — flows straight out of the header chrome, full-bleed via
  // the 50%-50vw margin trick. Closes `lg` under the commentary's byline —
  // the last fixed gap of the template before the paper act.
  darkBand: {
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
    paddingBottom: spacing.lg,
  },
  // THE PHOTO SLOT — square on a phone, whatever the photo: 390px tall at
  // 390 wide, 360 at 360. One height for every club on a given device, so
  // the crest, the name and the paper act land on the same y for all of
  // them. The wrapper cancels the band's padding so the photo runs edge to
  // edge; the parallax drift is the club-hero-art contract.
  heroArt: {
    position: 'relative',
    marginInline: {
      default: '-1.25rem',
      [MD]: '-2.5rem',
    },
    marginTop: '-2rem',
    aspectRatio: {
      default: '1 / 1',
      [MD]: 'auto',
    },
    height: {
      default: 'auto',
      [MD]: '34rem',
    },
    overflow: 'hidden',
    // Its own stacking context: the wash's blur composites against this
    // slot alone and can never sample the page under it.
    isolation: 'isolate',
    willChange: 'transform',
  },
  // A club without a photo keeps the slot at its full height on the panel
  // tone, with its own crest blown up, blurred and faint behind the real one.
  heroArtWashed: {
    backgroundColor: tokens.panel,
  },
  // The crest asset itself, blown up past the slot on every side and blurred
  // wide, so its colour reaches all four edges of the square rather than
  // pooling in its middle; the same fade to ink as a photo runs over it.
  // A plain img with a filter, never a backdrop-filter: a backdrop would
  // blur whatever the page put behind the slot. Kept to 150% of the slot
  // and on its own layer, since a much larger blurred layer is where a
  // phone's compositor starts tiling in pieces of other layers.
  heroWashImage: {
    position: 'absolute',
    top: '-25%',
    left: '-25%',
    height: '150%',
    width: '150%',
    // The reset caps every img at its container; this one has to run past it.
    maxWidth: 'none',
    objectFit: 'contain',
    // Saturated before the opacity thins it: at 40% over ink an unsaturated
    // blur read as brown or olive for the crests that lean red or green.
    filter: 'blur(120px) saturate(1.6)',
    opacity: 0.4,
    transform: 'translateZ(0)',
  },
  // The photo fills the square; where its faces are is the club's own
  // focal point, written inline as object-position.
  heroArtImage: {
    position: 'absolute',
    inset: 0,
    height: '100%',
    width: '100%',
    objectFit: 'cover',
  },
  // The fade into the band: clear for the top 55% of the slot, then ink by
  // the bottom edge, so the crest disc sits on ink whatever the photo.
  heroArtFade: {
    position: 'absolute',
    inset: 0,
    backgroundImage: 'linear-gradient(to bottom, transparent 55%, var(--color-ink) 100%)',
  },
  // Over the art at every width, 1rem under the header (the band's top IS
  // the header's bottom edge — the negative top margin only cancels the
  // shell's padding).
  backLinkOnArt: {
    position: 'absolute',
    top: '1rem',
    left: {
      default: '1.25rem',
      [MD]: '2.5rem',
    },
    zIndex: 10,
  },
  bandColumn: {
    position: 'relative',
    zIndex: 10,
    marginInline: 'auto',
    width: '100%',
    maxWidth: '64rem',
  },
  // The crest slot is centred on the photo's bottom edge — half over the
  // art, half over the band — so the pull-up is exactly half the slot.
  hero: {
    position: 'relative',
    marginTop: {
      default: '-5rem',
      [MD]: '-6.5rem',
    },
    textAlign: 'center',
  },
  // THE CREST SLOT — 160px tall on a phone, the crest bare inside it at the
  // slot's full size. No disc and no ground: every crest asset is
  // transparent (crest-assets.test.ts holds that line), so it sits on the
  // photo's fade or on the wash directly, and the slot's height is what
  // keeps the name and everything under it on one y for every club.
  crestSlot: {
    marginInline: 'auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: {
      default: '10rem',
      [MD]: '13rem',
    },
  },
  crest: {
    height: {
      default: '10rem',
      [MD]: '13rem',
    },
    width: {
      default: '10rem',
      [MD]: '13rem',
    },
    objectFit: 'contain',
  },
  // THE NAME BOX — the headline rung, centred, at one size per viewport
  // width and never fitted to the name. Three lines on a phone at the 1.02
  // leading, two from md: a shorter name leaves its spare lines and nothing
  // under it moves. A name that would need a fourth line never reaches the
  // box — heroTitle hands the club's headline form in its place.
  heroName: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: {
      default: '3.06em',
      [MD]: '2.04em',
    },
    marginTop: spacing.md,
    fontSize: type.headlineXL,
    lineHeight: 1.02,
    marginInline: 'auto',
    maxWidth: {
      default: '30rem',
      [MD]: '34rem',
    },
    overflowWrap: 'normal',
    wordBreak: 'normal',
    color: tokens.paper,
  },
  // THE HONORS SLOT — one badge's height for every club, `md` under the name.
  honorSlot: {
    marginTop: spacing.md,
    display: 'flex',
    justifyContent: 'center',
    height: {
      default: '2.5rem',
      [MD]: '2.75rem',
    },
  },
  // The badge: a paper block on the ink, the display face at the subtitle
  // rung. Every honor it cycles stacks in the same grid cell, so the block
  // is as wide as the WIDEST of them and its width never moves between
  // ticks — no measuring, no reflow. Pressed, the paper dims a step.
  honorBadge: {
    display: 'grid',
    paddingInline: {
      default: '0.75rem',
      [MD]: '0.875rem',
    },
    paddingBlock: {
      default: '0.375rem',
      [MD]: '0.5rem',
    },
    fontSize: {
      default: type.subtitleSize,
      [MD]: '1.25rem',
    },
    lineHeight: '1.75rem',
    letterSpacing: type.subtitleTracking,
    color: tokens.ink,
    backgroundColor: {
      default: tokens.paper,
      ':active': 'color-mix(in srgb, var(--color-paper) 85%, transparent)',
    },
    transitionProperty: 'background-color',
    transitionDuration: '0.15s',
    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
  honorBadgeButton: {
    cursor: 'pointer',
  },
  honorLine: {
    gridColumnStart: 1,
    gridRowStart: 1,
    textAlign: 'center',
    whiteSpace: 'nowrap',
  },
  // The honor showing fades in over the paper as it takes the cell; the rest
  // hold the cell's width invisibly. With motion reduced the badge never
  // cycles, so the fade has nothing to do and is dropped.
  honorLineShown: {
    animationName: {
      default: honorFade,
      [REDUCE]: 'none',
    },
    animationDuration: '200ms',
    animationTimingFunction: 'ease-out',
    animationFillMode: 'both',
  },
  honorLineHidden: {
    visibility: 'hidden',
  },
  // THE COMMENTARY — `lg` under the honors slot, the quote framed by its
  // pink rule, folded to its first lines, then Skóreová's byline `sm` under
  // it. The one slot of the template that collapses: a club without a
  // statement shows no block at all.
  commentary: {
    marginInline: 'auto',
    marginTop: spacing.lg,
    maxWidth: '42rem',
  },
  // The text's own measure, centered inside the figure.
  commentaryColumn: {
    marginInline: 'auto',
    width: '100%',
    maxWidth: {
      default: '30rem',
      [MD]: '34rem',
    },
  },
  // The opener rule the History tiles use.
  pinkRule: {
    height: '3px',
    width: '2.5rem',
    backgroundColor: tokens.pink,
  },
  // The 2px pink rule runs the statement's whole height, folded or open.
  statement: {
    marginTop: 0,
    marginBottom: 0,
    borderLeftWidth: 2,
    borderColor: tokens.pink,
    paddingLeft: '1.25rem',
    textAlign: 'left',
  },
  // The statement folds to its first lines by line clamp; open, it is its
  // whole self. The clamp box is what the overflow mount measures against.
  // The statement in the body face at 1.25rem, medium weight, on 1.45 leading, paper at 90%; folded to its first lines by line clamp, open it is its whole self. The clamp box is what the overflow mount measures against.
  statementText: {
    display: '-webkit-box',
    WebkitBoxOrient: 'vertical',
    WebkitLineClamp: 5,
    overflow: 'hidden',
    fontFamily: tokens.fontBody,
    fontSize: '1.25rem',
    fontWeight: 500,
    lineHeight: 1.45,
    textWrap: 'pretty',
    color: 'color-mix(in srgb, var(--color-paper) 90%, transparent)',
  },
  statementTextOpen: {
    display: 'block',
    WebkitLineClamp: 'none',
    overflow: 'visible',
  },
  // THE OPENING MARK at its original size — 6rem of the display face in
  // pink, hanging over the start of the first line. It sits BEFORE the
  // clamp box rather than inside it: a block or a float inside the box
  // broke the line clamp (Slavia's fold showed two lines of five), and ink
  // above the first line would be clipped there anyway. The 0.3 leading
  // collapses its own line to 1.8rem while the glyph paints above the
  // baseline; the negative margin pulls the first line up under its ink, and
  // the quarter-rem hang puts the ink, not the side bearing, on the text edge.
  quoteMark: {
    display: 'block',
    paddingTop: '16px',
    marginBottom: '-0.75rem',
    marginLeft: '-0.25rem',
    fontSize: '6rem',
    lineHeight: 0.3,
    color: tokens.pink,
    userSelect: 'none',
  },
  // The fold control, on the statement's text edge, in the meta voice; a 44px
  // hit area from its own height, with `xs` inset on every side. The margin
  // gives that inset back so the label still starts on the text edge.
  readMore: {
    display: 'inline-flex',
    alignItems: 'center',
    minHeight: '2.75rem',
    paddingInline: spacing.xs,
    paddingBlock: spacing.xs,
    marginLeft: `calc(1.25rem + 2px - ${spacing.xs})`,
    cursor: 'pointer',
    fontSize: type.metaSize,
    letterSpacing: type.metaTracking,
    textTransform: 'uppercase',
    color: {
      default: tokens.muted,
      ':hover': tokens.paper,
    },
    transitionProperty: 'color',
    transitionDuration: '0.15s',
    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
  // The byline, `sm` under the statement: the 56px portrait, then the lockup.
  byline: {
    marginTop: spacing.sm,
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  bylineLockup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  bylineMasthead: {
    display: 'block',
    fontSize: '24px',
    lineHeight: 1,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
    color: tokens.pink,
  },
  bylineLabel: {
    display: 'block',
    fontSize: type.metaSize,
    lineHeight: 1,
    letterSpacing: type.metaTracking,
    color: tokens.muted,
    textTransform: 'uppercase',
  },
  // The photo fills the 56px circle edge to edge, with the 2px pink ring directly on it.
  portrait: {
    display: 'flex',
    height: '56px',
    width: '56px',
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderRadius: '9999px',
    borderWidth: 2,
    borderColor: tokens.pink,
    backgroundColor: tokens.ink,
  },
  portraitImage: {
    height: '100%',
    width: '100%',
    borderRadius: '9999px',
    objectFit: 'cover',
  },
  grainOverlay: {
    pointerEvents: 'none',
    position: 'absolute',
    inset: 0,
  },
  dataBand: {
    marginInline: 'auto',
    width: '100%',
    maxWidth: '64rem',
  },
  // The link out under a competition body, at the row's end like the heading control it echoes.
  sectionFoot: {
    marginTop: '1.25rem',
    display: 'flex',
    justifyContent: 'flex-end',
  },
  cupList: {
    marginTop: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
  },
  tieRow: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: '1rem',
    borderTopWidth: {
      default: 1,
      ':first-child': 0,
    },
    paddingInline: '0.5rem',
    paddingBlock: '0.875rem',
  },
  tieUpcoming: {
    borderColor: tokens.pink,
    backgroundColor: tokens.pink,
    color: tokens.ink,
  },
  tieRest: {
    borderColor: 'color-mix(in srgb, var(--color-ink) 10%, transparent)',
    color: tokens.ink,
  },
  tieRound: {
    fontSize: '1.25rem',
    lineHeight: '1.75rem',
  },
  tieResult: {
    fontSize: '10px',
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
  },
  tieResultUpcoming: {
    color: 'color-mix(in srgb, var(--color-ink) 70%, transparent)',
  },
  tieResultRest: {
    color: 'color-mix(in srgb, var(--color-ink) 50%, transparent)',
  },
  scopeGroup: {
    marginTop: '1.5rem',
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
  },
  scopeOption: {
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
  // Selected is ink on paper, not pink: on this page the pink block belongs to the section heading and the Follow CTA alone, and a pink chip under a pink heading competed with it.
  scopeChecked: {
    borderColor: tokens.ink,
    backgroundColor: tokens.ink,
    color: tokens.paper,
  },
  scopeRest: {
    borderColor: {
      default: 'color-mix(in srgb, var(--color-ink) 20%, transparent)',
      ':hover': tokens.pink,
    },
    color: {
      default: 'color-mix(in srgb, var(--color-ink) 60%, transparent)',
      ':hover': tokens.ink,
    },
  },
  scorersList: {
    marginTop: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
  },
  // A scorer row takes the standings row's geometry — the zone gutter and its hairline as left padding, the same column gap, the same right padding — so rank, name and goals sit on the table's rank, club and points columns. The row is one link; the press is its affordance, so it carries no arrow.
  scorerRow: {
    borderTopWidth: {
      default: 1,
      ':first-child': 0,
    },
    borderColor: 'color-mix(in srgb, var(--color-ink) 10%, transparent)',
  },
  scorerLink: {
    display: 'flex',
    alignItems: 'baseline',
    gap: {
      default: '0.5rem',
      [SM]: '0.75rem',
      [MD]: '1rem',
    },
    paddingLeft: 'calc(1.125rem + 1px)',
    paddingRight: '0.5rem',
    // A 56px row on phones — the card-name and score rungs, which is what a scorer row is; md keeps the board scale.
    paddingBlock: {
      default: '0.75rem',
      [MD]: '1rem',
    },
    textDecorationLine: 'none',
    color: tokens.ink,
    backgroundColor: {
      default: 'transparent',
      ':hover': 'color-mix(in srgb, var(--color-surface) 60%, transparent)',
      ':active': tokens.surface,
    },
    transitionProperty: 'background-color',
    transitionDuration: '0.15s',
    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
  scorerRank: {
    width: {
      default: '1.5rem',
      [MD]: '2rem',
    },
    fontSize: '1.125rem',
    lineHeight: '1.75rem',
    color: 'color-mix(in srgb, var(--color-ink) 35%, transparent)',
  },
  scorerName: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: '0%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontSize: {
      default: '1.125rem',
      [MD]: '1.5rem',
    },
    lineHeight: {
      default: '2rem',
      [MD]: '2rem',
    },
    color: tokens.ink,
  },
  scorerGoals: {
    width: {
      default: '2.5rem',
      [MD]: '3rem',
    },
    textAlign: 'right',
    fontVariantNumeric: 'tabular-nums',
    fontSize: {
      default: '1.5rem',
      [MD]: '2.25rem',
    },
    lineHeight: {
      default: '2rem',
      [MD]: '2.5rem',
    },
    color: tokens.pink,
  },
  scorersFootnote: {
    marginTop: '0.75rem',
    paddingInline: '0.5rem',
    fontSize: '10px',
    letterSpacing: '0.2em',
    color: 'color-mix(in srgb, var(--color-ink) 45%, transparent)',
    textTransform: 'uppercase',
  },
  // Three tiles in one row at every width: the numbers are two or three characters, so a 320px phone holds them side by side and the row costs one tile's height instead of three.
  historyGrid: {
    marginTop: '2rem',
    display: 'grid',
    columnGap: {
      default: '0.75rem',
      [MD]: '2rem',
    },
    rowGap: '2.5rem',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  },
  historyValue: {
    marginTop: '0.75rem',
    fontSize: {
      default: 'clamp(2rem, 9vw, 3rem)',
      [MD]: '3rem',
    },
    lineHeight: {
      default: '2.5rem',
      [MD]: 1,
    },
    color: tokens.ink,
  },
  // The card's pink label, one line on every card so the three meta lines under them align; the labels are authored short for it (club-history.ts).
  historyLabel: {
    marginTop: '0.5rem',
    whiteSpace: 'nowrap',
    fontSize: {
      default: '1.125rem',
      [MD]: '1.5rem',
    },
    lineHeight: {
      default: '1.5rem',
      [MD]: '2rem',
    },
    color: tokens.pink,
  },
  // The card's detail line in the meta rung, never wrapped. The longest full
  // line, "SINCE 2015/16", measures 102px at this tracking; a card is 109px
  // at 390 and 99px at 360, so under 375 the line is the season alone.
  historyDetail: {
    marginTop: '0.375rem',
    fontSize: '10px',
    letterSpacing: '0.25em',
    whiteSpace: 'nowrap',
    color: 'color-mix(in srgb, var(--color-ink) 50%, transparent)',
    textTransform: 'uppercase',
  },
  historyDetailFull: {
    display: {
      default: 'none',
      [CARD_FITS_DETAIL]: 'inline',
    },
  },
  historyDetailShort: {
    display: {
      default: 'inline',
      [CARD_FITS_DETAIL]: 'none',
    },
  },
  // The archive rows: season in the display face, league in the meta voice, the finish at the end.
  archiveList: {
    marginTop: '2.5rem',
    display: 'flex',
    flexDirection: 'column',
  },
  archiveRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '1rem',
    borderTopWidth: {
      default: 1,
      ':first-child': 0,
    },
    borderColor: 'color-mix(in srgb, var(--color-ink) 10%, transparent)',
    paddingInline: '0.5rem',
    paddingBlock: '0.875rem',
    color: tokens.ink,
  },
  archiveSeason: {
    fontSize: '1.25rem',
    lineHeight: '1.75rem',
  },
  archiveLeague: {
    flexGrow: 1,
    fontSize: '10px',
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    color: 'color-mix(in srgb, var(--color-ink) 50%, transparent)',
  },
  // A mark beside a season's league — CUP today, UWCL or DOUBLE tomorrow: a
  // small ink block with paper type in the meta rung, `xs` sides, square.
  // Never underlined: on this platform an underline is a link and nothing else.
  archiveMark: {
    display: 'inline-block',
    marginLeft: spacing.xs,
    paddingInline: spacing.xs,
    paddingBlock: '2px',
    lineHeight: 1.4,
    backgroundColor: tokens.ink,
    color: tokens.paper,
  },
  archivePosition: {
    fontSize: '1.25rem',
    lineHeight: '1.75rem',
  },
  archivePositionTitle: {
    color: tokens.pink,
  },
  statsGrid: {
    marginTop: '2rem',
    display: 'grid',
    columnGap: '2rem',
    rowGap: '2.5rem',
    gridTemplateColumns: {
      default: 'repeat(2, minmax(0, 1fr))',
      [LG]: 'repeat(4, minmax(0, 1fr))',
    },
  },
  statsValue: {
    fontSize: '2.25rem',
    lineHeight: '2.5rem',
    color: tokens.ink,
  },
  statsLabel: {
    marginTop: '0.75rem',
    fontSize: '10px',
    letterSpacing: '0.25em',
    color: 'color-mix(in srgb, var(--color-ink) 50%, transparent)',
    textTransform: 'uppercase',
  },
  // The follow call: `section` from the last row to its hairline, `section`
  // again from the hairline to its headline — one rule for every club, however
  // many rows the archive drew above it.
  follow: {
    marginTop: spacing.section,
    borderTopWidth: 1,
    borderColor: 'color-mix(in srgb, var(--color-ink) 10%, transparent)',
    paddingTop: spacing.section,
    paddingBottom: '1rem',
    textAlign: 'center',
  },
  followTitle: {
    fontSize: {
      default: '1.875rem',
      [MD]: '3rem',
    },
    lineHeight: 1.05,
    color: tokens.ink,
  },
  followSubtitle: {
    marginInline: 'auto',
    marginTop: '1rem',
    maxWidth: '28rem',
    fontSize: '0.875rem',
    lineHeight: 1.625,
    color: 'color-mix(in srgb, var(--color-ink) 50%, transparent)',
  },
  followButton: {
    marginTop: '2rem',
    display: 'inline-block',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    paddingInline: '2.5rem',
    paddingBlock: '1rem',
    fontSize: {
      default: '1.25rem',
      [MD]: '1.5rem',
    },
    lineHeight: {
      default: '1.75rem',
      [MD]: '2rem',
    },
    letterSpacing: '0.12em',
    transitionProperty: 'color, background-color, border-color',
    transitionDuration: '0.15s',
    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
  // The club's links under the Follow button: the domain, then the glyph squares `md` after it, `xs` apart.
  linksRow: {
    marginTop: spacing.lg,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  linksSite: {
    fontSize: '10px',
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    color: tokens.ink,
    textDecorationLine: 'underline',
    textDecorationColor: tokens.pink,
    textDecorationThickness: '2px',
    textUnderlineOffset: '0.25em',
  },
  linksGlyphs: {
    display: 'flex',
    gap: spacing.xs,
  },
  linksGlyph: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '2.75rem',
    width: '2.75rem',
    borderWidth: 1,
    borderColor: {
      default: tokens.hairline,
      ':hover': tokens.pink,
    },
    backgroundColor: {
      default: 'transparent',
      ':active': tokens.surface,
    },
    color: tokens.ink,
    transitionProperty: 'border-color, background-color',
    transitionDuration: '0.15s',
    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
  linksGlyphMark: {
    height: '1.25rem',
    width: '1.25rem',
  },
  // Following: the ink block with paper type and the 2px live-pink stroke
  // along its bottom edge — the same "you are here" cue as the jump row's
  // current chip. Tapping again unfollows; nothing asks.
  followOn: {
    backgroundColor: tokens.ink,
    color: tokens.paper,
    borderBottomWidth: 2,
    borderBottomColor: tokens.pinkLive,
  },
  // The call: the pink block with ink type; pressed, the pink dims to 85%.
  // Focus is the global ring.
  followOff: {
    backgroundColor: {
      default: tokens.pink,
      ':hover': 'color-mix(in srgb, var(--color-pink) 85%, transparent)',
      ':active': 'color-mix(in srgb, var(--color-pink) 85%, transparent)',
    },
    color: tokens.ink,
  },
});

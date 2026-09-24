import * as stylex from '@stylexjs/stylex';

import { spacing, tokens, type } from '../tokens.stylex';

// Styles for the club profile (page/club-profile.ts): the full-bleed dark
// editorial band — the hero's fixed template of photo slot, crest disc, name
// box, honors stack and commentary — and the paper data act's cup run,
// scorer boards, history grid and follow call.

const SM = '@media (min-width: 640px)';
const MD = '@media (min-width: 768px)';
const COMPACT = '@container club-data (width < 16em)';
const LG = '@media (min-width: 1024px)';
// A text-relative threshold: enlarged text gets the same larger slots on every club.
const ENLARGED = '@container club-intro (width < 16em)';
// The width from which a history card holds its full detail line (see historyDetail).
const CARD_FITS_DETAIL = '@media (min-width: 375px)';

// One honor stamp's height: its 1.75rem line plus its vertical padding. The
// honors slot is three of these and the two gaps between them, so a club
// with one honor leaves two stamps' worth of ink empty and nothing under it
// moves.
const STAMP_HEIGHT = { phone: '2.5rem', md: '2.75rem' } as const;

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
    backgroundColor: tokens.ink,
    paddingInline: {
      default: '1.25rem',
      [MD]: '2.5rem',
    },
    paddingTop: '2rem',
    paddingBottom: '24px',
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
  // The fade into the band: clear for the top 55% of the slot, then ink
  // from 98% down, so the crest sits on ink whatever the photo. The ink
  // stop lands BEFORE the edge on purpose: the slot's last rows are solid
  // ink, and the wash's antialiased bottom row and the gradient's own
  // dithered end can never show as a line where the slot meets the band.
  // Measured 2026-09-16 in Chromium: with the stop at 100% every wash club
  // had one row a few pixels above the edge reading lighter than the band.
  heroArtFade: {
    position: 'absolute',
    inset: 0,
    backgroundImage: 'linear-gradient(to bottom, transparent 55%, var(--color-ink) 98%)',
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
    containerType: 'inline-size',
    containerName: 'club-intro',
    fontSize: '1rem',
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
  // under it moves. The name sits on the BOTTOM of the box, so its last line
  // is always `md` above the first stamp whatever the line count, and the
  // spare lines open up between the crest and the name instead. A name that
  // would need a fourth line never reaches the box — heroTitle hands the
  // club's headline form in its place.
  heroName: {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    height: {
      default: '3.06em',
      [MD]: '2.04em',
      [ENLARGED]: '6.12em',
    },
    marginTop: spacing.md,
    // A shared club-hero scale keeps the longest authored names readable.
    fontSize: 'clamp(3.75rem, 17vw, 7rem)',
    lineHeight: 1.02,
    marginInline: 'auto',
    maxWidth: '34rem',
    overflowWrap: 'anywhere',
    wordBreak: 'normal',
    color: tokens.paper,
  },
  // THE HONORS SLOT — three stamps' height for every club, `md` under the
  // name: the block step, so the name and its honors read as one statement.
  // The stack inside starts at the top and a club with fewer honors leaves
  // the rest of the slot empty.
  honorSlot: {
    marginTop: spacing.md,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    height: {
      default: `calc(3 * ${STAMP_HEIGHT.phone} + 2 * ${spacing.xs})`,
      [MD]: `calc(3 * ${STAMP_HEIGHT.md} + 2 * ${spacing.xs})`,
      [ENLARGED]: `calc(3 * 6rem + 2 * ${spacing.xs})`,
    },
  },
  // The stack: a plain list, one stamp per line, centred, `xs` apart — the
  // step that binds marks to what they belong to.
  honorStack: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    maxWidth: '100%',
    gap: spacing.xs,
    margin: 0,
    padding: 0,
  },
  // A stamp: a paper block on the ink, the display face at the subtitle
  // rung, as wide as its own line. STAMP_HEIGHT is this line and padding
  // added up; change one and the other.
  honorStamp: {
    display: 'block',
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
    maxWidth: '100%',
    overflowWrap: 'anywhere',
    textAlign: 'center',
    color: tokens.ink,
    backgroundColor: tokens.paper,
  },
  // THE COMMENTARY — the section step under the honors, twice the block step
  // that binds the honors to the name, so the quote reads as the next
  // statement rather than a fourth line of the honors. Its height is fixed:
  // the slot's lines at the statement's leading (the counts arrive on the
  // element as `--commentary-lines` for a phone and `--commentary-lines-md`
  // from md, set by the view from COMMENTARY_LINES and
  // COMMENTARY_LINES_TABLET — the wider column needs fewer), then the
  // byline's `sm` and its 56px portrait. The quote and its byline sit
  // with the attribution at the bottom of the slot, leaving 24px before
  // the cream section; a club without a statement draws the slot empty at this height,
  // so the paper act starts on one y either way.
  commentary: {
    marginInline: 'auto',
    marginTop: spacing.section,
    maxWidth: '42rem',
    marginBottom: 0,
    height: {
      default: `calc(var(--commentary-lines) * 1.45 * 1.25rem + ${spacing.sm} + 3.5rem)`,
      [MD]: `calc(var(--commentary-lines-md) * 1.45 * 1.25rem + ${spacing.sm} + 3.5rem)`,
      [ENLARGED]: `calc(var(--commentary-lines-enlarged) * 1.45 * 1.25rem + ${spacing.sm} + 7rem)`,
    },
  },
  // The text's own measure, centered inside the figure.
  commentaryColumn: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
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
  // THE STATEMENT — the body face at 1.25rem, medium weight, on 1.45
  // leading, paper at 90%, whole: never clamped, never folded, and as tall
  // as its own text, so the 2px pink rule spans exactly the lines it quotes
  // and never the slot's empty remainder — it is the quote's one mark, and
  // the text edge the byline shares. A statement that would need more lines
  // than the slot holds must be caught by screenshot review; character
  // estimates in club-hero.test.ts are only an early warning.
  statement: {
    marginTop: 0,
    marginBottom: 0,
    borderLeftWidth: 2,
    borderColor: tokens.pink,
    paddingLeft: '1.25rem',
    textAlign: 'left',
    fontFamily: tokens.fontBody,
    fontSize: '1.25rem',
    fontWeight: 500,
    lineHeight: 1.45,
    textWrap: 'pretty',
    overflowWrap: 'anywhere',
    color: 'color-mix(in srgb, var(--color-paper) 90%, transparent)',
  },
  // The byline, `sm` under the statement: the 56px portrait, then the lockup.
  byline: {
    minHeight: '3.5rem',
    flexShrink: 0,
    flexWrap: 'wrap',
    marginTop: spacing.sm,
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  bylineLockup: {
    minWidth: 0,
    maxWidth: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  bylineMasthead: {
    display: 'block',
    fontSize: '1.5rem',
    lineHeight: 1,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    overflowWrap: 'anywhere',
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
    containerType: 'inline-size',
    containerName: 'club-data',
    fontSize: '1rem',
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
  scorerRow: {
    borderTopWidth: {
      default: 1,
      ':first-child': 0,
    },
    borderColor: 'color-mix(in srgb, var(--color-ink) 10%, transparent)',
  },
  scorerLink: {
    display: { default: 'flex', [COMPACT]: 'grid' },
    gridTemplateColumns: { default: null, [COMPACT]: 'minmax(0, 1fr) auto' },
    alignItems: 'baseline',
    gap: {
      default: '0.5rem',
      [SM]: '0.75rem',
      [MD]: '1rem',
    },
    paddingLeft: { default: 'calc(1.125rem + 1px)', [COMPACT]: 0 },
    paddingRight: { default: '0.5rem', [COMPACT]: 0 },
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
    flexShrink: 0,
    width: {
      default: '1.5rem',
      [MD]: '2rem',
    },
    fontSize: '1.125rem',
    lineHeight: '1.75rem',
    color: 'color-mix(in srgb, var(--color-ink) 35%, transparent)',
  },
  scorerName: {
    gridColumn: { default: null, [COMPACT]: '1 / -1' },
    gridRow: { default: null, [COMPACT]: 2 },
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: '0%',
    minWidth: 0,
    overflowWrap: 'anywhere',
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
    gridColumn: { default: null, [COMPACT]: 2 },
    gridRow: { default: null, [COMPACT]: 1 },
    flexShrink: 0,
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
    gridTemplateColumns: { default: 'repeat(3, minmax(0, 1fr))', [COMPACT]: 'minmax(0, 1fr)' },
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
    display: { default: 'flex', [COMPACT]: 'grid' },
    gridTemplateColumns: { default: null, [COMPACT]: 'minmax(0, 1fr) auto' },
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
    gridColumn: { default: null, [COMPACT]: '1 / -1' },
    gridRow: { default: null, [COMPACT]: 2 },
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
      [COMPACT]: 'minmax(0, 1fr)',
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
    whiteSpace: 'normal',
    maxWidth: '100%',
    overflowWrap: 'anywhere',
    paddingInline: { default: '2.5rem', [COMPACT]: '1rem' },
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
    flexWrap: 'wrap',
    maxWidth: '100%',
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
    justifyContent: 'center',
    flexWrap: 'wrap',
    maxWidth: '100%',
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

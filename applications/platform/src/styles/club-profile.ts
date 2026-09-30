import * as stylex from '@stylexjs/stylex';

import { spacing, tokens, type } from '../tokens.stylex';

const SM = '@media (min-width: 640px)';
const MD_QUERY = '(min-width: 768px)';
const MD = `@media ${MD_QUERY}`;
const COMPACT = '@container club-data (width < 16em)';
const LG = '@media (min-width: 1024px)';
// A text-relative threshold: enlarged text gets the same larger budgets on every club.
const ENLARGED = '@container club-intro (width < 16em)';
// The width from which a history card holds its full detail line (see historyDetail).
const CARD_FITS_DETAIL = '@media (min-width: 375px)';

// The crest's box, which is also the crest slot's height.
const CREST_SIZE = { phone: '9rem', md: '12rem' } as const;

// The one gap the intro's three blocks are set apart by: crest to achievements, achievements to quote.
const INTRO_GAP = spacing.lg;

// The photo slot's shape on a phone, and its height from md, where it runs edge to edge at a fixed height instead.
const HERO_ART_ASPECT = { width: 4, height: 3 } as const;
const HERO_ART_MD_HEIGHT_REM = 34;

// The photoless wash, in percent: the club colour's strength at the corner, the strength it still holds a third of the way along the diagonal, and how far along the diagonal it is gone. The hold is what keeps a dark kit colour (maroon, navy) reading as colour: faded in a straight line it spends most of the slot in its darkest stretch, which reads black.
const WASH_ORIGIN_STRENGTH = 70;
const WASH_HOLD_STRENGTH = 50;
const WASH_HOLD_AT = 35;
const WASH_REACH = 75;

// The watermark, in percent: its height against the slot's, the share of its own width cropped off the slot's right edge, and where its vertical center sits in the slot. Then the opacity its emboss is blended at.
const WATERMARK_SCALE = 125;
const WATERMARK_CROP = 30;
const WATERMARK_CENTER = 42;
const WATERMARK_OPACITY = 0.22;

/**
 * The width the hero photo is drawn at: the photo slot runs edge to edge at every width.
 */
export const HERO_ART_SIZES = '100vw';

/**
 * The width the photoless hero's watermark is drawn at, taken as its height, which crests roughly
 * match: WATERMARK_SCALE percent of the slot's height.
 */
export const WATERMARK_SIZES = `${MD_QUERY} ${(WATERMARK_SCALE / 100) * HERO_ART_MD_HEIGHT_REM}rem, ${
  (WATERMARK_SCALE * HERO_ART_ASPECT.height) / HERO_ART_ASPECT.width
}vw`;

/**
 * The width the hero crest is drawn at, in the `sizes` syntax.
 */
export const CREST_SIZES = `${MD_QUERY} ${CREST_SIZE.md}, ${CREST_SIZE.phone}`;

// One achievement stamp's height: its line plus its vertical padding, which is also the achievements row's height.
const STAMP_HEIGHT = { phone: '2rem', md: '2.75rem' } as const;

// The statement's size and leading, which set one line of the commentary budget.
const STATEMENT_SIZE = '1.25rem';
const STATEMENT_LEADING = 1.45;

// The byline's height: the 56px portrait, or the portrait over the wrapped lockup when text is enlarged.
const BYLINE_HEIGHT = { default: '3.5rem', enlarged: '7rem' } as const;

export const styles = stylex.create({
  // The dark act — flows straight out of the header chrome, full-bleed via the 50%-50vw margin trick. Closes `lg` under the intro — the last fixed gap of the template before the paper act.
  // The identity bar, pinned under the header for the whole profile, so the way back and the club's name are one tap away at any depth. It sits at the page level rather than in the band, since a sticky element only sticks within its parent; full-bleed like the band, straight out of the header chrome, above the page's content and below the header, its pinned jump row and every overlay.
  identityBar: {
    position: 'sticky',
    top: 'var(--header-height)',
    zIndex: 45,
    marginTop: {
      default: '-2.5rem',
      [MD]: '-3.5rem',
    },
    marginInline: 'calc(50% - 50vw)',
    paddingInline: {
      default: '1.25rem',
      [MD]: '2.5rem',
    },
  },
  darkBand: {
    position: 'relative',
    marginInline: 'calc(50% - 50vw)',
    backgroundColor: tokens.ink,
    paddingInline: {
      default: '1.25rem',
      [MD]: '2.5rem',
    },
    paddingBottom: '24px',
  },
  // THE PHOTO SLOT — 4:3 on a phone, whatever the photo: 270px tall at 360 wide. One height for every club on a given device, so the crest and the paper act land on the same y for all of them. The wrapper cancels the band's padding so the photo runs edge to edge; the parallax drift is the club-hero-art contract.
  heroArt: {
    position: 'relative',
    marginInline: {
      default: '-1.25rem',
      [MD]: '-2.5rem',
    },
    aspectRatio: {
      default: `${HERO_ART_ASPECT.width} / ${HERO_ART_ASPECT.height}`,
      [MD]: 'auto',
    },
    height: {
      default: 'auto',
      [MD]: `${HERO_ART_MD_HEIGHT_REM}rem`,
    },
    overflow: 'hidden',
    willChange: 'transform',
  },
  // A club without a photo keeps the slot at its full height, drawn in the club's colour: a radial wash of it from the top-right corner over ink. The colour arrives on the element as `--club-color`. Interim: every club is to get a hero photo, and the wash and its watermark go with the last one.
  heroArtWashed: {
    // Its own stacking context: the watermark's blend composites against this slot's wash alone and never reaches the page under it.
    isolation: 'isolate',
    backgroundColor: tokens.ink,
    backgroundImage: `radial-gradient(circle farthest-corner at 100% 0%, color-mix(in srgb, var(--club-color) ${WASH_ORIGIN_STRENGTH}%, transparent), color-mix(in srgb, var(--club-color) ${WASH_HOLD_STRENGTH}%, transparent) ${WASH_HOLD_AT}%, transparent ${WASH_REACH}%)`,
  },
  // The crest as a tone-on-tone emboss in the club colour: grayscale, blended over the wash so its lights lift the colour and its darks deepen it, whole enough to read as the club and quiet enough never to rival the real crest. It sits high, above most of the fade, and runs off the right edge.
  heroWatermark: {
    position: 'absolute',
    top: `${WATERMARK_CENTER}%`,
    right: 0,
    height: `${WATERMARK_SCALE}%`,
    width: 'auto',
    // The reset caps every img at its container; this one has to run past it.
    maxWidth: 'none',
    transform: `translate(${WATERMARK_CROP}%, -50%)`,
    filter: 'grayscale(1) contrast(1.1)',
    mixBlendMode: 'soft-light',
    opacity: WATERMARK_OPACITY,
  },
  // The photo fills the slot; where its faces are is the club's own focal point, written inline as object-position.
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
  // THE INTRO — everything under the photo slot, at one height for every club on a given device, so the paper act starts on one y for all of them. The height is the worst case added up: the crest slot, INTRO_GAP, the achievements row, INTRO_GAP again, and the commentary at its line budget with its byline; whatever a club leaves unused stays at the bottom. The commentary budgets arrive on the element from the constants in club-hero.ts (`--commentary-lines*`), and each term resolves per viewport on its own, so enlarged text on a wide screen still counts the wide crest.
  // The crest slot is centered on the photo's bottom edge — half over the art, half over the band — so the pull-up is exactly half the slot.
  intro: {
    '--intro-crest': {
      default: CREST_SIZE.phone,
      [MD]: CREST_SIZE.md,
    },
    '--intro-stamp': {
      default: STAMP_HEIGHT.phone,
      [MD]: STAMP_HEIGHT.md,
    },
    '--intro-voice': {
      default: `calc(var(--commentary-lines) * ${STATEMENT_LEADING} * ${STATEMENT_SIZE} + ${spacing.sm} + ${BYLINE_HEIGHT.default})`,
      [MD]: `calc(var(--commentary-lines-md) * ${STATEMENT_LEADING} * ${STATEMENT_SIZE} + ${spacing.sm} + ${BYLINE_HEIGHT.default})`,
      [ENLARGED]: `calc(var(--commentary-lines-enlarged) * ${STATEMENT_LEADING} * ${STATEMENT_SIZE} + ${spacing.sm} + ${BYLINE_HEIGHT.enlarged})`,
    },
    height: `calc(var(--intro-crest) + ${INTRO_GAP} + var(--intro-stamp) + ${INTRO_GAP} + var(--intro-voice))`,
    marginTop: {
      default: `calc(${CREST_SIZE.phone} / -2)`,
      [MD]: `calc(${CREST_SIZE.md} / -2)`,
    },
  },
  // THE IDENTITY GROUP — the crest, and the achievements row under it.
  hero: {
    textAlign: 'center',
  },
  // THE CREST SLOT — the crest bare inside it at the slot's full size. No disc and no ground: every crest asset is transparent (crest-assets.test.ts holds that line), so it sits on the photo's fade or on the wash directly.
  crestSlot: {
    marginInline: 'auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: {
      default: CREST_SIZE.phone,
      [MD]: CREST_SIZE.md,
    },
  },
  crest: {
    height: {
      default: CREST_SIZE.phone,
      [MD]: CREST_SIZE.md,
    },
    width: {
      default: CREST_SIZE.phone,
      [MD]: CREST_SIZE.md,
    },
    objectFit: 'contain',
  },
  // THE ACHIEVEMENTS ROW — one centered line of stamps, `xs` apart, one stamp tall. It never wraps: a stamp that would not fit is not drawn, by the caps below.
  achievementsRow: {
    display: 'flex',
    flexWrap: 'nowrap',
    justifyContent: 'center',
    gap: spacing.xs,
    height: {
      default: STAMP_HEIGHT.phone,
      [MD]: STAMP_HEIGHT.md,
    },
    // Measured from the crest's box. A crest whose bottom edge is a dark outline reads up to 3.5px farther away on the ink, which does not show at this scale.
    marginTop: INTRO_GAP,
    marginBottom: 0,
    padding: 0,
  },
  // A stamp: a paper block on the ink in the display face, as wide as its own line. STAMP_HEIGHT is this line and padding added up; change one and the other.
  achievementStamp: {
    display: 'block',
    flexShrink: 0,
    paddingInline: {
      default: '0.625rem',
      [MD]: '0.875rem',
    },
    paddingBlock: {
      default: '0.25rem',
      [MD]: '0.5rem',
    },
    fontSize: {
      default: '1rem',
      [MD]: '1.25rem',
    },
    lineHeight: {
      default: '1.5rem',
      [MD]: '1.75rem',
    },
    letterSpacing: type.subtitleTracking,
    whiteSpace: 'nowrap',
    color: tokens.ink,
    backgroundColor: tokens.paper,
  },
  // The stamp caps, from the widest possible row in the display face's own advances with two-digit counts. Enlarged text holds one stamp: the widest single stamp is about half the 16em column.
  achievementBeyondFirst: {
    display: {
      default: 'block',
      [ENLARGED]: 'none',
    },
  },
  // A stamp past the club's phone count, which phoneStampCount estimates. The widest possible row of three takes 398px, so every row of three first fits the column at the 640px breakpoint.
  achievementPastPhoneCount: {
    display: {
      default: 'none',
      [SM]: 'block',
      [ENLARGED]: 'none',
    },
  },
  // THE VOICE GROUP — the quote with its byline directly under it, on the text's own measure. The quote's pink rule spans its line box, so this margin is the visible gap.
  commentary: {
    marginTop: INTRO_GAP,
    marginBottom: 0,
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
  // THE STATEMENT — the body face, medium weight, paper at 90%, whole: never clamped, never folded, and as tall as its own text, so the 2px pink rule spans exactly the lines it quotes — it is the quote's one mark, and the text edge the byline shares. A statement that would need more lines than the budget holds must be caught by screenshot review; character estimates in club-hero.test.ts are only an early warning.
  statement: {
    marginTop: 0,
    marginBottom: 0,
    borderLeftWidth: 2,
    borderColor: tokens.pink,
    paddingLeft: '1.25rem',
    textAlign: 'left',
    fontFamily: tokens.fontBody,
    fontSize: STATEMENT_SIZE,
    fontWeight: 500,
    lineHeight: STATEMENT_LEADING,
    textWrap: 'pretty',
    overflowWrap: 'anywhere',
    color: 'color-mix(in srgb, var(--color-paper) 90%, transparent)',
  },
  // The byline, `sm` under the statement: the 56px portrait, then the lockup.
  byline: {
    minHeight: BYLINE_HEIGHT.default,
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
    // The 28px masthead, this gap and the 11px label stack to 45px, centered on the 56px portrait.
    gap: '6px',
  },
  bylineMasthead: {
    display: 'block',
    fontSize: '1.75rem',
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
    fontSize: type.metaSize,
    letterSpacing: type.metaTracking,
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
    fontSize: type.metaSize,
    letterSpacing: type.metaTracking,
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
    fontSize: type.metaSize,
    letterSpacing: type.metaTracking,
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
    fontSize: type.metaSize,
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
    fontSize: type.metaSize,
    letterSpacing: type.metaTracking,
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
    fontSize: type.metaSize,
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
    fontSize: type.metaSize,
    letterSpacing: type.metaTracking,
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

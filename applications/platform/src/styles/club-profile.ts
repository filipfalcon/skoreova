import * as stylex from '@stylexjs/stylex';

import { spacing, tokens } from '../tokens.stylex';

// Styles for the club profile (page/club-profile.ts): the full-bleed dark
// editorial band — hero artwork, crest and name, honors, commentary — and
// the paper data act's cup run, scorer boards, history grid and follow call.

const SM = '@media (min-width: 640px)';
const MD = '@media (min-width: 768px)';
const LG = '@media (min-width: 1024px)';

export const styles = stylex.create({
  // The dark act — flows straight out of the header chrome, full-bleed via
  // the 50%-50vw margin trick.
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
    // The band closes 16px under the byline, so with the jump row's own `lg` the next section starts 40px after it.
    paddingBottom: '1rem',
  },
  // The hero artwork wrapper — cancels the band's padding so the photo
  // runs edge to edge; the parallax drift is the club-hero-art contract.
  heroArt: {
    position: 'relative',
    marginInline: {
      default: '-1.25rem',
      [MD]: '-2.5rem',
    },
    marginTop: '-2rem',
    // Phones size the band by the viewport: well under half a screen, so the name is on the first paint, never under 18rem and never past 24rem. The photo is the reward for having one; clubs without art take the plain crest-on-ink hero instead and do not imitate this height.
    height: {
      default: 'clamp(18rem, 40vh, 24rem)',
      [MD]: '34rem',
    },
    overflow: 'hidden',
    willChange: 'transform',
  },
  // Phones zoom the artwork a little. The band is taller than it is wide on a phone, so cover already crops a 16:9 photo to under half its width around the focus point; the zoom that a wide 22rem band needed to keep the players from shrinking to specks (1.45) is now mostly redundant, and a touch remains for the squarer photos.
  // The crest wash for a club without a photo: the lifted ink behind, the crest itself blown up, blurred and faint over it.
  heroArtWashed: {
    backgroundColor: tokens.inkLift,
  },
  heroWashImage: {
    position: 'absolute',
    inset: 0,
    height: '100%',
    width: '100%',
    objectFit: 'contain',
    transform: 'scale(2.4)',
    filter: 'blur(28px) saturate(1.2)',
    opacity: 0.22,
  },
  // The surface under the crest on a club without a photo: a faint band of the club's colour along the art's bottom edge — the y where a photo ends on the other clubs.
  heroWashBand: {
    position: 'absolute',
    insetInline: 0,
    bottom: 0,
    height: '3rem',
    backgroundColor: 'color-mix(in srgb, var(--club-color) 18%, transparent)',
  },
  heroArtImage: {
    position: 'absolute',
    inset: 0,
    height: '100%',
    width: '100%',
    transform: {
      default: 'scale(1.2)',
      [MD]: 'scale(1)',
    },
    objectFit: 'cover',
  },
  // A short ink fade at the band's top keeps the back link legible over any photo.
  heroArtTopFade: {
    position: 'absolute',
    insetInline: 0,
    top: 0,
    height: '4rem',
    backgroundImage: 'linear-gradient(to bottom, var(--color-ink), transparent)',
  },
  heroArtFade: {
    position: 'absolute',
    insetInline: 0,
    bottom: 0,
    height: {
      default: '8rem',
      [MD]: '12rem',
    },
    backgroundImage:
      'linear-gradient(to top, var(--color-ink), color-mix(in srgb, var(--color-ink) 60%, transparent), transparent)',
  },
  // Just under the header, not in the photo. The band's top IS the header's bottom edge — the band's negative top margin only cancels the shell's padding, it never rides under the header — so the link starts 1rem into the band, on the band's own padding.
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
  // The crest rides up into the band's fade — three quarters of it on the art on a phone — for every club alike.
  hero: {
    position: 'relative',
    marginTop: {
      default: '-7.5rem',
      [MD]: '-11rem',
    },
    textAlign: 'center',
  },
  // Phones get a crest closer to the md size than to a list-row badge: the hero is the bang, and at 8rem it read as a thumbnail.
  crest: {
    marginInline: 'auto',
    height: {
      default: '10rem',
      [MD]: '13rem',
    },
    width: {
      default: '10rem',
      [MD]: '13rem',
    },
    objectFit: 'contain',
    filter: 'drop-shadow(0 25px 25px rgb(0 0 0 / 0.15))',
  },
  heroName: {
    // Crest and name are one block: a fixed `sm` from the crest's bottom to the name's top, and the block as a whole is placed against the band's bottom edge by the crest's overlap. The box is two lines at the 1.02 leading whatever the clamp resolves to, so a one-word name leaves its spare line below and nothing under it moves.
    height: '2.04em',
    marginTop: {
      default: spacing.sm,
      [MD]: '2rem',
    },
    // One constant per breakpoint, no fit-to-length and no viewport clamp: the 390px value (4.625rem) on phones, 9rem from md up. The box is the commentary column's measure, centred. LOKOMOTIVA (334.8px at this size) overflows the column below 355px — reported, not scaled.
    fontSize: {
      default: '4.625rem',
      [MD]: '9rem',
    },
    lineHeight: 1.02,
    marginInline: 'auto',
    maxWidth: {
      default: '30rem',
      [MD]: '34rem',
    },
    color: tokens.paper,
  },
  // The honours slot: one chip's height plus its margin, the same for every club; a club without honours shows its competition and season in the same chip.
  honorSlot: {
    marginTop: {
      default: '1.5rem',
      [MD]: '1.75rem',
    },
    height: {
      default: '2.5rem',
      [MD]: '2.75rem',
    },
  },
  // The rolling honors chip — all the lines stack in one grid cell, so the
  // chip's width is the WIDEST of them and never jumps as the text changes.
  honorRoll: {
    marginInline: 'auto',
    display: 'grid',
    width: 'fit-content',
    overflow: 'hidden',
    backgroundColor: tokens.paper,
    paddingInline: {
      default: '0.75rem',
      [MD]: '0.875rem',
    },
    paddingBlock: {
      default: '0.375rem',
      [MD]: '0.5rem',
    },
    fontSize: {
      default: '1.125rem',
      [MD]: '1.25rem',
    },
    lineHeight: '1.75rem',
    letterSpacing: '0.12em',
    color: tokens.ink,
  },
  honorLine: {
    gridColumnStart: 1,
    gridRowStart: 1,
    textAlign: 'center',
    whiteSpace: 'nowrap',
  },
  // THE COMMENTARY BLOCK — the quote `lg` under the honours slot, the whole statement always shown, then the signature row under its last line.
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
  statement: {
    marginTop: 0,
    marginBottom: 0,
    fontSize: '1.25rem',
    lineHeight: 1.625,
    fontWeight: 500,
    textWrap: 'pretty',
    color: 'color-mix(in srgb, var(--color-paper) 90%, transparent)',
  },
  // The pink rule and the padding ride the inner element, so the rule runs from the mark to the last line — and 8px past it, so it ends 12px above the avatar that continues the same vertical gesture.
  quoteInner: {
    borderLeftWidth: 2,
    borderColor: tokens.pink,
    paddingLeft: '1.25rem',
    paddingBottom: '8px',
    textAlign: 'left',
  },
  // The mark on its own line: the 0.3 leading collapses its box to 1.8rem while the glyph paints above the baseline; the negative margin pulls the text up under its ink, leaving the line 1.05rem tall. The top padding keeps the glyph's ink 12px clear of the honours chip above (measured: the ink starts 4px into the padding).
  quoteMark: {
    paddingTop: '16px',
    marginBottom: '-0.75rem',
    marginLeft: '-0.25rem',
    display: 'block',
    fontSize: '6rem',
    lineHeight: 0.3,
    color: tokens.pink,
    userSelect: 'none',
  },
  statementText: {
    display: 'block',
  },
  // The signature row, 20px under the quote's last line (12px under the rule's end) and on the rule's own left edge: the 56px portrait, then the lockup centred to it.
  byline: {
    marginTop: '12px',
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
    fontSize: '12px',
    lineHeight: 1,
    letterSpacing: '0.2em',
    color: 'color-mix(in srgb, var(--color-paper) 60%, transparent)',
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
  // A scorer row takes the standings row's geometry — the zone gutter and its hairline as left padding, the same column gap, the same right padding — so rank, name and goals sit on the table's rank, club and points columns.
  scorerRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: {
      default: '0.5rem',
      [SM]: '0.75rem',
      [MD]: '1rem',
    },
    borderTopWidth: {
      default: 1,
      ':first-child': 0,
    },
    borderColor: 'color-mix(in srgb, var(--color-ink) 10%, transparent)',
    paddingLeft: 'calc(1.125rem + 1px)',
    paddingRight: '0.5rem',
    // A 56px row on phones — the card-name and score rungs, which is what a scorer row is; md keeps the board scale.
    paddingBlock: {
      default: '0.75rem',
      [MD]: '1rem',
    },
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
  historyLabel: {
    marginTop: '0.5rem',
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
  historyDetail: {
    marginTop: '0.375rem',
    fontSize: '10px',
    letterSpacing: '0.25em',
    color: 'color-mix(in srgb, var(--color-ink) 50%, transparent)',
    textTransform: 'uppercase',
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
  // The cup tag beside a season's league: the same meta voice in ink, underlined in the brand's pink.
  archiveCup: {
    marginLeft: spacing.xs,
    color: tokens.ink,
    textDecorationLine: 'underline',
    textDecorationColor: tokens.pink,
    textDecorationThickness: '2px',
    textUnderlineOffset: '0.2em',
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
  follow: {
    marginTop: {
      default: '5rem',
      [MD]: '6rem',
    },
    borderTopWidth: 1,
    borderColor: 'color-mix(in srgb, var(--color-ink) 10%, transparent)',
    paddingTop: '3.5rem',
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
    color: tokens.ink,
    transitionProperty: 'border-color',
    transitionDuration: '0.15s',
    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
  linksGlyphMark: {
    height: '1.25rem',
    width: '1.25rem',
  },
  followOn: {
    backgroundColor: tokens.ink,
    color: tokens.paper,
  },
  followOff: {
    backgroundColor: {
      default: tokens.pink,
      ':hover': tokens.ink,
    },
    color: {
      default: tokens.ink,
      ':hover': tokens.paper,
    },
  },
});

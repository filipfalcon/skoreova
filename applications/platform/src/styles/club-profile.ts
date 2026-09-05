import * as stylex from '@stylexjs/stylex';

import { spacing, tokens } from '../tokens.stylex';

// Styles for the club profile (page/club-profile.ts): the full-bleed dark
// editorial band — hero artwork, crest and name, honors, commentary — and
// the paper data act's cup run, scorer boards, history grid and follow call.

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
    // The band closes one `lg` under the sign-off at every width.
    paddingBottom: spacing.lg,
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
    // The phone size tracks the width the band leaves after its padding, sized so the widest club word (LOKOMOTIVA, 4.53em in Anton at this tracking) still fits on one line at every width down to 320px. Capped at 9rem from md up, where every name fits.
    fontSize: 'clamp(3.75rem, 21vw - 0.5rem, 9rem)',
    lineHeight: 1.02,
    color: tokens.paper,
  },
  // The honours slot: one chip's height plus its margin, reserved for every club, empty for one without honours.
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
  // The reduced-motion row of chips. NO display here: the honor-static
  // contract in styles.css owns it (none at rest, flex under reduced
  // motion), and a compiled display would fight that swap.
  honorStatic: {
    marginInline: 'auto',
    width: 'fit-content',
    maxWidth: '100%',
    flexWrap: 'nowrap',
    overflowX: 'auto',
    alignItems: 'center',
    gap: {
      default: '0.5rem',
      [MD]: '0.75rem',
    },
  },
  honorChip: {
    flexShrink: 0,
    whiteSpace: 'nowrap',
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
  // THE COMMENTARY BLOCK — one template for every club, top to bottom: the opener rule one `lg` under the honours slot, the byline row `sm` under it, the statement `md` under that in a four-line box, then the reserved fold-control row. Every height here is fixed, so the band ends at the same y on every profile.
  commentary: {
    marginTop: spacing.lg,
    marginInline: 0,
    maxWidth: '40rem',
  },
  // The opener rule — the History tiles' tick, one element shared by both.
  pinkRule: {
    height: '3px',
    width: '2.5rem',
    backgroundColor: tokens.pink,
  },
  byline: {
    marginTop: spacing.sm,
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
    height: '4rem',
  },
  portrait: {
    display: 'flex',
    height: '4rem',
    width: '4rem',
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderRadius: '9999px',
    borderWidth: 2,
    borderColor: tokens.pink,
    backgroundColor: tokens.panel,
  },
  portraitImage: {
    height: '100%',
    width: '100%',
    objectFit: 'cover',
  },
  bylineText: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  bylineName: {
    fontSize: '1.625rem',
    lineHeight: 1,
    letterSpacing: '0.12em',
    color: tokens.pink,
  },
  bylineLabel: {
    marginTop: '0.25rem',
    fontSize: '12px',
    lineHeight: '1.125rem',
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    color: tokens.paper,
  },
  // The statement on the band's padding, the same left edge as the portrait.
  statement: {
    marginTop: spacing.md,
    marginBottom: 0,
    fontSize: '1.25rem',
    lineHeight: 1.625,
    fontWeight: 500,
    textWrap: 'pretty',
    color: tokens.paper,
  },
  // The opening mark, inline before the first word at twice the text size. Zero leading so the glyph does not push the first line open, and lowered by 0.4em of its own size: a quotation mark's ink sits at cap height, which at this size is above the first line's top edge, where the four-line box clips it.
  statementMark: {
    position: 'relative',
    top: '0.4em',
    fontSize: '2.5rem',
    lineHeight: 0,
    color: tokens.pink,
    userSelect: 'none',
  },
  statementText: {
    display: 'block',
  },
  // A four-line box at every width: the statement is clipped to it and a short one leaves its lines empty, so the band ends at the same y for every club. Whether the box clips anything is measured off the element (see ObserveQuoteOverflow).
  quoteFolded: {
    display: '-webkit-box',
    WebkitBoxOrient: 'vertical',
    WebkitLineClamp: 4,
    height: 'calc(4 * 1.625em)',
    overflow: 'hidden',
  },
  // The reserved row under the statement box, always 24px, with the fold control at its left when anything is clipped; hidden rather than removed otherwise.
  moreRow: {
    marginTop: spacing.xs,
    height: '1.5rem',
  },
  quoteMore: {
    display: 'inline-flex',
    alignItems: 'center',
    height: '1.5rem',
    cursor: 'pointer',
    fontSize: '10px',
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    color: {
      default: 'color-mix(in srgb, var(--color-paper) 70%, transparent)',
      ':hover': tokens.paper,
    },
  },
  quoteMoreHidden: {
    visibility: 'hidden',
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
  scorerRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '1.25rem',
    borderTopWidth: {
      default: 1,
      ':first-child': 0,
    },
    borderColor: 'color-mix(in srgb, var(--color-ink) 10%, transparent)',
    paddingInline: '0.5rem',
    // A 56px row on phones — the card-name and score rungs, which is what a scorer row is; md keeps the board scale.
    paddingBlock: {
      default: '0.75rem',
      [MD]: '1rem',
    },
  },
  scorerRank: {
    width: '2rem',
    fontSize: {
      default: '0.625rem',
      [MD]: '1.125rem',
    },
    letterSpacing: {
      default: '0.2em',
      [MD]: 0,
    },
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

import * as stylex from '@stylexjs/stylex';

import { tokens } from '../tokens.stylex';

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
    paddingBottom: {
      default: '4rem',
      [MD]: '5rem',
    },
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
  heroArtFade: {
    position: 'absolute',
    insetInline: 0,
    bottom: 0,
    height: '12rem',
    backgroundImage:
      'linear-gradient(to top, var(--color-ink), color-mix(in srgb, var(--color-ink) 60%, transparent), transparent)',
  },
  backLinkOnArt: {
    position: 'absolute',
    top: '1.25rem',
    left: {
      default: '1.25rem',
      [MD]: '2.5rem',
    },
    zIndex: 10,
    fontSize: '10px',
    letterSpacing: '0.2em',
    color: {
      default: 'color-mix(in srgb, var(--color-paper) 70%, transparent)',
      ':hover': tokens.pink,
    },
    textTransform: 'uppercase',
    transitionProperty: 'color, background-color, border-color',
    transitionDuration: '0.15s',
    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
  heroColumn: {
    position: 'relative',
    zIndex: 10,
    marginInline: 'auto',
    width: '100%',
    maxWidth: '64rem',
  },
  // The badge and name pull UP into the photo's fade — the band only
  // renders when artwork exists, so there is no plain variant here.
  hero: {
    position: 'relative',
    marginTop: {
      default: '-8rem',
      [MD]: '-11rem',
    },
    textAlign: 'center',
  },
  heroBadge: {
    marginInline: 'auto',
    height: {
      default: '8rem',
      [MD]: '13rem',
    },
    width: {
      default: '8rem',
      [MD]: '13rem',
    },
    objectFit: 'contain',
    filter: 'drop-shadow(0 25px 25px rgb(0 0 0 / 0.15))',
  },
  heroName: {
    marginTop: {
      default: '1.5rem',
      [MD]: '2rem',
    },
    fontSize: 'clamp(3.75rem, 17vw, 9rem)',
    lineHeight: 0.95,
    color: tokens.paper,
  },
  heroChips: {
    marginTop: {
      default: '1.5rem',
      [MD]: '1.75rem',
    },
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
  },
  // The muted chip re-inked for the dark surface — same anatomy as
  // mutedChip below, paper tints instead of ink.
  heroStageChip: {
    display: 'inline-block',
    borderWidth: 1,
    borderColor: 'color-mix(in srgb, var(--color-paper) 25%, transparent)',
    paddingInline: '0.75rem',
    paddingBlock: '0.375rem',
    fontSize: '10px',
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    color: 'color-mix(in srgb, var(--color-paper) 60%, transparent)',
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
  timeline: {
    marginInline: 'auto',
    marginTop: {
      default: '1.5rem',
      [MD]: '1.75rem',
    },
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
  timelinePieceRest: {
    backgroundColor: 'color-mix(in srgb, var(--color-paper) 15%, transparent)',
  },
  timelineLabels: {
    marginTop: '0.5rem',
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
    fontSize: '10px',
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
  },
  timelineLabelActive: {
    color: tokens.pink,
  },
  timelineLabelRest: {
    color: 'color-mix(in srgb, var(--color-paper) 50%, transparent)',
  },
  backLink: {
    display: 'inline-block',
    fontSize: '10px',
    letterSpacing: '0.25em',
    textTransform: 'uppercase',
    color: {
      default: 'color-mix(in srgb, var(--color-ink) 40%, transparent)',
      ':hover': tokens.pink,
    },
    transitionProperty: 'color, background-color, border-color',
    transitionDuration: '0.15s',
    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
  headerRow: {
    marginTop: '2rem',
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: {
      default: '1.5rem',
      [MD]: '2rem',
    },
  },
  badge: {
    height: {
      default: '6rem',
      [MD]: '8rem',
    },
    width: {
      default: '6rem',
      [MD]: '8rem',
    },
    objectFit: 'contain',
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
  standingsRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '1rem',
    borderTopWidth: {
      default: 1,
      ':first-child': 0,
    },
    paddingInline: '0.5rem',
    paddingBlock: '0.875rem',
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
    width: '2rem',
    fontSize: '1.125rem',
    lineHeight: '1.75rem',
  },
  standingsRankHighlighted: {
    color: 'color-mix(in srgb, var(--color-ink) 60%, transparent)',
  },
  standingsRankRest: {
    color: 'color-mix(in srgb, var(--color-ink) 30%, transparent)',
  },
  standingsTeam: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: '0%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontSize: '1.25rem',
    lineHeight: '1.75rem',
  },
  standingsPlayed: {
    display: {
      default: 'none',
      [SM]: 'block',
    },
    fontSize: '10px',
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
  },
  standingsPlayedHighlighted: {
    color: 'color-mix(in srgb, var(--color-ink) 60%, transparent)',
  },
  standingsPlayedRest: {
    color: 'color-mix(in srgb, var(--color-ink) 40%, transparent)',
  },
  standingsPoints: {
    width: '3rem',
    textAlign: 'right',
    fontSize: '1.25rem',
    lineHeight: '1.75rem',
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
    paddingInline: '0.5rem',
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
  editionGroup: {
    marginTop: '2rem',
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

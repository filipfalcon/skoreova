import * as stylex from '@stylexjs/stylex';

import { spacing, tokens } from '../tokens.stylex';

// Styles for the club profile's LAST/UPCOMING match cards (club-matches.ts).

const MD = '@media (min-width: 768px)';

export const styles = stylex.create({
  crestCell: {
    display: 'flex',
    minWidth: 0,
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: '0%',
    justifyContent: 'center',
  },
  crestFallback: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    textAlign: 'center',
    fontSize: {
      default: '0.875rem',
      [MD]: '1rem',
    },
    lineHeight: {
      default: '1.25rem',
      [MD]: '1.5rem',
    },
    color: tokens.ink,
  },
  crestImage: {
    height: {
      default: '5rem',
      [MD]: '6rem',
    },
    width: {
      default: '5rem',
      [MD]: '6rem',
    },
    objectFit: 'contain',
  },
  score: {
    position: 'relative',
    zIndex: 10,
    marginInline: {
      default: '-0.5rem',
      [MD]: '-1rem',
    },
    display: 'flex',
    flexShrink: 0,
    alignItems: 'baseline',
  },
  scoreNumeral: {
    fontSize: {
      default: '3.75rem',
      [MD]: '4.5rem',
    },
    lineHeight: 1,
    fontVariantNumeric: 'tabular-nums',
    color: tokens.ink,
  },
  scoreColon: {
    paddingInline: {
      default: '0.25rem',
      [MD]: '0.375rem',
    },
    fontSize: {
      default: '3.75rem',
      [MD]: '4.5rem',
    },
    lineHeight: 1,
    color: tokens.pink,
  },
  versus: {
    position: 'relative',
    zIndex: 10,
    flexShrink: 0,
    backgroundColor: tokens.pink,
    paddingInline: {
      default: '0.875rem',
      [MD]: '1rem',
    },
    paddingBlock: {
      default: '0.375rem',
      [MD]: '0.5rem',
    },
    fontSize: {
      default: '1.25rem',
      [MD]: '1.5rem',
    },
    lineHeight: 1,
    color: tokens.ink,
  },
  // A link: ink text, no underline, and the frame answers the hover.
  card: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    color: tokens.ink,
    textDecoration: 'none',
    borderWidth: 1,
    borderColor: {
      default: 'color-mix(in srgb, var(--color-ink) 15%, transparent)',
      ':hover': tokens.pink,
    },
    transitionProperty: 'border-color',
    transitionDuration: '0.15s',
    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
  // THE FIXTURE — crests at hero scale with the scoreline between them.
  // Capped and centered: on a full-width card the two crests would
  // otherwise sit at opposite edges with the score marooned between them,
  // and they stop reading as one fixture.
  fixtureRow: {
    marginInline: 'auto',
    display: 'flex',
    width: '100%',
    maxWidth: '28rem',
    alignItems: 'center',
    gap: {
      default: '0.75rem',
      [MD]: '1.25rem',
    },
    paddingInline: {
      default: '1.25rem',
      [MD]: '1.5rem',
    },
    paddingBlock: {
      default: '2rem',
      [MD]: '2.5rem',
    },
  },
  caption: {
    marginTop: 'auto',
    borderTopWidth: 1,
    borderColor: 'color-mix(in srgb, var(--color-ink) 10%, transparent)',
    paddingInline: {
      default: '1.25rem',
      [MD]: '1.5rem',
    },
    paddingBlock: '1.25rem',
  },
  // COMPETITION AND STAGE on ONE line, split by a middot (user call).
  // Display type carries POSITIVE tracking here (the display default is
  // tight −0.01em); the widened caps read as a label, not a headline, so
  // they don't fight the scoreline above.
  competitionLine: {
    fontSize: {
      default: '1.5rem',
      [MD]: '1.875rem',
    },
    lineHeight: {
      default: '2rem',
      [MD]: '2.25rem',
    },
    letterSpacing: '0.05em',
    color: tokens.ink,
  },
  dateLine: {
    marginTop: '0.5rem',
    fontSize: '10px',
    letterSpacing: '0.2em',
    color: 'color-mix(in srgb, var(--color-ink) 50%, transparent)',
    textTransform: 'uppercase',
  },
  // The strip. On a phone a native snap scroller: each card is the column less one `lg` and the gap, so the next card shows its first 24px and says there is more — the trending track's arithmetic. From md the cards sit side by side and nothing scrolls.
  strip: {
    marginTop: '1.5rem',
    display: 'flex',
    alignItems: 'stretch',
    gap: spacing.sm,
    overflowX: {
      default: 'auto',
      [MD]: 'visible',
    },
    scrollSnapType: {
      default: 'x mandatory',
      [MD]: 'none',
    },
    overscrollBehaviorX: 'contain',
    paddingBottom: '3px',
  },
  stripCard: {
    display: 'flex',
    flexGrow: {
      default: 0,
      [MD]: 1,
    },
    flexShrink: 0,
    flexBasis: {
      default: `calc(100% - ${spacing.sm} - ${spacing.lg})`,
      [MD]: '0%',
    },
    minWidth: 0,
    scrollSnapAlign: 'start',
  },
  // The card's status word, in the meta voice at the card's top left.
  cardTag: {
    paddingInline: {
      default: '1.25rem',
      [MD]: '1.5rem',
    },
    paddingTop: '1rem',
    fontSize: '10px',
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    color: 'color-mix(in srgb, var(--color-ink) 50%, transparent)',
  },
  // The form guide: five 12px squares and a meta caption.
  form: {
    marginTop: spacing.md,
  },
  formSquares: {
    display: 'flex',
    gap: '0.375rem',
  },
  formSquare: {
    height: '0.75rem',
    width: '0.75rem',
    borderWidth: 1,
  },
  formWin: {
    borderColor: tokens.ink,
    backgroundColor: tokens.ink,
  },
  formDraw: {
    borderColor: 'color-mix(in srgb, var(--color-ink) 25%, transparent)',
    backgroundColor: 'color-mix(in srgb, var(--color-ink) 25%, transparent)',
  },
  formLoss: {
    borderColor: tokens.pink,
    backgroundColor: 'transparent',
  },
  formCaption: {
    marginTop: '0.5rem',
    fontSize: '10px',
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    color: 'color-mix(in srgb, var(--color-ink) 50%, transparent)',
  },
});

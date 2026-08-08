import * as stylex from '@stylexjs/stylex';

import { tokens } from '../tokens.stylex';

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
  card: {
    display: 'flex',
    flexDirection: 'column',
    borderWidth: 1,
    borderColor: 'color-mix(in srgb, var(--color-ink) 15%, transparent)',
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
  matchInfoLink: {
    marginTop: '1.25rem',
    display: 'flex',
    width: 'fit-content',
    alignItems: 'center',
    gap: '0.5rem',
    borderWidth: 1,
    borderColor: tokens.ink,
    paddingInline: '1.25rem',
    paddingBlock: '0.625rem',
    fontSize: {
      default: '0.875rem',
      [MD]: '1rem',
    },
    lineHeight: {
      default: '1.25rem',
      [MD]: '1.5rem',
    },
    letterSpacing: '0.12em',
    color: {
      default: tokens.ink,
      ':hover': tokens.paper,
    },
    textTransform: 'uppercase',
    transitionProperty: 'color, background-color, border-color',
    transitionDuration: '0.15s',
    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
    backgroundColor: {
      default: null,
      ':hover': tokens.ink,
    },
  },
  sections: {
    display: 'grid',
    columnGap: {
      default: '1rem',
      [MD]: '1.25rem',
    },
    gridTemplateColumns: {
      default: null,
      [MD]: 'repeat(2, minmax(0, 1fr))',
    },
  },
  sectionBody: {
    marginTop: '1.5rem',
  },
});

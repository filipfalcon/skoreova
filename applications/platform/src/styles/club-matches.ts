import * as stylex from '@stylexjs/stylex';

import { spacing, tokens } from '../tokens.stylex';

// Styles for the club profile's LAST/UPCOMING match cards (club-matches.ts).

const COMPACT = '@container club-data (width < 16em)';
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
  // 72px on a phone: the size at which two crests and a two-digit score still
  // fit inside a 360px card's own padding, so nothing reaches its edge.
  crestImage: {
    height: {
      default: '4.5rem',
      [MD]: '6rem',
    },
    width: {
      default: '4.5rem',
      [MD]: '6rem',
    },
    objectFit: 'contain',
  },
  score: {
    position: 'relative',
    zIndex: 10,
    marginInline: {
      default: 0,
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
  // A link: ink text, no underline, paper under the hairline frame — and the
  // frame answers the hover. Paper, not surface: the fixture's pink VS mark
  // sits on the card, and pink may not sit on surface.
  card: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    color: tokens.ink,
    textDecoration: 'none',
    backgroundColor: tokens.paper,
    borderWidth: 1,
    borderColor: {
      default: tokens.hairline,
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
  // The `md` inline padding is what a peeking card shows: 16px of tone and
  // outline, never a crest edge or a digit.
  fixtureRow: {
    flexDirection: { default: 'row', [COMPACT]: 'column' },
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
      default: spacing.md,
      [MD]: '1.5rem',
    },
    paddingBlock: {
      default: '1.333rem',
      [MD]: '1.667rem',
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
  // The date line shares its row with the drawn arrow at the right end — the card is the link, and the arrow says so where the eye ends.
  dateRow: {
    marginTop: '0.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '0.75rem',
    color: tokens.ink,
  },
  dateLine: {
    fontSize: '10px',
    letterSpacing: '0.2em',
    color: 'color-mix(in srgb, var(--color-ink) 50%, transparent)',
    textTransform: 'uppercase',
  },
  // The strip. On a phone a native snap scroller that bleeds to the screen's
  // edges and carries the column's gutter as its own padding, with the snap
  // start on that gutter: at rest the NEXT card's left edge sits on the
  // gutter, and the cards on either side show exactly 16px of themselves in
  // the gutters' 20px (the 4px gap is the rest) — the same rest position at
  // every width, and 16px is inside a card's own padding, so a peek is tone
  // and outline and never a crest or a digit. From md the cards sit side by
  // side and nothing scrolls.
  strip: {
    marginTop: '1.5rem',
    marginInline: {
      default: '-1.25rem',
      [MD]: 0,
    },
    paddingInline: {
      default: '1.25rem',
      [MD]: 0,
    },
    scrollPaddingInlineStart: '1.25rem',
    display: 'flex',
    alignItems: 'stretch',
    gap: {
      default: '0.25rem',
      [MD]: spacing.sm,
    },
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
      default: '100%',
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
  form: {
    flexWrap: 'wrap',
    marginTop: spacing.md,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  formSquares: {
    flexWrap: 'wrap',
    display: 'flex',
    gap: '0.375rem',
  },
  formSquare: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '1.5rem',
    width: '1.5rem',
    borderWidth: 1,
    fontSize: '10px',
    letterSpacing: '0.2em',
    textIndent: '0.2em',
    textTransform: 'uppercase',
  },
  // The three form hues from styles.css, ordered by luminance there; the
  // letter takes whichever of ink and paper clears 4.5:1 on each (measured:
  // paper on win 4.6, ink on draw 5.3, paper on loss 7.4). The accent is
  // never one of them: pink is a chip, not a result.
  formWin: {
    borderColor: tokens.formWin,
    backgroundColor: tokens.formWin,
    color: tokens.paper,
  },
  formDraw: {
    borderColor: tokens.formDraw,
    backgroundColor: tokens.formDraw,
    color: tokens.ink,
  },
  formLoss: {
    borderColor: tokens.formLoss,
    backgroundColor: tokens.formLoss,
    color: tokens.paper,
  },
  formCaption: {
    fontSize: '10px',
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    color: 'color-mix(in srgb, var(--color-ink) 50%, transparent)',
  },
});

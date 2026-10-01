import * as stylex from '@stylexjs/stylex';

import { spacing, tokens, type } from '../tokens.stylex';

// Styles for the club profile's MATCHES section (club-matches.ts): the next match as an ink ticket,
// and the last result as its quiet twin on surface, with the form inside it. The hierarchy is
// carried by SURFACE (the one dark panel), TYPEFACE (display type only for the date and kickoff and
// the goals) and COLOUR (the kickoff the only pink beside the section's chip).

const MD = '@media (min-width: 768px)';

// A crest's box in a team row: 32px, a mark beside the name rather than the ticket's subject.
const CREST_SIZE = '2rem';

/**
 * The width a team-row crest is drawn at, in the `sizes` syntax.
 */
export const CREST_SIZES = CREST_SIZE;

// The side of a form square: 18px.
const SQUARE_SIZE = '1.125rem';

// One line that gives way at its end rather than wrapping, where a name could still run long.
const ONE_LINE = {
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
} as const;

export const styles = stylex.create({
  // On a phone the ticket and the last-result card run down the column; from md they sit side by
  // side, top-aligned and stretched to one height.
  layout: {
    marginTop: '1.5rem',
    display: {
      default: 'block',
      [MD]: 'grid',
    },
    gridTemplateColumns: {
      default: 'none',
      [MD]: 'minmax(0, 1fr) minmax(0, 1fr)',
    },
    alignItems: 'stretch',
    columnGap: spacing.lg,
  },
  // The meta voice on paper and surface: the muted ink, 4.9:1 on paper and 4.7:1 on surface, where
  // metaText's own grey is set for dark grounds.
  quiet: {
    color: tokens.mutedInk,
  },
  // The meta voice on the ticket: metaText's own on-ink grey, 8.5:1 on ink.
  onInkQuiet: {
    color: tokens.muted,
  },
  // THE TICKET — the next match, one link: the section's one dark surface, ink with paper type,
  // square-cornered and unbordered like every surface on the platform.
  ticket: {
    display: 'block',
    padding: spacing.md,
    backgroundColor: tokens.ink,
    color: tokens.paper,
    textDecoration: 'none',
  },
  // A card's content, stacked.
  cardBody: {
    display: 'flex',
    flexDirection: 'column',
  },
  // DATE AND KICKOFF — the section's one display-size line, paper with the kickoff in pink. One line
  // at 360.
  headline: {
    marginTop: spacing.xs,
    fontSize: '2.375rem',
    lineHeight: 1,
    whiteSpace: 'nowrap',
    color: tokens.paper,
  },
  // The kickoff, the section's one accent beside its chip: pink on ink, 5.6:1.
  kickoff: {
    color: tokens.pink,
  },
  venue: {
    marginTop: spacing.xs,
  },
  // The rule between the ground and the clubs, drawn in the ink panel's own rule tone.
  ticketRule: {
    display: 'block',
    height: 1,
    marginTop: spacing.md,
    backgroundColor: tokens.inkRule,
  },
  teams: {
    marginTop: spacing.md,
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.sm,
  },
  // A team row, on either card: crest, the full name taking what is left, and the card's own slot at
  // the row's end.
  teamRow: {
    display: 'grid',
    gridTemplateColumns: `${CREST_SIZE} minmax(0, 1fr) auto`,
    alignItems: 'center',
    columnGap: spacing.sm,
  },
  crest: {
    height: CREST_SIZE,
    width: CREST_SIZE,
    objectFit: 'contain',
  },
  // A club's full name in the body face, in the card's own tone: paper on the ticket, ink on the
  // last-result card.
  teamName: {
    ...ONE_LINE,
    fontFamily: tokens.fontBody,
    fontSize: '1.0625rem',
    fontWeight: 500,
    lineHeight: '1.5rem',
    color: 'inherit',
  },
  // The line that stands where the ticket would, once the season has none.
  seasonComplete: {
    marginBottom: spacing.md,
  },
  // THE LAST RESULT — the ticket's quiet twin: the paper-tone card fill with ink type, the same
  // padding, square corners, no border. Nothing pink sits on surface.
  lastCard: {
    padding: spacing.md,
    backgroundColor: tokens.surface,
    color: tokens.ink,
  },
  // Under the ticket on a phone it keeps a small gap; side by side from md it starts level with it.
  lastCardAfterTicket: {
    marginTop: {
      default: spacing.sm,
      [MD]: 0,
    },
  },
  // The card's top part, one link, in the card's own tone.
  lastLink: {
    display: 'block',
    color: 'inherit',
    textDecoration: 'none',
  },
  // The meta line with the date at its end, on one line.
  lastTop: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  lastDate: {
    flexShrink: 0,
    whiteSpace: 'nowrap',
  },
  // A team's goals at the end of its row: display type, tabular, full ink for both sides.
  goals: {
    fontSize: '1.625rem',
    lineHeight: 1,
    fontVariantNumeric: 'tabular-nums',
    textAlign: 'right',
    color: tokens.ink,
  },
  // The hairline between the result and the form, inside the card.
  cardRule: {
    display: 'block',
    height: 1,
    marginBlock: spacing.md,
    backgroundColor: tokens.hairline,
  },
  // The form: its label, and the squares at the row's end.
  formRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  squares: {
    display: 'flex',
    gap: '0.25rem',
  },
  square: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: SQUARE_SIZE,
    width: SQUARE_SIZE,
    borderWidth: 1,
    borderStyle: 'solid',
    // A result letter centred in its square, at the meta size.
    fontSize: type.metaSize,
    letterSpacing: '0.2em',
    textIndent: '0.2em',
    textTransform: 'uppercase',
  },
  // The three form hues from styles.css, ordered by luminance there; the
  // letter takes whichever of ink and paper clears 4.5:1 on each (measured:
  // paper on win 4.6, ink on draw 5.3, paper on loss 7.4). The accent is
  // never one of them: pink is a chip, not a result.
  win: {
    borderColor: tokens.formWin,
    backgroundColor: tokens.formWin,
    color: tokens.paper,
  },
  draw: {
    borderColor: tokens.formDraw,
    backgroundColor: tokens.formDraw,
    color: tokens.ink,
  },
  loss: {
    borderColor: tokens.formLoss,
    backgroundColor: tokens.formLoss,
    color: tokens.paper,
  },
});

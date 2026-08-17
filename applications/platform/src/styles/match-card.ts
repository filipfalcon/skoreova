import * as stylex from '@stylexjs/stylex';

import { spacing, tokens, type } from '../tokens.stylex';

// Styles for the shared match card (match-card.ts), both variants, and the
// pause card.
//
// FLAT, like the rest of the platform: no shadow, no radius. A compact card
// is told apart from the page by TONE (or by a hairline — see the open
// decision below); a hero card is told apart by being a photograph.

// ——— OPEN DECISION: the compact card's surface ———
//
// The first build filled the card with --color-surface at 1.075:1 off paper,
// which read as a grey block rather than as a lift. Two replacements are
// implemented and both are in the report as screenshots:
//
//   'outline' — variant A. The card sits ON paper with a 1px --color-hairline
//               rule. Nothing changes tone; the card is a drawn box. Truest
//               to the platform's editorial line work, and the one that keeps
//               a run of cards from reading as a grey stripe across the page.
//
//   'tint'    — variant B. The card keeps a fill, lightened to 1.048:1 off
//               paper. No line anywhere; the card is a raised sheet. Truest
//               to the platform's no-rims rule, and the one that survives a
//               busy page better because it does not add strokes.
//
// Both are real styles below. Which one the card wears is one exported
// reference at the foot of this file — a style rather than a flag, because
// StyleX needs its values static and will not read a branch inside a rule.

// ——— THE HERO'S SCRIM ———
//
// TWO LAYERS, not one. A gradient alone passed the contrast maths but still
// let bright patches of a photograph — a white kit, a lifted trophy — punch
// through under the story line, so the type sat on a moving background even
// where the numbers said it was legible. The flat wash is what settles that:
// it takes the whole frame down by a fixed amount before the gradient shapes
// the rest, so the DARKEST place under a line and the lightest are never far
// apart.
//
//   WASH      one flat 48% ink over the entire card.
//   GRADIENT  painted on top, strong at both ends where the quiet type sits.
//
// The two composite as 1 − (1 − wash)(1 − gradient), and every stop below was
// picked against the worst photograph a scrim can sit on — a pure white frame
// — so the card holds AA for whatever the desk drops in, not just this week's
// picture. Over white, --color-paper needs 62% total ink to clear 4.5:1 and
// --color-muted needs 80%.
//
// Stops are placed on the CONTENT, and the four floors they have to hold:
//
//   0–15%   meta, muted           → 81% / 80%    (floor 80%)
//   30%     crests + headline     → 70%          (floor 62%)
//   50%     story line, paper     → 73%          (floor 62%)
//   72–100% kickoff + venue       → 77% → 85%    (floor 80% at the venue)
//
// Moving a row means re-checking the stop under it.
const SCRIM_WASH = 'color-mix(in srgb, var(--color-ink) 48%, transparent)';

const SCRIM = [
  'color-mix(in srgb, var(--color-ink) 64%, transparent) 0%',
  'color-mix(in srgb, var(--color-ink) 62%, transparent) 15%',
  'color-mix(in srgb, var(--color-ink) 42%, transparent) 30%',
  'color-mix(in srgb, var(--color-ink) 48%, transparent) 50%',
  'color-mix(in srgb, var(--color-ink) 55%, transparent) 72%',
  'color-mix(in srgb, var(--color-ink) 72%, transparent) 100%',
].join(', ');

export const styles = stylex.create({
  card: {
    position: 'relative',
    display: 'flex',
    height: '100%',
    flexDirection: 'column',
    // xs, not sm: the compact card has to hold five rungs inside 200px, and
    // the four gaps between them are where the room came from.
    gap: spacing.xs,
    // A story line the desk overran would CLIP here rather than ellipsize —
    // deliberately, see editorial.ts. It is an authoring error with a guard
    // on it, not a layout case to design for.
    overflow: 'hidden',
    transitionProperty: 'background-color, border-color',
    transitionDuration: '0.15s',
    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
  // COMPACT CARDS ARE A FIXED 200px, inside the 180–200 the brief asks for,
  // and they no longer stretch to the hero: the track aligns to the start, so
  // a 272px hero stands over a run of 200px cards instead of hollowing every
  // one of them out. Fixed rather than a minimum because these cards differ —
  // a result has no kickoff line — and equal heights are what make the row
  // read as one board.
  compactCard: {
    height: '12.5rem',
    padding: spacing.md,
    // The card's own ink level. The goals column inherits it, so a score is
    // full strength on both variants without either naming a colour.
    color: tokens.ink,
  },
  // VARIANT A — the card is a drawn box on paper. Nothing changes tone; the
  // hairline does all the work, and the hover inks the rule rather than the
  // fill.
  compactOutline: {
    backgroundColor: {
      default: tokens.paper,
      ':hover': 'color-mix(in srgb, var(--color-ink) 4%, var(--color-paper))',
    },
    borderWidth: 1,
    borderColor: {
      default: tokens.hairline,
      ':hover': tokens.ink,
    },
  },
  // VARIANT B — the card is a raised sheet, no line anywhere. The card IS the
  // link, so the whole block answers the pointer: a touch deeper, staying
  // inside the same cream family rather than introducing a second colour.
  compactTint: {
    backgroundColor: {
      default: tokens.surface,
      ':hover': 'color-mix(in srgb, var(--color-ink) 6%, var(--color-surface))',
    },
  },
  // THE HERO'S HEIGHT is capped, not stretched: 17rem (272px), inside the
  // 260–300px the brief asks for. It is deliberately nowhere near a viewport
  // — the point of the cap is that at 390×844 the top of the honeycomb below
  // still shows under the card, so the page says there is more to scroll to
  // without a single pixel of chrome spent saying it. The measured figure is
  // in the report; move this and re-measure that.
  //
  // The 3:2 the brief pairs with it does not fit the same card: at 314px wide
  // that ratio is a 209px card, well under the range above. The HEIGHT range
  // won, and the card is nearer 8:7.
  heroCard: {
    height: '17rem',
    backgroundColor: tokens.ink,
    color: tokens.paper,
  },
  heroPhoto: {
    position: 'absolute',
    inset: 0,
    height: '100%',
    width: '100%',
    objectFit: 'cover',
    // Where the subject lives in a tall club portrait once it is cropped to a
    // card: heads sit high, so the crop holds the top third.
    objectPosition: '50% 25%',
  },
  heroScrim: {
    position: 'absolute',
    inset: 0,
    // The flat wash paints first, the gradient over it.
    backgroundColor: SCRIM_WASH,
    backgroundImage: `linear-gradient(180deg, ${SCRIM})`,
  },
  // Everything readable rides above the photograph and the scrim.
  heroBody: {
    position: 'relative',
    display: 'flex',
    flexGrow: 1,
    flexDirection: 'column',
    gap: spacing.xs,
    padding: spacing.md,
  },
  // THE HEADLINE — the hero's whole point. Two club names in the display face
  // at card scale, split by a multiplication sign, which is the mark a fixture
  // is written with and is not the letter x. One or two lines; the clamp and
  // the display face's own condensation are what keep the common pairings on
  // one.
  headline: {
    fontSize: type.cardHeadline,
    lineHeight: 0.95,
    color: tokens.paper,
  },
  // The crests ride ABOVE the headline on a hero, at two thirds of the size
  // they take in a compact row: the names are carrying the card here, and a
  // badge big enough to compete with them would be arguing with the point.
  heroCrests: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.xs,
  },
  heroCrest: {
    height: '1.5rem',
    width: '1.5rem',
    objectFit: 'contain',
  },
  meta: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  // The competition can be long ("Second League"); the stage never is. Only
  // the competition gives up room.
  metaCompetition: {
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  // ——— The four text tones. shared.metaText carries --color-muted, which is
  // for DARK surfaces and measures 2:1 on cream, so a card on paper always
  // overrides it. Naming them by SURFACE rather than by role is what keeps
  // the hero and the compact card from each inventing their own greys. ———
  onDark: { color: tokens.paper },
  onPaper: { color: tokens.ink },
  quietOnDark: { color: tokens.muted },
  quietOnPaper: { color: tokens.mutedInk },
  sides: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xs,
  },
  // On a COMPACT card the fixture takes whatever slack the track handed the
  // card, so the three rungs — label, fixture, state — end up evenly spread
  // instead of the fixture clinging to the top with a hole beneath it. That
  // hole is not hypothetical: the hero sets the height of the whole track, so
  // every compact card is taller than its own content. A hero distributes
  // from the top instead, because its content sits over a photograph and
  // floating it would drag the type off the part of the picture the scrim is
  // strongest on.
  sidesCentered: {
    marginBlock: 'auto',
  },
  side: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.xs,
  },
  crest: {
    height: '1.5rem',
    width: '1.5rem',
    flexShrink: 0,
    objectFit: 'contain',
  },
  // A side with no badge in our table still holds the column, so the two
  // names in a card stay on one left edge.
  crestBlank: {
    height: '1.5rem',
    width: '1.5rem',
    flexShrink: 0,
  },
  sideName: {
    minWidth: 0,
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: '0%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontSize: type.cardName,
    lineHeight: 1.1,
  },
  sideNameInk: { color: tokens.ink },
  sideNameOnDark: { color: tokens.paper },
  // A finished compact card runs quieter — BOTH names, never one: nothing on
  // this card marks a winner, and fading a losing side was settled against on
  // the club profile.
  sideNameQuiet: { color: tokens.mutedInk },
  goals: {
    flexShrink: 0,
    fontSize: type.scoreSize,
    lineHeight: 1,
    fontVariantNumeric: 'tabular-nums',
    color: 'inherit',
  },
  // ONE line of editorial copy, sitting straight under the headline at META
  // SIZE — a caption to the names, not a second headline competing with them.
  // Body voice and sentence case rather than the display face and the meta
  // row's uppercase: it is prose, and 48 characters of 10px uppercase at
  // 0.2em would run to some 400px, which is wider than the card.
  //
  // No wrap and no ellipsis. The 48-character limit is enforced at authoring
  // (editorial.ts), so this row can assume every line it is handed fits.
  storyLine: {
    fontSize: type.metaSize,
    lineHeight: 1.4,
    whiteSpace: 'nowrap',
    color: tokens.paper,
  },
  // Pushed to the bottom of whatever height the track stretched the card to,
  // so a result's empty state block sits on the same baseline as an
  // invitation's kickoff and ground.
  footer: {
    marginTop: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xs,
  },
  kickoff: {
    fontSize: type.subtitleSize,
    lineHeight: 1,
    letterSpacing: type.subtitleTracking,
  },
  // One line, and it gives up its tail rather than its card: a long ground
  // name must not be what decides the height of the whole track.
  venue: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  pauseCard: {
    justifyContent: 'center',
    gap: spacing.xs,
  },
  pauseHeadline: {
    fontSize: type.cardName,
    lineHeight: 1.1,
    color: tokens.ink,
  },
  pauseDate: {
    fontSize: type.scoreSize,
    lineHeight: 1,
    color: tokens.ink,
  },
});

// ——— THE OPEN DECISION, in one line. Flip to `styles.compactOutline` to see
// variant A; both are in the report as screenshots. When the call is made,
// the loser above goes and this indirection goes with it. ———
export const compactSurface = styles.compactTint;

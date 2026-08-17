import { Calendar } from 'foldkit';

import spartaPrahaHero from './assets/clubs-hero/sparta-praha.webp';
import { CUP_TIES, fixtureSeed } from './schedule';

// THE DESK — the handful of fields on the weekly board that a person writes
// and nothing derives. Everything else the home page shows comes out of the
// season canon; these are the Monday decisions: which match to lead with,
// which photograph runs behind it, what one line to say about it, and — when
// the fixtures stop — whether we yet know the date they resume.
//
// ONE RULE ACROSS ALL OF THEM: absent is a real answer. There is no generated
// fallback for any field here, no placeholder artwork and no filler copy. A
// field left blank means its row is not rendered — not rendered empty, not
// rendered as reserved space — and the card closes over the gap.
//
// Keyed by FIXTURE SEED, like the scorelines and the postponements, so an
// entry names one specific match and cannot silently attach to another.

export interface MatchEditorial {
  // The week's pick for the hero slot. At most one match should carry it;
  // pulse.ts takes the first if more than one ever does.
  readonly featured?: boolean;
  // The hero's background photograph. Sourced by hand during the week's prep
  // — the meeting itself where such a picture exists, otherwise the home
  // club's own artwork. No automatic image lookup lives anywhere in this app,
  // and a match with no photograph gets no photograph.
  readonly heroImage?: string;
  // One line, in the app's voice. Never generated from the fixture, and never
  // longer than STORY_LINE_LIMIT.
  readonly storyLine?: string;
}

// THE HARD LIMIT — 48 characters, spaces included, and it is enforced HERE
// rather than in CSS. The row is one line that does not wrap, and it is not
// allowed to ellipsize either: a story line trimmed to "Fourth Prague derby
// of the sea…" is worse than no story line, because it looks like the page
// broke rather than like the desk overran. So too long is an authoring error,
// caught before it ships (data.test.ts fails on it), and the card is free to
// assume every line it is handed fits.
export const STORY_LINE_LIMIT = 48;

const EMPTY: MatchEditorial = {};

// This week's board. The cup semifinal is the pick: a Prague derby in a
// knockout, with Sparta at home, so the club's own hero artwork carries it.
//
// The second semifinal is deliberately left bare — Slovácko have no artwork
// in the library, and inventing one is exactly what this file exists to
// prevent. It renders as a compact card like any other tie.
const DESK: { readonly [seed: string]: MatchEditorial } = (() => {
  const derby = CUP_TIES[0];
  return derby === undefined
    ? {}
    : {
        [fixtureSeed('Domestic Cup', derby.weekend, derby.home, derby.away)]: {
          featured: true,
          heroImage: spartaPrahaHero,
          // 46 of the 48 characters available. The first draft ran to 78 and
          // would have failed the guard rather than been trimmed on screen.
          storyLine: 'Fourth Prague derby. A final at the end of it.',
        },
      };
})();

export const editorialFor = (seed: string): MatchEditorial => DESK[seed] ?? EMPTY;

// WHEN THE FIXTURES PICK UP AGAIN — an editorial field too, and a NULLABLE
// one. A break with no announced return date is an ordinary state, not a
// missing value to paper over: with nothing here the pause card says only
// that there are no matches this week, and says nothing about when that
// changes. Set it when the date is known.
//
// It cannot be derived — a fixture list that has run out is precisely the one
// that cannot tell you when it resumes.
export const SEASON_RESUMES: Date | undefined = Calendar.toDateLocal(Calendar.make(2026, 2, 28));

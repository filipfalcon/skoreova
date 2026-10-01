import { Option } from 'effect';
import { Scene } from 'foldkit';
import type { HtmlBuilder } from 'foldkit/html';
import { describe, expect, test } from 'vite-plus/test';

import {
  FORM_LENGTH,
  clubMatchesIndex,
  clubSeason,
  matchesSection,
  selectMatches,
} from './club-matches';
import type { MatchesSelection, PlayedMatch } from './club-matches';
import { clubs } from './data';
import type { Message } from './message';
import { formWindow } from './schedule';

// A season of `played` finished rounds followed by `upcoming` rounds still to come.
const season = (played: number, upcoming: number): ReadonlyArray<PlayedMatch> =>
  Array.from({ length: played + upcoming }, (_, index) => ({
    match: { round: index + 1, home: 'Sparta Praha', away: `Opponent ${index + 1}` },
    isPlayed: index < played,
    isHome: true,
    forGoals: 1,
    againstGoals: 0,
  }));

const rounds = ({ maybeLast, maybeNext, form }: MatchesSelection) => ({
  last: Option.map(maybeLast, ({ match }) => match.round),
  next: Option.map(maybeNext, ({ match }) => match.round),
  form: form.map(({ match }) => match.round),
});

// The section draws exactly what the season has: both blocks mid-season, the
// next match alone before the first result, the last result alone once no
// fixture is left, and nothing for a season with neither. The form is the last
// five results up to the most recent, so its newest square is the last result.
describe('the matches section picks its games from the season', () => {
  test('mid-season: the last result and the next match', () => {
    expect(rounds(selectMatches(season(12, 2)))).toEqual({
      last: Option.some(12),
      next: Option.some(13),
      form: [8, 9, 10, 11, 12],
    });
  });

  test('season start: the next match only', () => {
    expect(rounds(selectMatches(season(0, 14)))).toEqual({
      last: Option.none(),
      next: Option.some(1),
      form: [],
    });
  });

  test('season over: the last result only', () => {
    expect(rounds(selectMatches(season(14, 0)))).toEqual({
      last: Option.some(14),
      next: Option.none(),
      form: [10, 11, 12, 13, 14],
    });
  });

  test('neither: nothing to draw', () => {
    expect(rounds(selectMatches(season(0, 0)))).toEqual({
      last: Option.none(),
      next: Option.none(),
      form: [],
    });
  });
});

// The jump row offers MATCHES exactly where the section is drawn.
test('every club profile offers the matches section in its jump row', () => {
  for (const club of clubs) {
    expect(clubMatchesIndex(club)).toEqual([{ anchor: 'matches', label: 'Matches' }]);
  }
});

// The section's rendering for each state, drawn from a forced selection: the
// mock season sits mid-way for every club, so the start and the end of a
// season are only reachable this way.
describe('the matches section draws each season state', () => {
  const sparta = clubs.find((club) => club.slug === 'sparta-praha')!;
  const season = clubSeason(sparta);
  // The same season with nothing played yet, and with everything played.
  const opening = season.map((entry) => ({ ...entry, isPlayed: false }));
  const finale = season.map((entry) => ({ ...entry, isPlayed: true }));
  const stub = { update: (model: Record<string, never>, _message: Message) => ({ model }) };
  const sectionScene = (selection: MatchesSelection) => ({
    ...stub,
    view: (_model: Record<string, never>, h: HtmlBuilder<Message>) =>
      h.div([], [...matchesSection(sparta, selection, h)]),
  });

  test('mid-season: the next match, the last result and the form', () => {
    Scene.scene(
      sectionScene(selectMatches(season)),
      Scene.given({}),
      Scene.expect(Scene.role('link', { name: /^Next match: / })).toExist(),
      Scene.expect(Scene.role('link', { name: /^Last result: / })).toExist(),
      Scene.expect(Scene.text('Form')).toExist(),
    );
  });

  test('season start: the next match alone, with no result or form', () => {
    Scene.scene(
      sectionScene(selectMatches(opening)),
      Scene.given({}),
      Scene.expect(Scene.role('link', { name: /^Next match: .+ round 1, / })).toExist(),
      Scene.expect(Scene.role('link', { name: /^Last result: / })).not.toExist(),
      Scene.expect(Scene.text('Form')).not.toExist(),
    );
  });

  test('season over: the season-complete line, then the last result and the form', () => {
    Scene.scene(
      sectionScene(selectMatches(finale)),
      Scene.given({}),
      Scene.expect(Scene.text('No upcoming match — season complete')).toExist(),
      Scene.expect(Scene.role('link', { name: /^Next match: / })).not.toExist(),
      Scene.expect(Scene.role('link', { name: /^Last result: .+ round 14, / })).toExist(),
      Scene.expect(Scene.role('list', { name: /^Last five: .+, newest last$/ })).toExist(),
    );
  });

  test('neither: no section at all', () => {
    Scene.scene(
      sectionScene(selectMatches([])),
      Scene.given({}),
      Scene.expect(Scene.selector('section')).not.toExist(),
    );
  });
});

// The section reads its form from the club's own season; the competition
// table reads the league's form window. The two must agree for every club.
test('every club shows the same form here as in its league table', () => {
  for (const club of clubs) {
    const form = selectMatches(clubSeason(club)).form.map(({ forGoals, againstGoals }) =>
      forGoals > againstGoals ? 'W' : forGoals < againstGoals ? 'L' : 'D',
    );
    expect(form).toEqual(formWindow(club.league, club.name, FORM_LENGTH, 0));
  }
});

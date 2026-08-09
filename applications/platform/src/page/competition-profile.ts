import { Button, RadioGroup, Select } from '@foldkit/ui';
import { Match as M, Option, Record } from 'effect';
import { html } from 'foldkit/html';
import type { Html } from 'foldkit/html';

import domesticCupHeroPhoto from '../assets/competitions-hero/domestic-cup.jpg';
import firstLeagueHeroPhoto from '../assets/competitions-hero/first-league.jpg';
import secondLeagueHeroPhoto from '../assets/competitions-hero/second-league.jpg';
import { chevron, clubChip, pinkTick, sectionLabel } from '../components';
import { POINTS_DRAW, POINTS_WIN, clubRowFace, leagueTeams, standingsFor } from '../data';
import type { Competition, Edition } from '../data';
import { SelectedCompetitionEdition, SelectedCompetitionRound } from '../message';
import type { Message } from '../message';
import type { Model } from '../model';
import { clubRouter, competitionsRouter } from '../route';
import {
  MATCHDAYS_PLAYED,
  competitionShape,
  competitionShapeForLeague,
  fixtureSeed,
  leagueRounds,
  mockScore,
  formWindow,
} from '../schedule';
import type { SeasonShape } from '../schedule';
import { getStyleXAttributes, getStyleXAttributesWith } from '../stylexAttributes';
import type { StyleXStyle } from '../stylexAttributes';
import { styles } from '../styles/competition-profile';
import { shared } from '../styles/shared';

const h = html<Message>();

// Per-competition hero artwork — the club profile's device (user call: the
// First League page opens like the Sparta Praha page, big picture with the
// heading under it). Competitions without an entry keep the flat header.
// An index signature rather than the Record utility type: effect's Record
// import shadows it in this module.
interface HeroArt {
  readonly photo: string;
  readonly focus: string;
}

const competitionHeroArt: { readonly [slug: string]: HeroArt } = {
  // The derby tangle (user-supplied) — the two upright Sparta faces ride
  // the square's upper third, so the focus sits high enough to keep their
  // heads clear of the crop, the Baník lesson applied preemptively.
  'first-league': { photo: firstLeagueHeroPhoto, focus: '50% 20%' },
  // The shoulder-to-shoulder duel (user-supplied) — both heads sit in the
  // frame's top quarter, so the same high focus as the First League keeps
  // them clear of the crop.
  'second-league': { photo: secondLeagueHeroPhoto, focus: '50% 20%' },
  // The Slavia scrum (user-supplied) — four players deep, but the two who
  // carry the frame have their heads in the same top quarter as the other
  // two photos, so the focus holds at the shared 20%.
  'domestic-cup': { photo: domesticCupHeroPhoto, focus: '50% 20%' },
};

// Which competitions need the SMALLER headline rung. Measured, not counted:
// at a 390px viewport the hero column is 350px, and in the display face at
// XL (66.3px there) the names come out —
//
//   First League  336px  fits      Second League  394px  does not
//   UWCL          141px  fits      Domestic Cup   368px  does not
//   UWEC          142px  fits      National Team  395px  does not
//
// A character count cannot express that: "First League" and "Domestic Cup"
// are both twelve characters and land on opposite sides of the line, because
// Anton's I/L/T are narrow where its O/M/C are wide. Every name clears the
// column at L. Re-measure this list when a competition is added or renamed;
// scratchpad/names.mjs is the probe that produced the figures.
const HEADLINE_L_SLUGS: ReadonlyArray<string> = ['second-league', 'domestic-cup', 'national-team'];

const headlineTier = (competition: Competition): StyleXStyle =>
  HEADLINE_L_SLUGS.includes(competition.slug) ? styles.heroNameL : styles.heroNameXL;

const backLink = (href: string, label: string): Html =>
  h.a(
    [h.Href(href), ...getStyleXAttributes(h, shared.metaText, styles.backLink)],
    [chevron('left', styles.backChevron), label],
  );

const profileHeader = (
  backHref: string,
  backLabel: string,
  title: string,
  chips: ReadonlyArray<Html>,
): Html =>
  h.div(
    [],
    [
      backLink(backHref, backLabel),
      h.div(
        [...getStyleXAttributes(h, styles.headerBlock)],
        [
          h.h1([...getStyleXAttributes(h, shared.display, styles.title)], [title]),
          h.div([...getStyleXAttributes(h, styles.chipRow)], chips),
        ],
      ),
    ],
  );

const honorChip = (text: string): Html =>
  h.span([...getStyleXAttributes(h, shared.display, styles.honorChip)], [text]);

const mutedChip = (text: string): Html =>
  h.span([...getStyleXAttributes(h, styles.mutedChip)], [text]);

// The SEASON TIMELINE — the LiveSport device (user call: this instead of a
// "Matchday 12 of 14" chip), reshaped across two reviews: first into phase
// BARS (user call: bars, not dots), then into PIECES (user call) — each bar
// is cut into one segment per matchday, so the phase lengths are countable
// rather than implied by a fill width. The shape itself is schedule canon
// (`competitionShape`) — the phases and how far into them we are — so this
// draws a league's split season and the cup's qualifiers-then-knockout with
// the same bars.
// The phase bar's reveal, in two stages (user call). Stage one draws EVERY
// segment left to right; stage two then inks the played ones, one at a
// time, once the drawing has landed. Slower than the single-stage sweep it
// replaced, and slower again than that was after the first slow-down: the
// point is to watch the season get counted out, not to catch a flourish.
//
// Durations live in styles.css beside the keyframes; these are the offsets
// the view has to compute, because they depend on how many rounds a season
// actually has.
const DRAW_STEP = 0.015;
const DRAW_DURATION = 0.22;
const STAGE_GAP = 0.18;
const INK_STEP = 0.11;
const INK_DURATION = 0.3;

const seasonTimeline = (shape: SeasonShape): Html => {
  const played = shape.played;
  // Each phase's starting offset in the season's running round count — the
  // walk that decides which pieces are already behind us.
  const phases = shape.phases.reduce<
    ReadonlyArray<{ readonly label: string; readonly rounds: number; readonly start: number }>
  >(
    (placed, phase) => [
      ...placed,
      { ...phase, start: placed.reduce((sum, done) => sum + done.rounds, 0) },
    ],
    [],
  );
  // The phase the current matchday falls in — the first one it hasn't run
  // past. A season played to its end keeps the last phase lit.
  const activeIndex = Math.max(
    0,
    phases.findIndex((phase) => played <= phase.start + phase.rounds),
  );
  const active = phases[activeIndex];
  // Stage two waits for the LAST segment's draw to finish, not the last
  // played one — the empty tail is part of what stage one is showing.
  const segments = phases.reduce((sum, phase) => sum + phase.rounds, 0);
  const inkStart = segments * DRAW_STEP + DRAW_DURATION + STAGE_GAP;
  // Phase LENGTHS are data, not design, so they ride inline styles the way
  // every proportional bar here does: growing each bar by its round count
  // keeps one piece the same width across both phases.
  const phaseBar = (phase: (typeof phases)[number]): Html =>
    h.div(
      [
        ...getStyleXAttributes(h, styles.timelineTrack),
        h.Style({ 'flex-grow': `${phase.rounds}` }),
      ],
      Array.from({ length: phase.rounds }, (_, round) => {
        const index = phase.start + round;
        const isPlayed = index < played;
        // The round we are IN is the last one played — "you are here".
        const isCurrent = index === played - 1;
        // EVERY segment draws; only the played ones go on to be inked, and
        // the last of those is the live one that pulses afterwards.
        const contract = isPlayed
          ? isCurrent
            ? 'phase-piece phase-live'
            : 'phase-piece phase-played'
          : 'phase-piece';
        // Both staggers run on the SEASON index, not the phase's, so each
        // stage crosses the split as one movement instead of restarting.
        const timings: Record<string, string> = {
          '--piece-delay': `${(index * DRAW_STEP).toFixed(3)}s`,
          ...(isPlayed ? { '--ink-delay': `${(inkStart + index * INK_STEP).toFixed(3)}s` } : {}),
          ...(isCurrent
            ? {
                '--pulse-delay': `${(inkStart + index * INK_STEP + INK_DURATION).toFixed(3)}s`,
              }
            : {}),
        };
        return h.div(
          [
            ...getStyleXAttributesWith(
              h,
              contract,
              styles.timelinePiece,
              isPlayed
                ? isCurrent
                  ? styles.timelinePieceCurrent
                  : styles.timelinePiecePlayed
                : styles.timelinePieceRest,
            ),
            h.Style(timings),
          ],
          [],
        );
      }),
    );
  const phaseLabel = (phase: (typeof phases)[number], isActive: boolean): Html =>
    h.span(
      [
        ...getStyleXAttributesWith(
          h,
          isActive ? 'phase-label phase-label-live' : 'phase-label',
          styles.timelineLabel,
          isActive ? styles.timelineLabelActive : styles.timelineLabelRest,
        ),
        h.Style({
          'flex-grow': `${phase.rounds}`,
          // Lands as its OWN bar finishes drawing, so each label arrives
          // with the thing it names rather than the pair appearing at once.
          '--label-delay': `${((phase.start + phase.rounds) * DRAW_STEP).toFixed(3)}s`,
          // The accent arrives with the ink, not before it.
          ...(isActive ? { '--ink-delay': `${inkStart.toFixed(3)}s` } : {}),
        }),
      ],
      [phase.label],
    );
  return h.div(
    [
      ...getStyleXAttributes(h, styles.timeline),
      // One announcement for the whole strip — the pieces are drawing, not
      // content. It states the round WITHIN the phase, which is what the
      // bars draw; a season-wide "matchday N of total" would have to pick a
      // total, and only the regular phase has fixtures behind it.
      h.Role('img'),
      h.AriaLabel(
        active === undefined
          ? 'Season progress'
          : `Season progress: ${active.label.toLowerCase()}, round ${played - active.start} of ${active.rounds}`,
      ),
    ],
    [
      h.div(
        [...getStyleXAttributes(h, styles.timelineRow), h.AriaHidden(true)],
        phases.map(phaseBar),
      ),
      h.div(
        [...getStyleXAttributes(h, styles.timelineLabels), h.AriaHidden(true)],
        phases.map((phase, index) => phaseLabel(phase, index === activeIndex)),
      ),
    ],
  );
};

// THE SUBTITLE — the quiet line under the name (user call), replacing the
// pink tagline block: the hero carries exactly one filled surface now, and
// it is the selector, because that is the only thing in the band you can
// operate. Derived, never authored — the team count comes off the clubs
// table and the phase count off the season shape, so it cannot drift from
// the bars drawing directly above it.

// Returned as PARTS rather than one joined string: the separator between
// them is a pink dot, so it has to be its own element.
const heroSubtitleParts = (competition: Competition): ReadonlyArray<string> =>
  Option.match(competitionShape(competition), {
    // Nothing shaped to describe — the authored stage is the best line we
    // have. Unreachable while every competition with hero art has a shape.
    onNone: () => [competition.stage],
    onSome: (shape) =>
      M.value(competition.standings).pipe(
        M.withReturnType<ReadonlyArray<string>>(),
        M.tagsExhaustive({
          TableStandings: ({ league }) => [
            `${leagueTeams(league).length} teams`,
            `${shape.phases.length} ${shape.phases.length === 1 ? 'phase' : 'phases'}`,
            // The points system, read off the same constants the standings
            // table pays out with — so the line can never advertise a
            // scoring rule the table below it does not use. A loss is a
            // structural zero rather than a constant: there is nothing to
            // award, so there is nothing to name.
            `${POINTS_WIN}-${POINTS_DRAW}-0`,
          ],
          // A cup's entrants are authored (nothing here can count them) and
          // "knockout" is what a TiesStandings competition IS, so the tag
          // itself names the format. Without an authored count there is
          // nothing to say but the phases.
          TiesStandings: () =>
            shape.entrants === undefined
              ? shape.phases.map((phase) => phase.label)
              : [`${shape.entrants} teams`, 'Knockout'],
        }),
      ),
  });

// The dot is DECORATION, not content: a screen reader reading "8 teams
// two-phase season" is right, and reading a stray middot between them is
// not. The spaces on either side are real text rather than margins on the
// mark, which is what keeps those two phrases from running together when
// the mark itself is hidden from the accessibility tree.
const heroSubtitleLine = (competition: Competition): Html =>
  h.p(
    [...getStyleXAttributes(h, styles.heroSubtitle)],
    heroSubtitleParts(competition).flatMap((part, index) =>
      index === 0
        ? [part]
        : [
            ' ',
            h.span([...getStyleXAttributes(h, styles.heroSubtitleDot), h.AriaHidden(true)], []),
            ' ',
            part,
          ],
    ),
  );

// THE SEASON SELECTOR — the archive's handle in the hero, where a reader
// arrives rather than at the foot of the page where the full board lives.
// Temporal navigation is a core promise here, so it can't be something you
// only find by scrolling past the season you're already looking at.
//
// Ui.Select — the house component, headless like Ui.Button and
// Ui.RadioGroup beside it: it owns the id, the label association and the
// value/onChange wiring, and hands back attribute groups for the markup to
// wear. It renders a NATIVE select underneath, which is the point — no
// open/closed state in the Model, and the keyboard, the escape key, the
// focus ring and the phone's own wheel picker all arrive correct.
//
// The caret is drawn because `appearance: none` takes the native one, and a
// text ▾ is a font-fallback lottery at this size. `color-scheme: dark` is
// what makes the popup itself render dark — the option list is the one part
// of this control no stylesheet here can reach.
const seasonSelect = (competition: Competition, model: Model): Html => {
  const currentLabel = competition.editions.find((entry) => entry.isCurrent)?.label ?? '';
  const openLabel = Option.getOrElse(model.competitionEdition, () => currentLabel);
  return Select.view<Message>({
    id: 'competition-season',
    // The component stamps the value onto the element, so the options carry
    // no `selected` of their own — one source for which season is open.
    value: openLabel,
    // Same wire contract as the archive board below: the current edition
    // maps back to '' and the handler folds that to None, so the two
    // controls drive one piece of state and can't disagree.
    onChange: (label) => SelectedCompetitionEdition({ label: label === currentLabel ? '' : label }),
    toView: (attributes) =>
      h.span(
        [...getStyleXAttributes(h, styles.seasonField)],
        [
          // A real <label for> rather than an aria-label — the same trade
          // the clubs search makes: it names the control for AT without
          // showing a word next to a value that already reads as one.
          h.label([...attributes.label, ...getStyleXAttributes(h, shared.srOnly)], ['Season']),
          // Ui.Select points aria-describedby at this id unconditionally, so
          // SOMETHING has to answer to it — an unresolved IDREF is what
          // automated a11y checks flag. Rather than park an empty element
          // there, it says the one thing a screen reader cannot infer from a
          // label reading "Season" and a value reading "2025/26".
          h.span(
            [...attributes.description, ...getStyleXAttributes(h, shared.srOnly)],
            ['Changes the season shown on this page.'],
          ),
          h.select(
            [...attributes.select, ...getStyleXAttributes(h, shared.metaText, styles.seasonSelect)],
            competition.editions.map((entry) => h.option([h.Value(entry.label)], [entry.label])),
          ),
          chevron('down', styles.seasonCaret),
        ],
      ),
  });
};

// The HERO opening — the club profile's dark act, borrowed whole (user
// call: the First League page starts like the Sparta Praha page). One
// full-bleed band: the artwork up top fading into ink, the huge display
// name riding the fade, the tagline and stage chips beneath, film grain
// over everything. The band ENDS there — every panel below it stays the
// paper data act. Same single parallax as the club page: the artwork drifts
// (.club-hero-art) and everything over it holds still.
//
// No competition badge here (user call): the club profile's crest is the
// club's own mark, but a competition badge over its own name said the same
// word twice, and the name is the bang on its own.
const competitionHero = (competition: Competition, heroArt: HeroArt, model: Model): Html => {
  const shape = competitionShape(competition);
  return h.div(
    [...getStyleXAttributes(h, styles.heroBand)],
    [
      h.div(
        [...getStyleXAttributesWith(h, 'club-hero-art', styles.heroArt)],
        [
          // Phones ZOOM the artwork in, md+ shows the full crop — the club
          // hero's treatment, for the same reason (players shrink to specks
          // in the wide frame).
          h.img([
            h.Src(heroArt.photo),
            h.Alt(''),
            ...getStyleXAttributes(h, styles.heroArtImage),
            h.Style({ 'object-position': heroArt.focus, 'transform-origin': heroArt.focus }),
          ]),
        ],
      ),
      // THE SCRIM — a static ink ramp between the artwork and the name.
      // It is a SIBLING of the art, not a child: the gradient used to live
      // inside `.club-hero-art`, so the parallax carried it 10rem down the
      // page and slid it out from under the headline, leaving the name on
      // whatever the photo happened to hold there (the Slavia kit, on the
      // cup). Anchored to the band instead, it holds its ground at every
      // scroll position and every photo, which is the point — each
      // competition brings its own photography and none of it can be
      // trusted to be dark where the type lands.
      h.div([...getStyleXAttributes(h, styles.heroScrim), h.AriaHidden(true)], []),
      // The TOP scrim, the bottom one's twin (user call): the wayfinding
      // line has to sit on guaranteed dark whatever the photo does up
      // there. Same reasoning, same reason it is a sibling and not a child
      // of the drifting artwork.
      h.div([...getStyleXAttributes(h, styles.heroTopScrim), h.AriaHidden(true)], []),
      // THE WAYFINDING LINE — breadcrumb left, season right (user call).
      // The two belong together: both answer "where am I", neither is
      // content, and the top of the artwork was empty once the badge went.
      // Static, not inside `.club-hero-art`: the back link used to ride the
      // parallax 10rem down the page, which walked the page's only way out
      // of the hero off its own corner as you scrolled.
      h.div(
        [...getStyleXAttributes(h, styles.heroTopRow)],
        [
          h.a(
            [
              h.Href(competitionsRouter()),
              ...getStyleXAttributes(h, shared.metaText, styles.heroBackLink),
            ],
            [chevron('left', styles.backChevron), 'All competitions'],
          ),
          seasonSelect(competition, model),
        ],
      ),
      h.div(
        [...getStyleXAttributes(h, styles.heroColumn)],
        [
          h.div(
            [...getStyleXAttributes(h, styles.hero)],
            [
              h.h1(
                [
                  ...getStyleXAttributes(
                    h,
                    shared.display,
                    styles.heroName,
                    headlineTier(competition),
                  ),
                ],
                [competition.name],
              ),
              // One quiet line, no surface behind it — see heroSubtitleLine.
              heroSubtitleLine(competition),
              ...Option.match(shape, {
                onNone: (): ReadonlyArray<Html> => [],
                onSome: (open) => [seasonTimeline(open)],
              }),
            ],
          ),
        ],
      ),
      // Film grain over the dark world only — the data act below stays
      // clean paper, exactly like the club profile's seam.
      h.div([...getStyleXAttributesWith(h, 'grain', styles.heroGrain), h.AriaHidden(true)], []),
    ],
  );
};

// A league table panel, with an optional pink-highlighted team.
// The section's own heading and the id it answers to. Unnumbered (user
// call): the landing page numbers its sections because it has a fixed run
// of them to walk through, and this page does not.
const STANDINGS_ANCHOR = 'standings';
const STANDINGS_SECTION = 'Standings';

// The chip ANCHORS its own section, exactly as the club profile's do:
// clicking it jumps to the block and leaves #standings in the address bar,
// so the table is linkable. A real h2, so the section keeps its place in
// the heading outline rather than being a bare link posing as one.
const standingsHeading = (): Html =>
  h.h2(
    [...getStyleXAttributes(h, styles.standingsHeading)],
    [clubChip(STANDINGS_SECTION, STANDINGS_ANCHOR)],
  );

// The window: five played, then the next fixture. Six marks is what the
// column holds at 390px without crowding, and one square of "still to come"
// is enough to say the season has not stopped — a longer tail of identical
// empty outlines adds width and no information.
const FORM_PLAYED = 5;
const FORM_UPCOMING = 1;

const FORM_STYLE: { readonly [result: string]: StyleXStyle } = {
  W: styles.formWin,
  D: styles.formDraw,
  L: styles.formLoss,
  U: styles.formUpcoming,
};

const FORM_WORD: { readonly [result: string]: string } = {
  W: 'won',
  D: 'drew',
  L: 'lost',
  U: 'not played yet',
};

// Oldest to newest, played first and the next fixture last. Every mark sits
// at full strength — the age fade this used to carry put the older squares
// below the 3:1 a UI mark owes on cream, and it was never carrying meaning
// the left-to-right order does not already give. The squares are drawing,
// so the run is announced once as a sentence and the marks are hidden.
const formStrip = (league: string, team: string): Html => {
  const results = formWindow(league, team, FORM_PLAYED, FORM_UPCOMING);
  return h.span(
    [
      ...getStyleXAttributes(h, styles.formStrip),
      h.Role('img'),
      h.AriaLabel(
        (() => {
          const behind = results.filter((result) => result !== 'U');
          const ahead = results.length - behind.length;
          const played =
            behind.length === 0
              ? 'No matches played'
              : `Form: ${behind.map((result) => FORM_WORD[result] ?? result).join(', ')}`;
          return ahead === 0 ? played : `${played}. ${ahead} still to play`;
        })(),
      ),
    ],
    results.map((result) =>
      h.span([...getStyleXAttributes(h, styles.formSquare, FORM_STYLE[result] ?? null)], []),
    ),
  );
};

const standingsPanel = (league: string, highlightTeam: Option.Option<string>): Html => {
  const rows = standingsFor(league);
  // The split boundary is competition CONFIGURATION, not a row index typed
  // into the view — a league that splits elsewhere, or not at all, says so
  // in its season shape and this follows.
  const splitAfter = Option.getOrUndefined(
    Option.flatMap(competitionShapeForLeague(league), (shape) =>
      Option.fromUndefinedOr(shape.splitAfter),
    ),
  );
  return h.section(
    [h.Id(STANDINGS_ANCHOR), ...getStyleXAttributes(h, styles.standingsSection)],
    [
      // The landing page's section grammar, not a caption inside a card
      // (user call): the pink chip introduces the section from the content
      // grid's left edge, and the table below runs straight on the page's
      // own paper with its row rules as the only structure.
      standingsHeading(),
      // Only the two right-hand columns are labelled. Position and club need
      // no header — nothing else a standings row could open with.
      h.div(
        [...getStyleXAttributes(h, shared.metaText, styles.standingsHeader), h.AriaHidden(true)],
        [
          h.span([...getStyleXAttributes(h, styles.standingsHeaderForm)], ['Form']),
          h.span([...getStyleXAttributes(h, styles.standingsHeaderPoints)], ['P']),
        ],
      ),
      h.ol(
        [...getStyleXAttributes(h, styles.standingsList)],
        rows.map((row, index) => {
          const highlighted = Option.contains(highlightTeam, row.team);
          const face = clubRowFace(row.team);
          const position = index + 1;
          return h.li(
            [
              ...getStyleXAttributes(
                h,
                styles.standingsRow,
                highlighted ? styles.standingsRowHighlighted : styles.standingsRowRest,
                position === splitAfter ? styles.standingsSplitBoundary : null,
              ),
            ],
            [
              // The WHOLE row is the link (user call) — a club is one target,
              // not a name you have to hit inside a wider strip.
              h.a(
                [
                  ...(face === undefined
                    ? []
                    : [h.Href(clubRouter({ slug: face.slug })), h.AriaLabel(face.shortName)]),
                  ...getStyleXAttributes(h, styles.standingsRowLink),
                ],
                [
                  h.span(
                    [
                      ...getStyleXAttributes(
                        h,
                        shared.display,
                        styles.standingsRank,
                        highlighted ? styles.standingsRankHighlighted : styles.standingsRankRest,
                      ),
                    ],
                    [`${position}.`],
                  ),
                  ...(face === undefined
                    ? []
                    : [
                        h.img([
                          h.Src(face.crest),
                          h.Alt(''),
                          h.Loading('lazy'),
                          ...getStyleXAttributes(h, styles.standingsCrest),
                        ]),
                      ]),
                  h.span(
                    [...getStyleXAttributes(h, styles.standingsNameBlock)],
                    [
                      h.span(
                        [...getStyleXAttributes(h, shared.display, styles.standingsTeam)],
                        [face?.shortName ?? row.team],
                      ),
                      h.span(
                        [
                          ...getStyleXAttributes(
                            h,
                            shared.metaText,
                            styles.standingsPlayed,
                            highlighted ? styles.standingsPlayedHighlighted : null,
                          ),
                        ],
                        [`${row.played} played`],
                      ),
                    ],
                  ),
                  formStrip(league, row.team),
                  h.span(
                    [
                      ...getStyleXAttributes(
                        h,
                        styles.standingsPoints,
                        highlighted ? null : styles.standingsPointsPink,
                      ),
                    ],
                    [`${row.points}`],
                  ),
                ],
              ),
            ],
          );
        }),
      ),
    ],
  );
};

const competitionStandingsPanel = (competition: Competition): Html =>
  M.value(competition.standings).pipe(
    M.withReturnType<Html>(),
    M.tagsExhaustive({
      TableStandings: ({ league }) => standingsPanel(league, Option.none()),
      TiesStandings: ({ rows }) =>
        h.section(
          [h.Id(STANDINGS_ANCHOR), ...getStyleXAttributes(h, styles.standingsSection)],
          [
            standingsHeading(),
            h.ol(
              [...getStyleXAttributes(h, styles.list)],
              rows.map((tie) =>
                h.li(
                  [...getStyleXAttributes(h, styles.tieRow)],
                  [
                    h.span(
                      [...getStyleXAttributes(h, shared.display, styles.tiePrimary)],
                      [tie.primary],
                    ),
                    h.span([...getStyleXAttributes(h, styles.tieSecondary)], [tie.secondary]),
                  ],
                ),
              ),
            ),
          ],
        ),
    }),
  );

const competitionFormatPanel = (competition: Competition): Html =>
  h.section(
    [...getStyleXAttributes(h, shared.panel, styles.panelBody)],
    [
      sectionLabel('How it works'),
      h.ol(
        [...getStyleXAttributes(h, styles.list)],
        competition.format.map((rule, index) =>
          h.li(
            [...getStyleXAttributes(h, styles.formatRow)],
            [
              h.span(
                [...getStyleXAttributes(h, shared.display, styles.formatNumber)],
                [`0${index + 1}`],
              ),
              h.p([...getStyleXAttributes(h, styles.formatRule)], [rule]),
            ],
          ),
        ),
      ),
    ],
  );

const competitionHistoryPanel = (competition: Competition): Html =>
  h.section(
    [...getStyleXAttributes(h, shared.panel, styles.panelBody)],
    [
      sectionLabel('History in numbers'),
      h.ul(
        [...getStyleXAttributes(h, styles.historyGrid)],
        competition.history.map((stat) =>
          h.li(
            [],
            [
              pinkTick(),
              h.p([...getStyleXAttributes(h, shared.display, styles.historyValue)], [stat.value]),
              h.p([...getStyleXAttributes(h, styles.historyLabel)], [stat.label]),
            ],
          ),
        ),
      ),
    ],
  );

// MATCHES, round by round — a round-robin generated straight from the
// league’s standings teams (circle method), so the schedule can never
// drift from the table. Scores are deterministic mock (seeded by
// competition + round + match); rounds past the current matchday show as
// upcoming. The arrows page through the rounds.

export const matchesPanel = (competition: Competition, model: Model): Html =>
  M.value(competition.standings).pipe(
    M.withReturnType<Html>(),
    M.tagsExhaustive({
      // Knockout competitions have no round-robin to page — nothing renders.
      TiesStandings: () => h.empty,
      TableStandings: ({ league }) => leagueMatchesPanel(competition, league, model),
    }),
  );

const leagueMatchesPanel = (competition: Competition, league: string, model: Model): Html => {
  const rounds = leagueRounds(league);
  const total = rounds.length;
  // Always in range — SelectedCompetitionRound clamps in `update` (no entry
  // for this competition = its current matchday). Reading the round under
  // the competition’s own slug is what lets the two panels on /matches page
  // independently.
  const open = Option.getOrElse(
    Record.get(model.competitionRounds, competition.slug),
    () => MATCHDAYS_PLAYED,
  );
  const matches = rounds[open - 1] ?? [];
  const arrow = (target: number, glyph: string, label: string): Html => {
    const blocked = target < 1 || target > total;
    // Ui.Button’s isDisabled is exactly this end-stop’s contract: aria-disabled
    // and no click handler, but NEVER the native attribute — an end-stop that
    // drops out of the tab order mid-interaction strands keyboard focus. The two
    // looks stay disjoint styles: they disagree on every property they set, and
    // a single merged style would let whichever properties spread later win
    // silently.
    return Button.view({
      isDisabled: blocked,
      ...(blocked
        ? {}
        : { onClick: SelectedCompetitionRound({ slug: competition.slug, round: target }) }),
      toView: ({ button }) =>
        h.button(
          [
            ...button,
            h.AriaLabel(label),
            ...getStyleXAttributes(
              h,
              shared.display,
              styles.arrow,
              blocked ? styles.arrowBlocked : styles.arrowLive,
            ),
          ],
          [glyph],
        ),
    });
  };
  return h.section(
    [...getStyleXAttributes(h, shared.panel, styles.panelBody)],
    [
      h.div(
        [...getStyleXAttributes(h, styles.matchesHeader)],
        [
          sectionLabel(`Matches — Round ${open} of ${total}`),
          h.div(
            [...getStyleXAttributes(h, styles.arrowRow)],
            [arrow(open - 1, '←', 'Previous round'), arrow(open + 1, '→', 'Next round')],
          ),
        ],
      ),
      h.ul(
        [...getStyleXAttributes(h, styles.list)],
        matches.map(([home, away]) => {
          const played = open <= MATCHDAYS_PLAYED;
          const [homeGoals, awayGoals] = mockScore(fixtureSeed(league, open, home, away));
          return h.li(
            [...getStyleXAttributes(h, styles.matchRow)],
            [
              h.span([...getStyleXAttributes(h, styles.matchTeam, styles.matchTeamHome)], [home]),
              played
                ? h.span(
                    [...getStyleXAttributes(h, shared.display, styles.scoreChip)],
                    [`${homeGoals}–${awayGoals}`],
                  )
                : h.span([...getStyleXAttributes(h, shared.display, styles.vsChip)], ['vs']),
              h.span([...getStyleXAttributes(h, styles.matchTeam)], [away]),
            ],
          );
        }),
      ),
    ],
  );
};

// The edition picker — one chip per season, newest first, the open one pink.
// Past editions swap the standings panel for the archive card. A real
// radiogroup, not the per-button AriaPressed toggle it wore before (mutually
// exclusive, so single-select). The Model holds None for the current edition,
// so the selected value is resolved to the real label, and a pick of the
// current edition maps back to '' on the wire (the handler folds it to None).
const editionRadioGroup = (competition: Competition, model: Model): Html => {
  const currentLabel = competition.editions.find((entry) => entry.isCurrent)?.label ?? '';
  const openLabel = Option.getOrElse(model.competitionEdition, () => currentLabel);
  return RadioGroup.view<string, Message>({
    id: 'competition-edition',
    selectedValue: Option.some(openLabel),
    options: competition.editions.map((entry) => entry.label),
    ariaLabel: 'Competition edition',
    onSelect: (label) => SelectedCompetitionEdition({ label: label === currentLabel ? '' : label }),
    toView: ({ group, options }) =>
      h.div(
        [...group, ...getStyleXAttributes(h, styles.editionGroup)],
        options.map((option) => {
          // Checked derives from the model because StyleX has no attribute
          // selectors (the component still stamps data-checked).
          const checked = option.value === openLabel;
          return h.div(
            [
              ...option.option,
              ...getStyleXAttributes(
                h,
                styles.editionOption,
                checked ? styles.editionChecked : styles.editionRest,
              ),
            ],
            [option.value],
          );
        }),
      ),
  });
};

// The archive BLOCK — the picker plus the heading that earns it a place at
// the foot of the page. Under the hero the chips explained themselves by
// position; closing the page they need saying what they are.
const editionArchive = (competition: Competition, model: Model): Html =>
  h.section(
    [...getStyleXAttributes(h, styles.archive)],
    [sectionLabel('Archive'), editionRadioGroup(competition, model)],
  );

// A finished edition’s card — the champion holds the stage until the full
// per-season archive lands with the real data.
const editionArchivePanel = (competition: Competition, open: Edition): Html =>
  h.section(
    [...getStyleXAttributes(h, shared.panel, styles.panelBody)],
    [
      sectionLabel(`Edition ${open.label}`),
      h.p([...getStyleXAttributes(h, shared.display, styles.archiveDetail)], [open.detail]),
      h.p(
        [...getStyleXAttributes(h, styles.archiveNote)],
        ['Standings, results, and stats for this edition arrive with the real data.'],
      ),
    ],
  );

export const view = (competition: Competition, model: Model): Html => {
  const heroArt = competitionHeroArt[competition.slug];
  return h.div(
    [],
    [
      // A competition with hero artwork opens on the dark act; the rest
      // keep the flat badge-and-title header until their art lands.
      heroArt
        ? competitionHero(competition, heroArt, model)
        : profileHeader(competitionsRouter(), 'All competitions', competition.name, [
            honorChip(competition.tagline),
            mutedChip(competition.stage),
          ]),
      h.div(
        [...getStyleXAttributes(h, styles.stack)],
        [
          ...(Option.isNone(model.competitionEdition)
            ? [competitionStandingsPanel(competition), matchesPanel(competition, model)]
            : [
                editionArchivePanel(
                  competition,
                  competition.editions.find(
                    (entry) => entry.label === Option.getOrNull(model.competitionEdition),
                  ) ??
                    competition.editions[0] ?? { label: '', isCurrent: true, detail: '' },
                ),
              ]),
          h.div(
            [...getStyleXAttributes(h, styles.panelPair)],
            [competitionFormatPanel(competition), competitionHistoryPanel(competition)],
          ),
          // THE ARCHIVE closes the page (user call). It used to sit directly
          // under the hero, where a row of season chips was the first thing
          // between the name and the table people came for. At the foot it
          // reads as what it is: the way out of this season, offered after
          // this season has been read.
          editionArchive(competition, model),
        ],
      ),
    ],
  );
};

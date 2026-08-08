import { Button, Input } from '@foldkit/ui';
import { Array } from 'effect';
import { html } from 'foldkit/html';
import type { Html } from 'foldkit/html';

import { tickerSpark } from '../components';
import { clubs, featuredClubs } from '../data';
import type { Club, FeaturedClub } from '../data';
import { SelectedFeaturedClub, UpdatedClubQuery } from '../message';
import type { Message } from '../message';
import type { Model } from '../model';
import { clubRouter } from '../route';
import { clubEurope } from '../standings';
import { getStyleXAttributes, getStyleXAttributesWith } from '../stylexAttributes';
import type { StyleXStyle } from '../stylexAttributes';
import { styles } from '../styles/clubs';
import { shared } from '../styles/shared';

const h = html<Message>();

const clubBySlug = (slug: string): Club | undefined =>
  clubs.find((candidate) => candidate.slug === slug);

// THE MARQUEE TAPE, derived twice over. The hero’s bottom edge loops the
// contenders' names on a tilted PINK TAPE — the landing marquee’s louder
// cousin — and it used to hand-type them: "Sparta Praha", "Slavia Praha",
// "Slovan Liberec", "UWCL 2025/26", four literals inside a function that
// already resolves names from the clubs table three lines above. Both halves
// had gone wrong. A typed name drifts against the table (the ticker’s "FK
// Pardubice" did, for a club the table calls "Pardubice"), and the single UWCL
// line was flatly wrong for Liberec: clubEurope puts them in the Europa Cup,
// as does the UWEC page a click away. Reading the names off the table and the
// competitions off clubEurope makes both mistakes unrepresentable — the tape
// cannot name a club the season canon doesn’t, or a competition its clubs
// aren’t in.
const contenderCompetitions: ReadonlyArray<string> = Array.dedupe(
  featuredClubs.flatMap((entry) => {
    const campaign = clubEurope[entry.slug];
    return campaign === undefined ? [] : [campaign.slug.toUpperCase()];
  }),
);

// The empty join drops out rather than leaving a leading space, so a featured
// club with no European campaign costs the tape a name, not its shape.
export const contenderPhrases: ReadonlyArray<string> = [
  'European contenders',
  ...featuredClubs.map((entry) => clubBySlug(entry.slug)?.name ?? ''),
  [contenderCompetitions.join(' & '), '2025/26'].filter((part) => part !== '').join(' '),
];

const featuredArtwork = (entry: FeaturedClub, club: Club | undefined): Html =>
  entry.photo === ''
    ? h.div(
        [...getStyleXAttributes(h, styles.artworkFallback)],
        [
          h.img([
            h.Src(club?.logo ?? ''),
            h.Alt(''),
            h.Loading('lazy'),
            ...getStyleXAttributes(h, styles.artworkLogo),
          ]),
        ],
      )
    : h.img([
        h.Src(entry.photo),
        h.Alt(''),
        h.Loading('lazy'),
        ...getStyleXAttributes(h, styles.artworkPhoto),
        h.Style({ 'object-position': entry.focus }),
      ]);

const carouselArrow = (target: number, glyph: string, label: string): Html =>
  Button.view({
    onClick: SelectedFeaturedClub({ index: target }),
    toView: ({ button }) =>
      h.button(
        [
          ...button,
          h.AriaLabel(label),
          ...getStyleXAttributes(h, shared.display, styles.carouselArrow),
        ],
        [glyph],
      ),
  });

const europeanContenders = (model: Model): Html => {
  const count = featuredClubs.length;
  // Always in range — SelectedFeaturedClub wraps in `update`.
  const active = model.featuredClub;
  const previous = (active + count - 1) % count;
  const next = (active + 1) % count;
  const entryAt = (index: number): FeaturedClub =>
    featuredClubs[index] ?? { slug: '', epithet: '', photo: '', focus: '50% 50%' };
  const clubAt = (index: number): Club | undefined => clubBySlug(entryAt(index).slug);
  const ghost = (index: number, alignment: StyleXStyle): Html =>
    h.div(
      [...getStyleXAttributes(h, styles.ghost, alignment)],
      [
        h.p([...getStyleXAttributes(h, styles.ghostEpithet)], [entryAt(index).epithet]),
        h.p(
          [...getStyleXAttributes(h, shared.display, styles.ghostName)],
          [clubAt(index)?.name ?? ''],
        ),
      ],
    );
  const marqueeRun = (hidden: boolean): Html =>
    h.div(
      [...getStyleXAttributes(h, styles.marqueeRun), ...(hidden ? [h.AriaHidden(true)] : [])],
      contenderPhrases.flatMap((phrase) => [
        h.span([...getStyleXAttributes(h, shared.display, styles.marqueePhrase)], [phrase]),
        h.span([...getStyleXAttributes(h, styles.marqueeStar), h.AriaHidden(true)], ['✦']),
      ]),
    );
  return h.section(
    // IMMERSIVE hero (user call — the boxed chip+band read as "just put
    // in", then "GET CRAZY"): full-bleed ink that swallows the main
    // container’s top padding so the stage flows straight out of the
    // black header chrome; a giant outline club name roars behind the
    // stage, the artwork rides a pink offset frame, film grain sits over
    // everything, and a tilted pink tape closes the band.
    [...getStyleXAttributes(h, styles.hero)],
    [
      h.div(
        [...getStyleXAttributes(h, styles.heroInner)],
        [
          h.p(
            [...getStyleXAttributes(h, styles.kicker)],
            [tickerSpark, 'European contenders', tickerSpark],
          ),
          // STAGE — the neighbors peek dimmed from the edges, the active
          // artwork holds the center. Keyed so each switch replays the
          // screen slide-in.
          h.div(
            [...getStyleXAttributes(h, styles.stage)],
            [
              // The active club’s name SCREAMS as a giant outline rising
              // from behind the artwork’s top edge, through the kicker.
              h.div(
                [
                  h.Key(`shout-${entryAt(active).slug}`),
                  ...getStyleXAttributesWith(h, 'screen', styles.shout),
                  h.AriaHidden(true),
                ],
                [
                  h.span(
                    [...getStyleXAttributes(h, shared.display, styles.shoutName)],
                    [(clubAt(active)?.name ?? '').split(' ')[0] ?? ''],
                  ),
                ],
              ),
              h.div(
                [
                  ...getStyleXAttributes(h, styles.neighbor, styles.neighborLeft),
                  h.AriaHidden(true),
                ],
                [featuredArtwork(entryAt(previous), clubAt(previous))],
              ),
              h.div(
                [
                  ...getStyleXAttributes(h, styles.neighbor, styles.neighborRight),
                  h.AriaHidden(true),
                ],
                [featuredArtwork(entryAt(next), clubAt(next))],
              ),
              // The artwork rides a pink OFFSET FRAME — the brutalist
              // double-exposure edge.
              h.div(
                [...getStyleXAttributes(h, styles.frame)],
                [
                  h.div([...getStyleXAttributes(h, styles.offsetFrame), h.AriaHidden(true)], []),
                  h.a(
                    [
                      h.Key(entryAt(active).slug),
                      h.Href(clubRouter({ slug: entryAt(active).slug })),
                      ...getStyleXAttributesWith(h, 'screen', styles.activeArtwork),
                    ],
                    [featuredArtwork(entryAt(active), clubAt(active))],
                  ),
                ],
              ),
              h.div(
                [...getStyleXAttributes(h, styles.arrowSlot, styles.arrowSlotLeft)],
                [carouselArrow(active - 1, '←', 'Previous club')],
              ),
              h.div(
                [...getStyleXAttributes(h, styles.arrowSlot, styles.arrowSlotRight)],
                [carouselArrow(active + 1, '→', 'Next club')],
              ),
            ],
          ),
          // PLAQUE ROW — the nameplate overlaps the artwork; neighbors
          // ghost at the far sides.
          h.div(
            [...getStyleXAttributes(h, styles.plaqueRow)],
            [
              ghost(previous, styles.ghostStart),
              h.div(
                [
                  h.Key(`plaque-${entryAt(active).slug}`),
                  ...getStyleXAttributesWith(h, 'screen', styles.plaque),
                ],
                [
                  h.div(
                    [...getStyleXAttributes(h, styles.plaqueSparkRow)],
                    [
                      h.span(
                        [...getStyleXAttributes(h, shared.display, styles.plaqueSpark)],
                        [tickerSpark],
                      ),
                    ],
                  ),
                  h.p([...getStyleXAttributes(h, styles.plaqueEpithet)], [entryAt(active).epithet]),
                  h.h2(
                    [...getStyleXAttributes(h, shared.display, styles.plaqueName)],
                    [clubAt(active)?.name ?? ''],
                  ),
                  h.div([...getStyleXAttributes(h, styles.plaqueRule)], []),
                ],
              ),
              ghost(next, styles.ghostEnd),
            ],
          ),
        ],
      ),
      // The tilted pink tape — full-bleed, slightly rotated, looping the
      // contenders. Oversized width hides the rotation’s corner gaps.
      h.div(
        [...getStyleXAttributesWith(h, 'ticker', styles.tape)],
        [
          h.div(
            [h.Class('ticker-row'), h.Style({ 'animation-duration': '26s' })],
            [marqueeRun(false), marqueeRun(true)],
          ),
        ],
      ),
      // Film grain over the whole band — the landing hero’s skin.
      h.div([...getStyleXAttributesWith(h, 'grain', styles.grainOverlay), h.AriaHidden(true)], []),
    ],
  );
};

// Diacritics-insensitive match, so "slovacko" finds Slovácko.
const normalizeQuery = (value: string): string =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');

export const view = (model: Model): Html => {
  const query = normalizeQuery(model.clubQuery.trim());
  const filtered =
    query === ''
      ? clubs
      : clubs.filter((entry) =>
          normalizeQuery(`${entry.name} ${entry.city} ${entry.league}`).includes(query),
        );
  return h.div(
    [],
    [
      // No canonical intro here (user call): the page OPENS on the
      // immersive contenders hero, flowing straight from the header. The
      // h1 stays for screen readers only; the active nav tab carries the
      // visual "you are here".
      h.h1([...getStyleXAttributes(h, shared.srOnly)], ['Clubs']),
      europeanContenders(model),
      // The search box is unlabeled visually by design, so the real <label>
      // is sr-only — the accessible name stays "Search clubs" without adding
      // a visible caption above the field.
      Input.view({
        id: 'clubs-search',
        type: 'search',
        placeholder: 'Search clubs…',
        value: model.clubQuery,
        onInput: (value) => UpdatedClubQuery({ query: value }),
        toView: (attributes) =>
          h.div(
            [...getStyleXAttributes(h, styles.searchWrapper)],
            [
              h.label(
                [...attributes.label, ...getStyleXAttributes(h, shared.srOnly)],
                ['Search clubs'],
              ),
              // No outline styling here, deliberately. The pink focus ring
              // is global: styles.css declares `:focus-visible` OUTSIDE any
              // `@layer`, so it is the only voice on the property and fields
              // do not restyle outlines. The border tint is the field’s own
              // addition on top.
              h.input([...attributes.input, ...getStyleXAttributes(h, styles.searchInput)]),
            ],
          ),
      }),
      ...(Array.isReadonlyArrayEmpty(filtered)
        ? [
            h.p(
              // Role('status') announces the empty result to AT when it
              // appears — visually it just showed up under the search box.
              [h.Role('status'), ...getStyleXAttributes(h, styles.emptyState)],
              [`No club matches “${model.clubQuery.trim()}”.`],
            ),
          ]
        : []),
      h.div(
        [...getStyleXAttributes(h, styles.grid)],
        filtered.map((entry) => {
          const played = entry.won + entry.drawn + entry.lost;
          // Keyed by the club slug: the grid re-filters as the search box
          // changes, so identity-patching keeps each card (and its handlers)
          // bound to its own club instead of shifting by position.
          return h.keyed('a')(
            entry.slug,
            [
              h.Href(clubRouter({ slug: entry.slug })),
              ...getStyleXAttributes(h, shared.panel, styles.card),
            ],
            [
              h.div(
                [...getStyleXAttributes(h, styles.cardHead)],
                [
                  h.img([
                    h.Src(entry.logo),
                    h.Alt(`${entry.name} crest`),
                    h.Loading('lazy'),
                    ...getStyleXAttributes(h, styles.crest),
                  ]),
                  h.span([...getStyleXAttributes(h, styles.leagueTag)], [entry.league]),
                ],
              ),
              h.h2([...getStyleXAttributes(h, shared.display, styles.cardName)], [entry.name]),
              h.div(
                [...getStyleXAttributes(h, styles.formBar)],
                [
                  h.div(
                    [
                      ...getStyleXAttributes(h, styles.formWins),
                      h.Style({ width: `${(entry.won / played) * 100}%` }),
                    ],
                    [],
                  ),
                  // INK tints, not paper. These segments date from the dark
                  // build; on the paper panel this card actually sits on,
                  // the paper tints were invisible, so the form bar read as
                  // a pink stub that stopped short of the card. The losses
                  // tint is 25% rather than 10% for the same reason at a
                  // smaller scale: at 10% a club with few defeats still
                  // showed a bar that appeared to end early.
                  h.div(
                    [
                      ...getStyleXAttributes(h, styles.formDraws),
                      h.Style({ width: `${(entry.drawn / played) * 100}%` }),
                    ],
                    [],
                  ),
                  h.div(
                    [
                      ...getStyleXAttributes(h, styles.formLosses),
                      h.Style({ width: `${(entry.lost / played) * 100}%` }),
                    ],
                    [],
                  ),
                ],
              ),
              h.p(
                [...getStyleXAttributes(h, styles.formCaption)],
                [`${entry.won}W — ${entry.drawn}D — ${entry.lost}L`],
              ),
            ],
          );
        }),
      ),
    ],
  );
};

import { Input } from '@foldkit/ui';
import { html } from 'foldkit/html';
import type { Html } from 'foldkit/html';

import spartaPhoto from '../assets/trending/sparta.jpg';
import { panel, tickerSpark } from '../components';
import { clubs } from '../data';
import type { Club } from '../data';
import { SelectedFeaturedClub, UpdatedClubQuery } from '../message';
import type { Message } from '../message';
import type { Model } from '../model';
import { clubRouter } from '../route';

const h = html<Message>();

interface FeaturedClub {
  readonly slug: string;
  // The Universe-style kicker line above the name.
  readonly epithet: string;
  // '' until the user supplies the artwork — the crest carries the slot.
  readonly photo: string;
  readonly focus: string;
}

const featuredClubs: ReadonlyArray<FeaturedClub> = [
  { slug: 'sparta-praha', epithet: 'The record champions', photo: spartaPhoto, focus: '50% 30%' },
  { slug: 'slavia-praha', epithet: 'The eternal rivals', photo: '', focus: '50% 30%' },
  { slug: 'slovan-liberec', epithet: 'The pride of the north', photo: '', focus: '50% 30%' },
];

const featuredArtwork = (entry: FeaturedClub, club: Club | undefined): Html =>
  entry.photo === ''
    ? h.div(
        [h.Class('flex h-full w-full items-center justify-center bg-panel')],
        [
          h.img([
            h.Src(club?.logo ?? ''),
            h.Alt(''),
            h.Loading('lazy'),
            h.Class('h-28 w-28 object-contain md:h-40 md:w-40'),
          ]),
        ],
      )
    : h.img([
        h.Src(entry.photo),
        h.Alt(''),
        h.Loading('lazy'),
        h.Class('h-full w-full object-cover'),
        h.Style({ 'object-position': entry.focus }),
      ]);

const carouselArrow = (target: number, glyph: string, label: string): Html =>
  h.button(
    [
      h.Type('button'),
      h.AriaLabel(label),
      h.OnClick(SelectedFeaturedClub({ index: target })),
      h.Class(
        'display flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full border border-paper/30 bg-ink/60 text-lg text-paper backdrop-blur-[2px] transition-colors hover:border-pink hover:text-pink',
      ),
    ],
    [glyph],
  );

const europeanContenders = (model: Model): Html => {
  const count = featuredClubs.length;
  const active = ((model.featuredClub % count) + count) % count;
  const previous = (active + count - 1) % count;
  const next = (active + 1) % count;
  const entryAt = (index: number): FeaturedClub =>
    featuredClubs[index] ?? { slug: '', epithet: '', photo: '', focus: '50% 50%' };
  const clubAt = (index: number): Club | undefined =>
    clubs.find((candidate) => candidate.slug === entryAt(index).slug);
  const ghost = (index: number, alignment: string): Html =>
    h.div(
      [h.Class(`hidden min-w-0 flex-1 flex-col gap-2 lg:flex ${alignment}`)],
      [
        h.p(
          [h.Class('text-[10px] leading-none tracking-[0.3em] text-paper/25 uppercase')],
          [entryAt(index).epithet],
        ),
        h.p(
          [h.Class('display text-3xl leading-none tracking-[0.02em] text-paper/20 uppercase')],
          [clubAt(index)?.name ?? ''],
        ),
      ],
    );
  // The marquee run — the hero's bottom edge is a tilted PINK TAPE
  // looping the contenders' names, the landing marquee's louder cousin.
  const marqueePhrases = [
    'European contenders',
    'Sparta Praha',
    'Slavia Praha',
    'Slovan Liberec',
    'UWCL 2025/26',
  ];
  const marqueeRun = (hidden: boolean): Html =>
    h.div(
      [h.Class('flex items-center gap-6 pr-6'), ...(hidden ? [h.AriaHidden(true)] : [])],
      marqueePhrases.flatMap((phrase) => [
        h.span(
          [
            h.Class(
              'display text-lg leading-none tracking-[0.12em] whitespace-nowrap uppercase text-ink',
            ),
          ],
          [phrase],
        ),
        h.span([h.Class('text-sm leading-none text-ink'), h.AriaHidden(true)], ['✦']),
      ]),
    );
  return h.section(
    // IMMERSIVE hero (user call — the boxed chip+band read as "just put
    // in", then "GET CRAZY"): full-bleed ink that swallows the main
    // container's top padding (-mt) so the stage flows straight out of
    // the black header chrome; a giant outline club name roars behind the
    // stage, the artwork rides a pink offset frame, film grain sits over
    // everything, and a tilted pink tape closes the band.
    [h.Class('relative -mt-10 mx-[calc(50%-50vw)] overflow-hidden bg-ink pb-8 md:-mt-14')],
    [
      h.div(
        [h.Class('relative mx-auto max-w-7xl px-5 md:px-10')],
        [
          h.p(
            [
              h.Class(
                'flex items-center justify-center gap-3 pt-8 pb-6 text-[11px] leading-none tracking-[0.35em] text-paper/60 uppercase md:pt-10 md:text-xs',
              ),
            ],
            [tickerSpark, 'European contenders', tickerSpark],
          ),
          // STAGE — the neighbors peek dimmed from the edges, the active
          // artwork holds the center. Keyed so each switch replays the
          // screen slide-in.
          h.div(
            [h.Class('relative h-80 md:h-[28rem]')],
            [
              // The active club's name SCREAMS as a giant outline rising
              // from behind the artwork's top edge, through the kicker.
              h.div(
                [
                  h.Key(`shout-${entryAt(active).slug}`),
                  h.Class(
                    'screen pointer-events-none absolute inset-x-0 -top-16 flex justify-center select-none md:-top-28',
                  ),
                  h.AriaHidden(true),
                ],
                [
                  h.span(
                    [
                      h.Class(
                        'display text-[7rem] leading-none whitespace-nowrap text-transparent uppercase [-webkit-text-stroke:2px_rgba(243,239,232,0.16)] md:text-[15rem]',
                      ),
                    ],
                    [(clubAt(active)?.name ?? '').split(' ')[0] ?? ''],
                  ),
                ],
              ),
              h.div(
                [
                  h.Class(
                    'absolute inset-y-10 left-[-8%] w-[16%] opacity-30 brightness-50 grayscale md:inset-y-6 md:left-[-14%] md:w-[22%]',
                  ),
                  h.AriaHidden(true),
                ],
                [featuredArtwork(entryAt(previous), clubAt(previous))],
              ),
              h.div(
                [
                  h.Class(
                    'absolute inset-y-10 right-[-8%] w-[16%] opacity-30 brightness-50 grayscale md:inset-y-6 md:right-[-14%] md:w-[22%]',
                  ),
                  h.AriaHidden(true),
                ],
                [featuredArtwork(entryAt(next), clubAt(next))],
              ),
              // The artwork rides a pink OFFSET FRAME — the brutalist
              // double-exposure edge.
              h.div(
                [h.Class('relative mx-auto h-full w-[84%] md:w-[72%]')],
                [
                  h.div(
                    [
                      h.Class(
                        'absolute inset-0 translate-x-2.5 translate-y-2.5 border-2 border-pink md:translate-x-4 md:translate-y-4',
                      ),
                      h.AriaHidden(true),
                    ],
                    [],
                  ),
                  h.a(
                    [
                      h.Key(entryAt(active).slug),
                      h.Href(clubRouter({ slug: entryAt(active).slug })),
                      h.Class('screen relative block h-full w-full'),
                    ],
                    [featuredArtwork(entryAt(active), clubAt(active))],
                  ),
                ],
              ),
              h.div(
                [h.Class('absolute inset-y-0 left-0 flex items-center md:left-[2%] lg:left-[6%]')],
                [carouselArrow(active - 1, '←', 'Previous club')],
              ),
              h.div(
                [
                  h.Class(
                    'absolute inset-y-0 right-0 flex items-center md:right-[2%] lg:right-[6%]',
                  ),
                ],
                [carouselArrow(active + 1, '→', 'Next club')],
              ),
            ],
          ),
          // PLAQUE ROW — the nameplate overlaps the artwork; neighbors
          // ghost at the far sides.
          h.div(
            [h.Class('relative z-10 -mt-14 flex items-end gap-8 md:-mt-16')],
            [
              ghost(previous, 'items-start text-left'),
              h.div(
                [
                  h.Key(`plaque-${entryAt(active).slug}`),
                  h.Class(
                    'screen mx-auto w-[min(100%,24rem)] shrink-0 border border-paper/15 bg-ink px-8 pt-8 pb-7 text-center',
                  ),
                ],
                [
                  h.div(
                    [h.Class('flex justify-center text-pink')],
                    [h.span([h.Class('display text-2xl leading-none')], [tickerSpark])],
                  ),
                  h.p(
                    [
                      h.Class(
                        'mt-4 text-[11px] leading-none tracking-[0.3em] text-paper/70 uppercase',
                      ),
                    ],
                    [entryAt(active).epithet],
                  ),
                  h.h2(
                    [h.Class('display mt-3 text-3xl leading-none text-paper md:text-4xl')],
                    [clubAt(active)?.name ?? ''],
                  ),
                  h.div([h.Class('mx-auto mt-5 h-[3px] w-10 bg-pink')], []),
                ],
              ),
              ghost(next, 'items-end text-right'),
            ],
          ),
        ],
      ),
      // The tilted pink tape — full-bleed, slightly rotated, looping the
      // contenders. Oversized width hides the rotation's corner gaps.
      h.div(
        [h.Class('ticker mt-10 -mx-[2%] w-[104%] -rotate-1 bg-pink py-2.5')],
        [
          h.div(
            [h.Class('ticker-row'), h.Style({ 'animation-duration': '26s' })],
            [marqueeRun(false), marqueeRun(true)],
          ),
        ],
      ),
      // Film grain over the whole band — the landing hero's skin.
      h.div([h.Class('grain pointer-events-none absolute inset-0'), h.AriaHidden(true)], []),
    ],
  );
};

// Diacritics-insensitive match, so "slovacko" finds Slovácko.
const normalizeQuery = (value: string): string =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');

export const clubsScreen = (model: Model): Html => {
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
      h.h1([h.Class('sr-only')], ['Clubs']),
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
            [h.Class('mt-10')],
            [
              h.label([...attributes.label, h.Class('sr-only')], ['Search clubs']),
              h.input([
                ...attributes.input,
                h.Class(
                  'w-full border-2 border-ink/15 bg-transparent px-5 py-3.5 text-base text-ink transition-colors placeholder:text-ink/35 focus:border-pink focus:outline-none',
                ),
              ]),
            ],
          ),
      }),
      ...(filtered.length === 0
        ? [
            h.p(
              [h.Class('mt-10 text-sm text-ink/50')],
              [`No club matches “${model.clubQuery.trim()}”.`],
            ),
          ]
        : []),
      h.div(
        [h.Class('mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4')],
        filtered.map((entry) => {
          const played = entry.won + entry.drawn + entry.lost;
          // Keyed by the club slug: the grid re-filters as the search box
          // changes, so identity-patching keeps each card (and its handlers)
          // bound to its own club instead of shifting by position.
          return h.keyed('a')(
            entry.slug,
            [
              h.Href(clubRouter({ slug: entry.slug })),
              h.Class(`${panel} group block p-6 transition-colors hover:border-pink`),
            ],
            [
              h.div(
                [h.Class('flex items-start justify-between gap-4')],
                [
                  h.img([
                    h.Src(entry.logo),
                    h.Alt(`${entry.name} crest`),
                    h.Loading('lazy'),
                    h.Class('h-14 w-14 object-contain'),
                  ]),
                  h.span(
                    [h.Class('text-[10px] tracking-[0.2em] uppercase text-ink/40')],
                    [entry.league],
                  ),
                ],
              ),
              h.h2([h.Class('display mt-5 text-2xl text-ink')], [entry.name]),
              h.div(
                [h.Class('mt-4 flex h-1 overflow-hidden')],
                [
                  h.div(
                    [h.Class('bg-pink'), h.Style({ width: `${(entry.won / played) * 100}%` })],
                    [],
                  ),
                  h.div(
                    [
                      h.Class('bg-paper/40'),
                      h.Style({ width: `${(entry.drawn / played) * 100}%` }),
                    ],
                    [],
                  ),
                  h.div(
                    [h.Class('bg-paper/10'), h.Style({ width: `${(entry.lost / played) * 100}%` })],
                    [],
                  ),
                ],
              ),
              h.p(
                [h.Class('mt-2 text-[10px] tracking-[0.2em] uppercase text-ink/40')],
                [`${entry.won}W — ${entry.drawn}D — ${entry.lost}L`],
              ),
            ],
          );
        }),
      ),
    ],
  );
};

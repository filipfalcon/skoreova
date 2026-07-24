import { html } from 'foldkit/html';
import type { Html } from 'foldkit/html';

import duoImage from '../assets/duo.webp';
import clsx from 'clsx';

import { container, displayArrow, kicker, maskedLine, revealClass } from '../components';
import { competitions, platformUrl } from '../data';
import type { Competition } from '../data';
import type { Message } from '../message';
import type { Model } from '../model';

const h = html<Message>();

const competitionCard = (model: Model, competition: Competition): Html =>
  h.article(
    [
      h.Class(revealClass(model, `competition-card-${competition.slug}`)),
      h.DataAttribute('reveal', 'up'),
      h.DataAttribute('reveal-key', `competition-card-${competition.slug}`),
    ],
    [
      // The photo is NOT a link — only the label button below navigates, so
      // it alone carries the hover state and the arrow.
      h.div(
        [h.Class('relative')],
        [
          // The zoom reveal's clip lives one layer down, NOT on the
          // positioning wrapper — the badge below straddles the photo's
          // corner and an outer overflow-hidden would slice it off.
          h.div(
            [h.Class('overflow-hidden')],
            [
              h.div(
                [
                  h.Class(revealClass(model, `competition-photo-${competition.slug}`)),
                  h.DataAttribute('reveal', 'zoom'),
                  h.DataAttribute('reveal-key', `competition-photo-${competition.slug}`),
                  h.Style({ '--reveal-delay': '0.1s' }),
                ],
                [
                  h.img([
                    h.Src(competition.image),
                    h.Alt(competition.alt),
                    h.Loading('lazy'),
                    h.Class('aspect-square w-full object-cover'),
                  ]),
                ],
              ),
            ],
          ),
          // The competition's brand tile on the photo's top-right corner —
          // the label bar's poking-into-space language mirrored exactly: it
          // straddles VERTICALLY only (up, where there's air between cards)
          // and stays inside horizontally, like the label's `-mt-6 ml-4`.
          // The old two-axis overhang read as a clipped sticker on phones
          // (the photo ends ~4px from the viewport rim there), and once the
          // vertical-only cut existed, the desktop kept it too — one grammar
          // for both card corners everywhere (user call).
          h.img([
            h.Src(competition.badge),
            h.Alt(''),
            h.Loading('lazy'),
            h.Class(
              'pointer-events-none absolute -top-4 right-4 h-12 w-12 md:-top-5 md:right-5 md:h-14 md:w-14',
            ),
          ]),
        ],
      ),
      // `relative z-10` keeps the label painted above the photo — the
      // image's reveal transform creates a stacking context that would
      // otherwise cover the overlapping bar. The label IS the card's button.
      // Paper text on the pink, not the usual ink (user call): every
      // competition badge is a WHITE mark on a colored tile, and the label
      // echoing that (white mark, pink tile) makes the card read as one
      // clickable system. Paper-on-pink is 3.03:1 — AA for LARGE text only,
      // which this display size is; don't copy this pairing to small type.
      // Hover flips to paper bg + ink text, same as the other CTAs.
      h.h3(
        [h.Class('relative z-10 -mt-6 ml-4 inline-block')],
        [
          h.a(
            [
              h.Href(`${platformUrl}/competitions/${competition.slug}`),
              h.Class(
                'display inline-block bg-pink px-4 py-2 text-fluid-3xl-4xl text-paper transition-colors duration-300 hover:bg-paper hover:text-ink active:bg-paper active:text-ink',
              ),
            ],
            [competition.label, displayArrow],
          ),
        ],
      ),
      h.p([h.Class('mt-4 text-sm leading-relaxed text-paper md:text-base')], [competition.copy]),
    ],
  );

export const competitionsView = (model: Model): Html =>
  h.section(
    [
      h.Id('battling-through'),
      h.Class('relative overflow-hidden bg-ink py-16 text-paper md:py-24'),
    ],
    [
      // Dimmed parallax backdrop behind the cards — kept faint enough that
      // the card captions never fight it for legibility.
      h.div(
        [
          // Asymmetric overshoot (20/10, not 15/15): object-fit has no
          // vertical slack here (cover fills the height exactly), so lifting
          // the whole layer is the only way to ride the picture up a notch.
          h.Class('absolute inset-x-0 -top-[20%] -bottom-[10%] opacity-15'),
          h.DataAttribute('parallax', '0.12'),
        ],
        [
          h.img([
            h.Src(duoImage),
            h.Width('2664'),
            h.Height('2008'),
            h.Alt(''),
            h.Loading('lazy'),
            // On phones the visible slice is a ~6% column of the photo (the
            // cover scale rides the tall section), so the position must land
            // ON a player — the gap between them (~40–60%) shows nothing.
            // 60% = the right player's near edge (user pick after walking
            // 55/65/70/80 — the 40–60% band is empty studio and shows
            // nothing at this crop).
            h.Class('h-full w-full object-cover object-[60%_center] md:object-center'),
          ]),
        ],
      ),
      h.div(
        [h.Class(`${container} relative`)],
        [
          kicker(model, '02', 'Battling through', true, '/#battling-through'),
          h.h2(
            [h.Class('mt-10 md:mt-16')],
            [
              maskedLine(
                model,
                'competitions-headline',
                ['How ', h.span([h.Class('text-pink')], ['she']), ' plays.'],
                'text-fluid-6xl-9xl',
                0,
              ),
            ],
          ),
          // No subhead on purpose: "How she plays." is a question and the
          // card grid is its answer — every framing sentence we tried here
          // only delayed it. The competitions speak for themselves.
          // All six cards AND the trailing CTA fire as ONE simultaneous beat
          // keyed off this wrapper, re-arming when it scrolls away
          // ('replay') — the CTA belongs to the grid's moment, not its own
          // later one.
          h.div(
            [h.DataAttribute('reveal-group', 'replay')],
            [
              h.div(
                // Same step as kicker → headline (mt-10/16): with no subhead
                // in between, the cards are the headline's direct answer and
                // follow on the same beat.
                [h.Class('mt-10 grid gap-10 md:mt-16 md:grid-cols-3')],
                competitions.map((competition) => competitionCard(model, competition)),
              ),
              h.div(
                [
                  h.Class(
                    clsx(
                      'mt-14 flex justify-center md:mt-20',
                      revealClass(model, 'competitions-cta'),
                    ),
                  ),
                  h.DataAttribute('reveal', 'up'),
                  h.DataAttribute('reveal-key', 'competitions-cta'),
                ],
                [
                  h.a(
                    [
                      h.Href(`${platformUrl}/competitions`),
                      // Tighter tracking below md: at 0.08em the label needs
                      // 339px against the 335px measure at 375 and wraps by a
                      // hair — 0.04em buys ~20px and keeps it on one line.
                      // Paper text like the section's card labels (large
                      // display type — the pairing is AA at this size only).
                      h.Class(
                        'display inline-block bg-pink px-8 py-4 text-xl tracking-[0.04em] text-paper transition-colors duration-300 hover:bg-paper hover:text-ink active:bg-paper active:text-ink md:text-2xl md:tracking-[0.08em]',
                      ),
                    ],
                    ['Discover all competitions', displayArrow],
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    ],
  );

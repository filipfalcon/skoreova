import { html } from 'foldkit/html';
import type { Html } from 'foldkit/html';

import clsx from 'clsx';

import { container, displayArrowExternal, kicker, maskedLine, revealClass } from '../components';
import { socialChannels } from '../data';
import type { Message } from '../message';
import type { Model } from '../model';

const h = html<Message>();

export const followView = (model: Model): Html =>
  h.section(
    [h.Id('follow'), h.Class('bg-ink py-16 text-paper md:py-24')],
    [
      h.div(
        [h.Class(container)],
        [
          kicker(model, '07', 'Week-in-week-out', true, '/#follow'),
          h.h2(
            [h.Class('mt-10 md:mt-16')],
            [maskedLine(model, 'follow-headline', 'Follow the game.', 'text-fluid-5xl-9xl', 0)],
          ),
          h.ul(
            // ONE reveal beat ('replay' group): on a menu-jump landing the
            // third row sits in the observer's bottom dead zone and never
            // fired on its own (1280×800 first frame ended mid-list) — the
            // group keys every row off the list's own entry instead.
            [
              h.Class('mt-14 border-t border-paper/15 md:mt-20'),
              h.DataAttribute('reveal-group', 'replay'),
            ],
            socialChannels.map((channel, index) =>
              h.li(
                [
                  h.Class(
                    clsx('border-b border-paper/15', revealClass(model, `follow-row-${index}`)),
                  ),
                  h.DataAttribute('reveal', 'up'),
                  h.DataAttribute('reveal-key', `follow-row-${index}`),
                  h.Style({ '--reveal-delay': `${index * 0.08}s` }),
                ],
                [
                  h.a(
                    [
                      h.Href(channel.href),
                      h.Target('_blank'),
                      h.Rel('noopener noreferrer'),
                      h.Class(
                        'social-row group flex items-baseline justify-between gap-4 px-2 py-5 md:py-7',
                      ),
                    ],
                    [
                      h.span(
                        [
                          h.Class(
                            'display text-fluid-4xl-6xl text-paper transition-colors duration-300 group-hover:text-ink',
                          ),
                        ],
                        [channel.name],
                      ),
                      h.span(
                        [
                          h.Class(
                            'text-sm tracking-[0.2em] text-paper/60 transition-colors duration-300 group-hover:text-ink md:text-base',
                          ),
                        ],
                        [channel.handle, displayArrowExternal],
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    ],
  );

import type { Html, HtmlBuilder } from 'foldkit/html';

import { container } from './container';
import type { Message } from './message';
import { policyRouter } from './route';

export const footerView = (isMenuOpen: boolean, h: HtmlBuilder<Message>): Html =>
  h.footer(
    [
      // Isolated like <main>, so its stacking stays within the content layer.
      h.Class('isolate border-t border-paper/15 bg-ink py-10 text-paper'),
      // Same treatment as <main>: unreachable while the menu overlay is up.
      ...(isMenuOpen ? [h.Inert(true)] : []),
    ],
    [
      h.div(
        [
          // One row from lg, NOT md: four spread items on a 768 measure
          // each wrapped to two lines and the strip read as a broken grid.
          h.Class(
            `${container} flex flex-col gap-4 text-xs tracking-[0.2em] uppercase text-paper/60 lg:flex-row lg:items-center lg:justify-between`,
          ),
        ],
        [
          h.span(
            [h.Class('display text-base text-paper')],
            ['Skóreová', h.span([h.Class('text-pink')], ['.'])],
          ),
          h.span([], ['CZECH WOSO UNLOCKED 🇨🇿']),
          // Reopens the consent banner — index.html owns the handler (the
          // banner lives outside the app; see the script there).
          h.a(
            [
              h.Href('#cookie-settings'),
              h.Class(
                'underline decoration-pink decoration-2 underline-offset-4 transition-colors duration-300 hover:text-paper',
              ),
            ],
            ['Cookie settings'],
          ),
          h.a(
            [
              h.Href(policyRouter()),
              h.Class(
                'underline decoration-pink decoration-2 underline-offset-4 transition-colors duration-300 hover:text-paper',
              ),
            ],
            ['Cookies, plainly'],
          ),
          h.span([], ['© 2026 Skóreová — Made in Czechia']),
        ],
      ),
    ],
  );

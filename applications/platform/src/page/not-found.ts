import { html } from 'foldkit/html';
import type { Html } from 'foldkit/html';

import type { Message } from '../message';
import { welcomeRouter } from '../route';

const h = html<Message>();

// The 404 screen — an unknown path names itself instead of silently
// rendering the welcome screen. Same anatomy as screenHeader (pink chip,
// display title, quiet subtitle); the one action is the way home.
export const notFoundView = (path: string): Html =>
  h.div(
    [],
    [
      h.div(
        [h.Class('flex')],
        [
          h.span(
            [h.Class('display inline-block bg-pink px-3 py-1.5 text-sm tracking-[0.2em] text-ink')],
            ['404'],
          ),
        ],
      ),
      h.h1([h.Class('display mt-6 text-5xl text-ink md:text-7xl')], ['Nothing here.']),
      h.p(
        [h.Class('mt-3 max-w-2xl text-sm leading-relaxed text-ink/50')],
        [`No page lives at ${path} — it may have moved, or the address has a typo.`],
      ),
      h.a(
        [
          h.Href(welcomeRouter()),
          h.Class(
            'mt-8 inline-block border-2 border-ink px-5 py-2.5 text-xs tracking-[0.2em] uppercase text-ink transition-colors duration-300 hover:bg-ink hover:text-paper',
          ),
        ],
        ['Back to the platform'],
      ),
    ],
  );

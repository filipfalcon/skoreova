import { html } from 'foldkit/html';
import type { Html } from 'foldkit/html';

import { container } from '../components';
import type { Message } from '../message';

const h = html<Message>();

// One entry per measurement tool, in plain words. The claims mirror what the
// code actually does — analytics/gtag.ts loads Google Analytics behind the
// consent choice, entry.ts sends crash reports to Sentry with no cookies —
// so a change to either belongs here too.
const sections: ReadonlyArray<{ heading: string; body: string }> = [
  {
    heading: 'Counting visits',
    body: 'Google Analytics tells us which pages get read, for how long, and roughly where in the world readers come from. It sets cookies only after you choose Accept on the banner. Until then — and for good, if you choose Decline — it runs without cookies and sends only anonymous signals that cannot identify you or your device.',
  },
  {
    heading: 'Crash reports',
    body: 'When something on the site breaks, a technical report goes to Sentry, our error-monitoring service, so we can fix what failed. These reports set no cookies and build no profile — they carry the error and what the page was doing at that moment, nothing about who you are.',
  },
  {
    heading: 'Your choice',
    body: 'Your decision is stored on this device and honored on every visit. You can change it anytime — Cookie settings in the footer reopens the banner.',
  },
];

/**
 * The cookie policy page — the consent banner's "Learn more" target.
 */
export const view = (): Html =>
  h.section(
    [h.Class('bg-paper pt-28 pb-16 text-ink md:pt-36 md:pb-24')],
    [
      h.div(
        [h.Class(container)],
        [
          h.p(
            [
              h.Class(
                'display inline-block bg-ink px-4 py-2 text-fluid-xl-3xl tracking-[0.2em] text-paper',
              ),
            ],
            ['Privacy'],
          ),
          h.h1([h.Class('display mt-8 text-fluid-3xl-6xl md:mt-10')], ['Cookies, plainly.']),
          h.p(
            [h.Class('mt-6 max-w-2xl text-lg leading-relaxed')],
            [
              'Skóreová runs two measurement tools. This page says what each one does — in plain words, because that is how we would want it explained to us.',
            ],
          ),
          ...sections.flatMap(({ heading, body }) => [
            h.h2([h.Class('display mt-12 text-fluid-2xl-3xl')], [heading]),
            h.p([h.Class('mt-4 max-w-2xl leading-relaxed')], [body]),
          ]),
          h.p(
            [h.Class('mt-14')],
            [
              h.a(
                [
                  h.Href('/'),
                  h.Class(
                    'display inline-block bg-ink px-6 py-3 text-xl tracking-[0.08em] text-paper transition-colors duration-300 hover:bg-pink hover:text-ink active:bg-pink active:text-ink',
                  ),
                ],
                ['Back to the game'],
              ),
            ],
          ),
        ],
      ),
    ],
  );

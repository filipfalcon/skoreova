import type { Runtime } from 'foldkit';
import type { Document, HtmlBuilder } from 'foldkit/html';

import { container } from './components';
import type { Message } from './message';
import type { Model } from './model';

/**
 * What a reader sees once the app has stopped. Foldkit's default is a developer card that prints
 * the error; a reader needs the brand, a plain sentence and a way back. The error itself goes to
 * Sentry through `crash.report`, so nothing technical is shown here.
 *
 * The runtime has stopped, so the builder can express no Message: the reload is a raw `onclick`,
 * the one place Foldkit allows one.
 *
 * @param _context The crash context; unused, because the reader is not shown the error.
 * @param h The crash view's HTML builder.
 */
export const crashView = (
  _context: Runtime.CrashContext<Model, Message>,
  h: HtmlBuilder<never>,
): Document => ({
  title: 'Something broke — Skóreová',
  lang: 'en-US',
  body: h.main(
    [h.Class('flex min-h-screen items-center bg-ink font-body text-paper antialiased')],
    [
      h.div(
        [h.Class(container)],
        [
          h.p(
            [
              h.Class(
                'display inline-block bg-pink px-4 py-2 text-fluid-xl-3xl tracking-[0.2em] text-ink',
              ),
            ],
            ['Skóreová'],
          ),
          h.h1([h.Class('display mt-8 text-fluid-3xl-6xl md:mt-10')], ['Something broke.']),
          h.p(
            [h.Class('mt-6 max-w-2xl text-lg leading-relaxed')],
            ['The page stopped working. Reloading usually brings it back.'],
          ),
          h.button(
            [
              h.Type('button'),
              h.Attribute('onclick', 'location.reload()'),
              h.Class(
                'display mt-10 inline-block cursor-pointer bg-pink px-6 py-3 text-xl tracking-[0.08em] text-ink transition-colors duration-300 hover:bg-paper active:bg-paper',
              ),
            ],
            ['Reload the page'],
          ),
        ],
      ),
    ],
  ),
});

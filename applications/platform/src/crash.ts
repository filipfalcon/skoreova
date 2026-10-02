import type { Runtime } from 'foldkit';
import type { Document, HtmlBuilder } from 'foldkit/html';

import type { Message } from './message';
import type { Model } from './model';
import { getStyleXAttributes } from './stylex-attributes';
import { styles as crashStyles } from './styles/crash';
import { styles as notFoundStyles } from './styles/not-found';
import { shared } from './styles/shared';
import { styles as shellStyles } from './styles/view';

/**
 * What a reader sees once the app has stopped. Foldkit's default is a developer card that prints
 * the error; a reader needs the platform's own page, a plain sentence and a way back. It is the 404
 * screen's anatomy on the shell's page and column, without the header: the header's links would
 * route through a runtime that is no longer running.
 *
 * The builder can express no Message, so the reload is a raw `onclick`, the one place Foldkit
 * allows one.
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
  body: h.div(
    [...getStyleXAttributes(h, shellStyles.page, shellStyles.shell)],
    [
      h.main(
        [...getStyleXAttributes(h, shellStyles.main)],
        [
          h.div(
            [...getStyleXAttributes(h, notFoundStyles.chipRow)],
            [h.span([...getStyleXAttributes(h, shared.display, notFoundStyles.chip)], ['Error'])],
          ),
          h.h1(
            [...getStyleXAttributes(h, shared.display, notFoundStyles.title)],
            ['Something broke.'],
          ),
          h.p(
            [...getStyleXAttributes(h, notFoundStyles.subtitle)],
            ['The platform stopped working. Reloading usually brings it back.'],
          ),
          h.button(
            [
              h.Type('button'),
              h.Attribute('onclick', 'location.reload()'),
              ...getStyleXAttributes(h, notFoundStyles.homeLink, crashStyles.reload),
            ],
            ['Reload the page'],
          ),
        ],
      ),
    ],
  ),
});

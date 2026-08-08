import { html } from 'foldkit/html';
import type { Html } from 'foldkit/html';

import type { Message } from '../message';
import { welcomeRouter } from '../route';
import { getStyleXAttributes } from '../stylexAttributes';
import { styles } from '../styles/not-found';
import { shared } from '../styles/shared';

const h = html<Message>();

// The 404 screen — an unknown path names itself instead of silently
// rendering the welcome screen. Same anatomy as screenHeader (pink chip,
// display title, quiet subtitle); the one action is the way home.
export const view = (path: string): Html =>
  h.div(
    [],
    [
      h.div(
        [...getStyleXAttributes(h, styles.chipRow)],
        [h.span([...getStyleXAttributes(h, shared.display, styles.chip)], ['404'])],
      ),
      h.h1([...getStyleXAttributes(h, shared.display, styles.title)], ['Nothing here.']),
      h.p(
        [...getStyleXAttributes(h, styles.subtitle)],
        [`No page lives at ${path} — it may have moved, or the address has a typo.`],
      ),
      h.a(
        [h.Href(welcomeRouter()), ...getStyleXAttributes(h, styles.homeLink)],
        ['Back to the platform'],
      ),
    ],
  );

import { html } from 'foldkit/html';
import type { Document, Html } from 'foldkit/html';

import { footerView, headerView, menuOverlayView } from './components';
import type { Message } from './message';
import type { Model } from './model';
import { MountMotion } from './motion';
import { championsView } from './page/champions';
import { clubsView } from './page/clubs';
import { competitionsView } from './page/competitions';
import { followView } from './page/follow';
import { heroView } from './page/hero';
import { marqueeView } from './page/marquee';
import { nationalTeamView } from './page/national';
import { starView } from './page/star';
import { statementView } from './page/statement';
import { storyView } from './page/story';

const h = html<Message>();

const landingSections = (model: Model): ReadonlyArray<Html> => [
  heroView(),
  storyView(),
  competitionsView(),
  // The map right after the competitions — first WHAT we cover, then WHERE
  // it all happens, before zooming into individual protagonists.
  clubsView(model),
  championsView(),
  // Champion → her star player, then out to the national team.
  starView(),
  nationalTeamView(),
  statementView(),
  // The competitions ticker answers the statement's closing line — "Watch
  // it rise to the top." and every competition name rolls past (user call;
  // it used to close the competitions section instead).
  marqueeView(),
  followView(),
];

export const view = (model: Model): Document => ({
  title: 'Skóreová — Czech Women’s Football',
  body: h.div(
    [h.Class('bg-ink font-body text-paper antialiased')],
    [
      headerView(model),
      menuOverlayView(model),
      // While the menu overlay is open, the page content behind it goes
      // `inert` — unfocusable and invisible to assistive tech, so Tab
      // cycles through the overlay (and header) only. The attribute is
      // added conditionally rather than set to `false` because `inert`
      // is a boolean attribute: its mere presence would disable the page.
      h.main(
        [h.OnMount(MountMotion()), ...(model.isMenuOpen ? [h.Inert(true)] : [])],
        landingSections(model),
      ),
      footerView(model.isMenuOpen),
    ],
  ),
});

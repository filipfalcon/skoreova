import { createKeyedLazy } from 'foldkit/html';
import type { Document, Html, HtmlBuilder } from 'foldkit/html';

import { footerView, headerView, menuOverlayView } from './components';
import { documentTitle } from './document-title';
import type { Message } from './message';
import type { Model } from './model';
import { MountMotion, ObserveReveals } from './motion';
import {
  Champions,
  Clubs,
  Competitions,
  Follow,
  Hero,
  Marquee,
  National,
  Policy,
  Star,
  Statement,
  Story,
} from './page';

// MEMOIZED SECTIONS. Two of the landing sections take no Model at all, so
// their markup is identical on every render — and this view re-runs on every
// scroll step, because ChangedReveals writes to the Model constantly. A memo
// slot hands back the same VNode reference, which the patcher short-circuits
// on, skipping both construction and the subtree diff. The win is the SCROLL,
// not the boot: the first render has to build both sections anyway (and that is
// the render foldkit’s devtools flags as over budget — memoization can do
// nothing for it), while a reader scrolling the page re-runs this view dozens
// of times and now rebuilds neither. The rest of the sections all read
// `model.reveals` through revealClass, so there is nothing stable to memoize
// them on.
//
// Keyed rather than plain createLazy, and keyed on the SAME string as the root
// below: a cached VNode may only be rendered at one position, and flipping
// reduced motion re-keys the root, which tears this subtree down and builds a
// new one. Sharing the key means that rebuild gets its own slot instead of
// reusing a VNode still pointing at the removed DOM.
const heroLazy = createKeyedLazy();
const marqueeLazy = createKeyedLazy();

const landingSections = (
  model: Model,
  rootKey: string,
  h: HtmlBuilder<Message>,
): ReadonlyArray<Html> => [
  heroLazy(rootKey, Hero.view, [h]),
  Story.view(model, h),
  Competitions.view(model, h),
  // The map right after the competitions — first WHAT we cover, then WHERE
  // it all happens, before zooming into individual protagonists.
  Clubs.view(model, h),
  Champions.view(model, h),
  // Champion → her star player, then out to the national team.
  Star.view(model, h),
  National.view(model, h),
  Statement.view(model, h),
  // The competitions ticker answers the statement’s closing line — "Watch
  // it rise to the top." and every competition name rolls past (user call;
  // it used to close the competitions section instead).
  marqueeLazy(rootKey, Marquee.view, [h]),
  Follow.view(model, h),
];

export const view = (model: Model, h: HtmlBuilder<Message>): Document => {
  // Keyed on the route tag as well as the motion flag: navigating between
  // the landing and the policy page tears the motion mounts down and re-runs
  // their setup against the page actually on screen — the choreography's
  // element lists are captured at setup, so a mount surviving a page swap
  // would drive detached nodes and leave the new page inert. NotFound renders
  // the landing, and shares its key so the swap is a no-op.
  const isPolicy = model.route._tag === 'Policy';
  const rootKey = `motion-${model.prefersReducedMotion}-${isPolicy ? 'policy' : 'landing'}`;
  return {
    // `canonical` and `ogUrl` are left off HERE and set in entry.server.ts,
    // which has the request path this route was parsed from and can drop the
    // query string. Omitting them would default both to the request URL with
    // the query kept — one page per tracking parameter.
    title: documentTitle(model.route),
    // American English, the language every string in this app is written in; the runtime writes it after the first render, so what a crawler reads is whatever the served document already carried.
    lang: 'en-US',
    // The root is keyed on the reduced-motion flag: flipping the OS setting
    // tears both motion mounts down (symmetric release) and re-runs their
    // setup with the fresh value — no stale mount-time snapshot. The reveal
    // observers sit HERE (one OnMount per element; <main> below carries the
    // per-frame choreography’s MountMotion).
    body: h.keyed('div')(
      rootKey,
      [
        h.Class('bg-ink font-body text-paper antialiased'),
        h.OnMount(ObserveReveals({ reduceMotion: model.prefersReducedMotion })),
      ],
      [
        headerView(model, h),
        menuOverlayView(model, h),
        // While the menu overlay is open, the page content behind it goes
        // `inert` — unfocusable and invisible to assistive tech, so Tab
        // cycles through the overlay (and header) only. The attribute is
        // added conditionally rather than set to `false` because `inert`
        // is a boolean attribute: its mere presence would disable the page.
        h.main(
          [h.OnMount(MountMotion()), ...(model.isMenuOpen ? [h.Inert(true)] : [])],
          isPolicy ? [Policy.view(h)] : landingSections(model, rootKey, h),
        ),
        footerView(model.isMenuOpen, h),
      ],
    ),
  };
};

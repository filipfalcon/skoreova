import { RadioGroup } from '@foldkit/ui';
import { Schema as S } from 'effect';

import { AppRoute } from './route';

// A keyed reveal target’s on-screen state: 'entered' renders `.is-in`;
// 'drawn' additionally `.is-drawn` (a draw target whose pen finished its
// lap, or a downward-only pen re-entered from below). Absent = at rest.
export const RevealState = S.Literals(['entered', 'drawn']);
export type RevealState = typeof RevealState.Type;

// The map’s league filter. 'all' shows both flights; picking a league hides
// the other one’s pins outright (display:none on a wrapper — see the pin
// wrapper comment in page/clubs.ts).
export const MapLeague = S.Literals(['All', 'First', 'Second']);
export type MapLeague = typeof MapLeague.Type;

export const Model = S.Struct({
  // Which page is on screen — the landing at `/`, the cookie policy at
  // `/policy`. Unknown paths carry NotFound and render the landing.
  route: AppRoute,
  isMenuOpen: S.Boolean,
  // Id of the landing section the viewport sat in when the menu was last
  // opened (None at the hero). Resolved once per open by DetectActiveSection —
  // scroll is locked while the overlay is up, so it cannot go stale.
  activeSection: S.Option(S.String),
  mapLeague: MapLeague,
  // The league filter's own state. It owns keyboard focus; the committed
  // league stays in `mapLeague` above and is handed back as a view input.
  mapLeagueGroup: RadioGroup.Model,
  // Slug of the club whose card is open over the map (None = closed). Pins
  // open the card; navigation to the profile happens via the card’s button.
  mapClub: S.Option(S.String),
  // Whether the country-area figure shows imperial units (the RESTING
  // unit — the site speaks American English). A tap toggle on touch;
  // desktop hover previews the other unit via CSS, no model round-trip.
  isMapAreaImperial: S.Boolean,
  // Whether the hero has scrolled up under the fixed header, so the header’s
  // persistent "Enter platform" CTA can take over from the hero’s own primary
  // CTA. Fed by an IntersectionObserver on the hero (see ObserveHeroPastHeader
  // in motion.ts) — the header owns the class in the view, so a re-render
  // can’t wipe it the way an imperatively-toggled class did.
  heroPastHeader: S.Boolean,
  // Mirrors the OS-level `prefers-reduced-motion` media query — established
  // AND kept fresh by the reducedMotion subscription, which reads the query on
  // subscribe. It is deliberately not a Flag: the document is prerendered once
  // for every visitor, so a boot-time flag could only carry a build-time guess.
  // Everything renders from `false` for the moment before the subscription
  // lands; the stylesheet's own reduced-motion rules cover that window. The
  // motion
  // mount is keyed on it (view.ts), so flipping the OS setting mid-session
  // re-runs the choreography setup instead of leaving a stale snapshot.
  prefersReducedMotion: S.Boolean,
  // The reveal system’s discrete state, keyed by each target’s
  // data-reveal-key: the observers (ObserveReveals in motion.ts) report
  // entries/exits as Messages, and the VIEW renders `.is-in`/`.is-drawn`
  // from this record (see revealClass in components.ts). The patcher owns
  // the class strings again — the old "reveal targets' classes must stay
  // static forever" invariant is gone.
  reveals: S.Record(S.String, RevealState),
});
export type Model = typeof Model.Type;

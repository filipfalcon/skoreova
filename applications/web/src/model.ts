import { Schema as S } from 'effect';

// A keyed reveal target's on-screen state: 'entered' renders `.is-in`;
// 'drawn' additionally `.is-drawn` (a draw target whose pen finished its
// lap, or a downward-only pen re-entered from below). Absent = at rest.
export const RevealState = S.Literals(['entered', 'drawn']);
export type RevealState = typeof RevealState.Type;

// The map's league filter. 'all' shows both flights; picking a league hides
// the other one's pins outright (display:none on a wrapper — see the pin
// wrapper comment in page/clubs.ts).
export const MapLeague = S.Literals(['All', 'First', 'Second']);
export type MapLeague = typeof MapLeague.Type;

// Boot-time flags, decoded by the runtime before init: whether the OS asks
// for reduced motion. Seeding the Model here (instead of each consumer
// sampling matchMedia on its own schedule) gives the wheel hijack, the
// Navigate scroll animation, and the motion mount ONE shared value.
export const Flags = S.Struct({ prefersReducedMotion: S.Boolean });
export type Flags = typeof Flags.Type;

export const Model = S.Struct({
  isMenuOpen: S.Boolean,
  // Id of the landing section the viewport sat in when the menu was last
  // opened (None at the hero). Resolved once per open by DetectActiveSection —
  // scroll is locked while the overlay is up, so it cannot go stale.
  activeSection: S.Option(S.String),
  mapLeague: MapLeague,
  // Slug of the club whose card is open over the map (None = closed). Pins
  // open the card; navigation to the profile happens via the card's button.
  mapClub: S.Option(S.String),
  // Whether the country-area figure shows imperial units (the RESTING
  // unit — the site speaks American English). A tap toggle on touch;
  // desktop hover previews the other unit via CSS, no model round-trip.
  isMapAreaImperial: S.Boolean,
  // Whether the hero has scrolled up under the fixed header, so the header's
  // persistent "Enter platform" CTA can take over from the hero's own primary
  // CTA. Fed by an IntersectionObserver on the hero (see ObserveHeroPastHeader
  // in motion.ts) — the header owns the class in the view, so a re-render
  // can't wipe it the way an imperatively-toggled class did.
  heroPastHeader: S.Boolean,
  // Mirrors the OS-level `prefers-reduced-motion` media query — seeded via
  // Flags at boot, kept fresh by the reducedMotion subscription. The motion
  // mount is keyed on it (page.ts), so flipping the OS setting mid-session
  // re-runs the choreography setup instead of leaving a stale snapshot.
  prefersReducedMotion: S.Boolean,
  // The reveal system's discrete state, keyed by each target's
  // data-reveal-key: the observers (ObserveReveals in motion.ts) report
  // entries/exits as Messages, and the VIEW renders `.is-in`/`.is-drawn`
  // from this record (see revealClass in components.ts). The patcher owns
  // the class strings again — the old "reveal targets' classes must stay
  // static forever" invariant is gone.
  reveals: S.Record(S.String, RevealState),
});
export type Model = typeof Model.Type;

import { Schema as S } from 'effect';

// The map's league filter. 'all' shows both flights; picking a league hides
// the other one's pins outright (display:none on a wrapper — see the pin
// wrapper comment in page/clubs.ts).
export const MapLeague = S.Literals(['All', 'First', 'Second']);
export type MapLeague = typeof MapLeague.Type;

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
});
export type Model = typeof Model.Type;

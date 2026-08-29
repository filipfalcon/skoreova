import { RadioGroup } from '@foldkit/ui';
import { Schema as S } from 'effect';
import { defineMessageUnion } from 'foldkit/message';
import { UrlRequest } from 'foldkit/navigation';
import { Url } from 'foldkit/url';

import { MapLeague } from './model';

export const Message = defineMessageUnion({
  ToggledMenu: {},
  // Sent by every anchor inside the overlay: close the menu and let navigation
  // take care of the rest.
  ClosedMenu: {},
  // Escape pressed while the overlay is open — closes it AND returns focus to
  // the toggle (via the FocusMenuToggle Command), like a native dialog hands
  // focus back to its opener.
  PressedMenuEscape: {},
  CompletedFocusMenuToggle: {},
  // Reports which landing section the viewport is in (None at the hero) — see
  // DetectActiveSection.
  DetectedActiveSection: { section: S.Option(S.String) },
  ClickedLink: { request: UrlRequest },
  ChangedUrl: { url: Url },
  CompletedNavigate: {},
  CompletedLoad: {},
  CompletedSetScrollLock: {},
  SelectedMapLeague: { league: MapLeague },
  // The league filter is a Submodel, so its Messages arrive wrapped. The
  // COMMITTED league does not travel this way — it arrives as a `Selected`
  // OutMessage and lands in `mapLeague`.
  GotMapLeagueGroupMessage: {
    message: RadioGroup.Message,
  },
  OpenedMapClub: { slug: S.String },
  // Closes the open club card.
  ClosedMapClub: {},
  ToggledAreaUnit: {},
  // The OS-level `prefers-reduced-motion` setting flipped mid-session — see
  // the reducedMotion subscription.
  ChangedReducedMotion: { reduce: S.Boolean },
  CompletedMountMotion: {},
  FailedMountMotion: { reason: S.String },
  // Reports whether the hero has scrolled up under the fixed header — `past`
  // drives the header’s persistent CTA in the Model. See ObserveHeroPastHeader
  // in motion.ts.
  DetectedHeroPastHeader: { past: S.Boolean },
  // One reveal-observer notification, already resolved to reveal keys: which
  // targets entered the viewport (render `.is-in`), which left (back to
  // rest), and which must stand fully DRAWN — a pen that finished its lap
  // (transitionend) or a downward-only pen re-entered from below. See
  // ObserveReveals in motion.ts.
  ChangedReveals: {
    revealed: S.Array(S.String),
    concealed: S.Array(S.String),
    drawn: S.Array(S.String),
  },
});
export type Message = typeof Message.Type;

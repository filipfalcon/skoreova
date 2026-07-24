import { Schema as S } from 'effect';
import { m } from 'foldkit/message';
import { UrlRequest } from 'foldkit/navigation';
import { Url } from 'foldkit/url';

import {
  ChangedReveals,
  CompletedMountMotion,
  DetectedHeroPastHeader,
  FailedMountMotion,
} from './motion';
import { MapLeague } from './model';

export const ToggledMenu = m('ToggledMenu');
// Sent by every anchor inside the overlay: close the menu and let navigation
// take care of the rest.
export const ClosedMenu = m('ClosedMenu');
// Escape pressed while the overlay is open — closes it AND returns focus to
// the toggle (via the FocusMenuToggle Command), like a native dialog hands
// focus back to its opener.
export const PressedMenuEscape = m('PressedMenuEscape');
export const CompletedFocusMenuToggle = m('CompletedFocusMenuToggle');
// Reports which landing section the viewport is in (None at the hero) — see
// DetectActiveSection.
export const DetectedActiveSection = m('DetectedActiveSection', { section: S.Option(S.String) });
export const ClickedLink = m('ClickedLink', { request: UrlRequest });
export const ChangedUrl = m('ChangedUrl', { url: Url });
export const CompletedNavigate = m('CompletedNavigate');
export const CompletedLoad = m('CompletedLoad');
export const CompletedSetScrollLock = m('CompletedSetScrollLock');
export const SelectedMapLeague = m('SelectedMapLeague', { league: MapLeague });
export const OpenedMapClub = m('OpenedMapClub', { slug: S.String });
// Closes the open club card.
export const ClosedMapClub = m('ClosedMapClub');
export const ToggledAreaUnit = m('ToggledAreaUnit');
// The OS-level `prefers-reduced-motion` setting flipped mid-session — see
// the reducedMotion subscription.
export const ChangedReducedMotion = m('ChangedReducedMotion', { reduce: S.Boolean });

export const Message = S.Union([
  ToggledMenu,
  ClosedMenu,
  PressedMenuEscape,
  CompletedFocusMenuToggle,
  DetectedActiveSection,
  ClickedLink,
  ChangedUrl,
  CompletedNavigate,
  CompletedLoad,
  CompletedSetScrollLock,
  SelectedMapLeague,
  OpenedMapClub,
  ClosedMapClub,
  ToggledAreaUnit,
  ChangedReducedMotion,
  CompletedMountMotion,
  FailedMountMotion,
  DetectedHeroPastHeader,
  ChangedReveals,
]);
export type Message = typeof Message.Type;

import { Option } from 'effect';
import { Story } from 'foldkit';
import { External, Internal } from 'foldkit/navigation';
import { fromString } from 'foldkit/url';
import { expect, test } from 'vitest';

import { DetectedHeroPastHeader } from './motion';
import { landingModel, menuOpenModel, secondLeagueMapModel } from './main.fixtures';
import {
  ChangedUrl,
  ClickedLink,
  ClosedMenu,
  CompletedLoad,
  CompletedNavigate,
  CompletedSetScrollLock,
  DetectActiveSection,
  DetectedActiveSection,
  Load,
  Navigate,
  OpenedMapClub,
  SelectedMapLeague,
  SetScrollLock,
  ToggledAreaUnit,
  ToggledMenu,
  update,
} from './main';

const url = (path: string) => Option.getOrThrow(fromString(`https://skoreova.example${path}`));

test('opening the menu locks scroll and kicks off active-section detection', () => {
  Story.story(
    update,
    Story.with(landingModel),
    Story.message(ToggledMenu()),
    Story.model((model) => {
      expect(model.isMenuOpen).toBe(true);
      // Opening resets the marker so a stale highlight can't flash.
      expect(model.activeSection).toBe('');
    }),
    Story.Command.expectExact(SetScrollLock, DetectActiveSection),
    Story.Command.resolve(SetScrollLock, CompletedSetScrollLock()),
    // Detection resolves with whichever section the viewport sat in.
    Story.Command.resolve(DetectActiveSection, DetectedActiveSection({ section: 'on-the-rise' })),
    Story.model((model) => {
      expect(model.activeSection).toBe('on-the-rise');
    }),
  );
});

test('closing the menu releases the scroll lock', () => {
  Story.story(
    update,
    Story.with(menuOpenModel),
    Story.message(ToggledMenu()),
    Story.model((model) => {
      expect(model.isMenuOpen).toBe(false);
    }),
    Story.Command.expectExact(SetScrollLock),
    Story.Command.resolve(SetScrollLock, CompletedSetScrollLock()),
  );
});

test('ClosedMenu closes the overlay and releases the lock', () => {
  Story.story(
    update,
    Story.with(menuOpenModel),
    Story.message(ClosedMenu()),
    Story.model((model) => {
      expect(model.isMenuOpen).toBe(false);
    }),
    Story.Command.resolve(SetScrollLock, CompletedSetScrollLock()),
  );
});

test('selecting a map league switches the filter and closes any open club card', () => {
  Story.story(
    update,
    Story.with(secondLeagueMapModel),
    Story.message(SelectedMapLeague({ league: 'First' })),
    Story.model((model) => {
      expect(model.mapLeague).toBe('First');
      expect(model.mapClub).toBe('');
    }),
    Story.Command.expectNone(),
  );
});

test('opening a club card records its slug; the area unit toggles', () => {
  Story.story(
    update,
    Story.with(landingModel),
    Story.message(OpenedMapClub({ slug: 'slavia-praha' })),
    Story.model((model) => {
      expect(model.mapClub).toBe('slavia-praha');
    }),
    Story.message(ToggledAreaUnit()),
    Story.model((model) => {
      // Rests imperial, so the first toggle flips it to metric.
      expect(model.isMapAreaImperial).toBe(false);
    }),
    Story.Command.expectNone(),
  );
});

test('the hero observer drives the header CTA flag', () => {
  Story.story(
    update,
    Story.with(landingModel),
    // Hero scrolled under the header → the persistent CTA takes over.
    Story.message(DetectedHeroPastHeader({ past: true })),
    Story.model((model) => {
      expect(model.heroPastHeader).toBe(true);
    }),
    // Back on the hero → the CTA yields to the hero's own.
    Story.message(DetectedHeroPastHeader({ past: false })),
    Story.model((model) => {
      expect(model.heroPastHeader).toBe(false);
    }),
    Story.Command.expectNone(),
  );
});

test('an internal link applies the route, pushes it, and releases the lock', () => {
  Story.story(
    update,
    Story.with(menuOpenModel),
    Story.message(ClickedLink({ request: Internal({ url: url('/') }) })),
    Story.model((model) => {
      // Navigating always closes the menu and any open club card.
      expect(model.isMenuOpen).toBe(false);
    }),
    Story.Command.expectExact(Navigate, SetScrollLock),
    Story.Command.resolve(Navigate, CompletedNavigate()),
    Story.Command.resolve(SetScrollLock, CompletedSetScrollLock()),
  );
});

test('browser back/forward re-applies the route and releases the lock', () => {
  Story.story(
    update,
    Story.with(menuOpenModel),
    Story.message(ChangedUrl({ url: url('/') })),
    Story.model((model) => {
      expect(model.isMenuOpen).toBe(false);
    }),
    Story.Command.resolve(SetScrollLock, CompletedSetScrollLock()),
  );
});

test('an external link loads the href and leaves the model alone', () => {
  Story.story(
    update,
    Story.with(landingModel),
    Story.message(ClickedLink({ request: External({ href: 'https://uefa.com' }) })),
    Story.model((model) => {
      expect(model.isMenuOpen).toBe(false);
    }),
    Story.Command.expectHas(Load),
    Story.Command.resolve(Load, CompletedLoad()),
  );
});

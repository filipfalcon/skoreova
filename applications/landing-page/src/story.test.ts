import { Option } from 'effect';
import { Story } from 'foldkit';
import { UrlRequest } from 'foldkit/navigation';
import { fromString } from 'foldkit/url';
import { expect, test } from 'vite-plus/test';

import { landingModel, menuOpenModel } from './main.fixtures';
import { DetectActiveSection, FocusMenuToggle, Load, Message, Navigate, update } from './main';

const url = (path: string) => Option.getOrThrow(fromString(`https://skoreova.example${path}`));

test('opening the menu kicks off active-section detection', () => {
  Story.story(
    update,
    Story.given(landingModel),
    Story.message(Message.ToggledMenu()),
    Story.model((model) => {
      expect(model.isMenuOpen).toBe(true);
      // Opening resets the marker so a stale highlight can’t flash.
      expect(model.activeSection).toEqual(Option.none());
    }),
    Story.Command.expectExact(DetectActiveSection),
    // Detection resolves with whichever section the viewport sat in.
    Story.Command.resolve(
      DetectActiveSection,
      Message.DetectedActiveSection({ section: Option.some('on-the-rise') }),
    ),
    Story.model((model) => {
      expect(model.activeSection).toEqual(Option.some('on-the-rise'));
    }),
  );
});

test('toggling an open menu closes it', () => {
  Story.story(
    update,
    Story.given(menuOpenModel),
    Story.message(Message.ToggledMenu()),
    Story.model((model) => {
      expect(model.isMenuOpen).toBe(false);
    }),
    Story.Command.expectNone(),
  );
});

test('ClosedMenu closes the overlay', () => {
  Story.story(
    update,
    Story.given(menuOpenModel),
    Story.message(Message.ClosedMenu()),
    Story.model((model) => {
      expect(model.isMenuOpen).toBe(false);
    }),
  );
});

// Escape is one factual Message; update decides what it closes. The menu
// wins while open and hands focus back to its toggle; otherwise the club card
// closes.
test('Escape closes the open menu and returns focus to its toggle', () => {
  Story.story(
    update,
    Story.given({ ...menuOpenModel, mapClub: Option.some('sparta-praha') }),
    Story.message(Message.PressedEscape()),
    Story.model((model) => {
      expect(model.isMenuOpen).toBe(false);
      expect(model.mapClub).toEqual(Option.some('sparta-praha'));
    }),
    Story.Command.expectHas(FocusMenuToggle),
    Story.Command.resolveAll([FocusMenuToggle, Message.CompletedFocusMenuToggle()]),
  );
});

test('Escape with the menu closed closes the club card', () => {
  Story.story(
    update,
    Story.given({ ...landingModel, mapClub: Option.some('sparta-praha') }),
    Story.message(Message.PressedEscape()),
    Story.model((model) => {
      expect(model.mapClub).toEqual(Option.none());
    }),
    Story.Command.expectNone(),
  );
});

test('opening a club card records its slug; the area unit toggles', () => {
  Story.story(
    update,
    Story.given(landingModel),
    Story.message(Message.OpenedMapClub({ slug: 'slavia-praha' })),
    Story.model((model) => {
      expect(model.mapClub).toEqual(Option.some('slavia-praha'));
    }),
    // Closing is its own message now, not OpenedMapClub with an empty slug.
    Story.message(Message.ClosedMapClub()),
    Story.model((model) => {
      expect(model.mapClub).toEqual(Option.none());
    }),
    Story.message(Message.ToggledAreaUnit()),
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
    Story.given(landingModel),
    // Hero scrolled under the header → the persistent CTA takes over.
    Story.message(Message.DetectedHeroPastHeader({ past: true })),
    Story.model((model) => {
      expect(model.heroPastHeader).toBe(true);
    }),
    // Back on the hero → the CTA yields to the hero’s own.
    Story.message(Message.DetectedHeroPastHeader({ past: false })),
    Story.model((model) => {
      expect(model.heroPastHeader).toBe(false);
    }),
    Story.Command.expectNone(),
  );
});

test('the reveal fold enters, keeps drawn state, drops stale drawn reports, and exits', () => {
  Story.story(
    update,
    Story.given(landingModel),
    Story.message(Message.ChangedReveals({ revealed: ['map', 'stat'], concealed: [], drawn: [] })),
    Story.model((model) => {
      expect(model.reveals).toEqual({ map: 'entered', stat: 'entered' });
    }),
    // The draw finishing promotes that one key; the others are untouched.
    Story.message(Message.ChangedReveals({ revealed: [], concealed: [], drawn: ['map'] })),
    Story.model((model) => {
      expect(model.reveals).toEqual({ map: 'drawn', stat: 'entered' });
    }),
    // NO DOWNGRADE: a re-entry report for an already-drawn target must not
    // send it back to 'entered' — the pen would replay under the reader.
    Story.message(Message.ChangedReveals({ revealed: ['map'], concealed: [], drawn: [] })),
    Story.model((model) => {
      expect(model.reveals['map']).toBe('drawn');
    }),
    // Concealed drops the key outright, so nothing renders is-in for it…
    Story.message(Message.ChangedReveals({ revealed: [], concealed: ['map'], drawn: [] })),
    Story.model((model) => {
      expect(model.reveals).toEqual({ stat: 'entered' });
    }),
    // …and a late 'drawn' for a target that has since left cannot resurrect
    // it: the fold only maps over keys that are present.
    Story.message(Message.ChangedReveals({ revealed: [], concealed: [], drawn: ['map'] })),
    Story.model((model) => {
      expect(model.reveals).toEqual({ stat: 'entered' });
    }),
    // The fourth case, and the one motion.ts actually emits most often: the
    // same key arriving as revealed AND drawn in one message — a downward-only
    // pen re-entered from below, which has to land fully drawn rather than
    // replaying its lap under the reader.
    Story.message(Message.ChangedReveals({ revealed: ['map'], concealed: [], drawn: ['map'] })),
    Story.model((model) => {
      expect(model.reveals['map']).toBe('drawn');
    }),
    Story.Command.expectNone(),
  );
});

test('an internal link applies the route and pushes it', () => {
  Story.story(
    update,
    Story.given(menuOpenModel),
    Story.message(Message.ClickedLink({ request: UrlRequest.Internal({ url: url('/') }) })),
    Story.model((model) => {
      // Navigating always closes the menu and any open club card.
      expect(model.isMenuOpen).toBe(false);
    }),
    Story.Command.expectExact(Navigate),
    Story.Command.resolve(Navigate, Message.CompletedNavigate()),
  );
});

test('the policy link routes to the policy page and back', () => {
  Story.story(
    update,
    Story.given(landingModel),
    Story.message(Message.ClickedLink({ request: UrlRequest.Internal({ url: url('/policy') }) })),
    Story.model((model) => {
      expect(model.route._tag).toBe('Policy');
    }),
    Story.Command.resolve(Navigate, Message.CompletedNavigate()),
    Story.message(Message.ChangedUrl({ url: url('/') })),
    Story.model((model) => {
      expect(model.route._tag).toBe('Home');
    }),
  );
});

test('browser back/forward re-applies the route', () => {
  Story.story(
    update,
    Story.given(menuOpenModel),
    Story.message(Message.ChangedUrl({ url: url('/') })),
    Story.model((model) => {
      expect(model.isMenuOpen).toBe(false);
    }),
  );
});

test('an external link loads the href and leaves the model alone', () => {
  Story.story(
    update,
    Story.given(landingModel),
    Story.message(
      Message.ClickedLink({ request: UrlRequest.External({ href: 'https://uefa.com' }) }),
    ),
    Story.model((model) => {
      expect(model.isMenuOpen).toBe(false);
    }),
    Story.Command.expectHas(Load),
    Story.Command.resolve(Load, Message.CompletedLoad()),
  );
});

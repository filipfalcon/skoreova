import { html } from 'foldkit/html';
import type { Html } from 'foldkit/html';

import heroImage from '../assets/hero.webp';
import { displayArrow } from '../components';
import { platformUrl } from '../data';
import type { Message } from '../message';
import { ObserveHeroPastHeader } from '../motion';

const h = html<Message>();

// Big on phones (one column of huge type), smaller on desktop so the three
// lines don't cover the players' faces on wide, short windows.
const heroText = 'text-[20vw] md:text-[10vw]';
// The mask just clips the slide-up intro; the old headroom padding was only
// for the (removed) Mexican-wave letters jumping above the line.
const heroMask = `overflow-hidden ${heroText}`;

export const heroView = (): Html =>
  h.section(
    [
      h.Id('top'),
      // Reports to the Model when the hero slips under the fixed header, so
      // the header's persistent CTA can take over (see ObserveHeroPastHeader).
      h.OnMount(ObserveHeroPastHeader()),
      // Starts below the fixed header — the photo must not slide under the
      // bar, or the players lose their heads. `lvh` (largest viewport) so the
      // hero always reaches the very bottom on mobile Safari: with `svh` the
      // hero equals the *smallest* viewport, so when the toolbars collapse to
      // their slim floating state the visible area is taller and the next
      // (paper) section peeks in under the URL bar. `lvh` is static (unlike
      // `dvh`), so it doesn't reflow as the toolbar hides while scrolling.
      h.Class(
        'relative mt-14 h-[calc(100lvh-3.5rem)] overflow-hidden md:mt-16 md:h-[calc(100lvh-4rem)]',
      ),
    ],
    [
      // Parallax layer anchored to the section's top edge, overshooting only
      // downward: the hero sits at the top of the page, so scrolling can only
      // push the layer down (the lag effect) — an upward overshoot would just
      // crop the players' heads at rest.
      h.div(
        [h.Class('absolute inset-x-0 top-0 -bottom-[30%]'), h.DataAttribute('parallax', '0.18')],
        [
          // The photo is oversized ~9% and shifted up so the studio dead
          // space above the players is cropped out — the visible frame
          // starts right at their hair.
          h.img([
            h.Src(heroImage),
            h.Width('4000'),
            h.Height('2667'),
            h.Alt('Four Czech players in dark red kits, arms crossed, facing the camera'),
            // Decode off the main thread and prioritize the fetch — it's the
            // one above-the-fold image, so its decode shouldn't block the
            // first frames while the neon intro is playing.
            h.Decoding('async'),
            h.Fetchpriority('high'),
            h.Class(
              'hero-photo absolute inset-x-0 -top-[9%] h-[109%] w-full object-cover object-top',
            ),
          ]),
        ],
      ),
      // Darkening overlay — a sibling of the parallax layer, not a child, so
      // it always covers the whole hero. Inside the layer it moved with the
      // parallax, and when the offset pushed the layer down it left a thin
      // undimmed strip of the bright photo at the hero's top edge.
      h.div([h.Class('absolute inset-0 bg-ink/50')], []),
      // Bottom scrim — a light ink gradient rising from the base so the
      // corner captions read against the photo's bright areas (the white
      // shorts), while fading out fast enough to leave the picture's
      // overall exposure alone.
      h.div(
        [
          h.Class(
            'pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-ink/50 to-transparent md:h-40',
          ),
        ],
        [],
      ),
      // Film grain over the darkened photo — below the content layer, so the
      // headline, neon and CTA stay clean above it.
      h.div([h.Class('grain pointer-events-none absolute inset-0')], []),
      h.div(
        // No bottom padding on phones — the scroll cue centers itself in the
        // leftover space below the CTA (my-auto), and any padding here would
        // skew that split toward the top.
        [h.Class('relative flex h-full flex-col md:pb-8')],
        [
          // On phones the portrait crop leaves the players' faces in the top
          // ~40% — the headline starts right under their chins so the hook
          // is on screen immediately. From `md` up the photo is landscape
          // and `mt-auto` parks the headline near the bottom instead.
          h.h1(
            // Barely any side padding on phones so the headline runs almost
            // edge to edge. `gap` gives the three lines air (Anton's 0.92
            // leading packs them tight on its own) — fixed on phones so the
            // lockup doesn't loosen/tighten with viewport width.
            [
              h.Class(
                'mt-[36svh] flex flex-col gap-2.5 px-0 text-center select-none md:mt-auto md:gap-[1vw] md:px-2',
              ),
            ],
            [
              h.div(
                [h.Class(`${heroMask} text-paper`)],
                [
                  h.span(
                    [h.Class('hero-line display block'), h.Style({ '--hero-delay': '0.25s' })],
                    ['Discover'],
                  ),
                ],
              ),
              // No clipping mask here (unlike its siblings) — the neon halo
              // needs to bleed past the line box, and the mask's slide-up
              // intro is replaced by a neon power-on flicker anyway.
              // Two spans: the outer flickers (opacity, promoted to its own
              // layer so it's cheap and doesn't re-rasterize the glow); the
              // inner carries the neon tubes + glow filter and is NOT promoted
              // — WebKit renders a big drop-shadow badly on a forced layer.
              h.div(
                [h.Class(heroText)],
                [
                  h.span(
                    [h.Class('hero-neon display block'), h.Style({ '--hero-delay': '0.5s' })],
                    // ONE glow filter for the whole line — the only structure
                    // WebKit renders sharp. The per-word ignition (motion.ts
                    // stepping `.hero-neon-late`) runs on non-WebKit engines
                    // only: on iOS/Safari every variant broke the glow — a
                    // second filtered layer (even fully static), opacity on a
                    // wrapper above the second filter, visibility toggles —
                    // so WebKit ignites the whole sign as one piece instead
                    // and never touches anything at or below the filter.
                    [
                      h.span(
                        [h.Class('hero-glam')],
                        [h.span([], ['Her']), ' ', h.span([h.Class('hero-neon-late')], ['game'])],
                      ),
                    ],
                  ),
                ],
              ),
              h.div(
                [h.Class(`${heroMask} text-paper`)],
                [
                  h.span(
                    [h.Class('hero-line display block'), h.Style({ '--hero-delay': '0.55s' })],
                    ['In Czechia'],
                  ),
                ],
              ),
            ],
          ),
          // Primary CTA — solid pink, fades in after the headline has landed
          // while the neon is still igniting. The header carries a persistent
          // copy once the hero scrolls away.
          h.div(
            [
              h.Class('hero-fade mt-9 flex justify-center md:mt-7'),
              h.Style({ '--hero-delay': '1.3s' }),
            ],
            [
              h.a(
                [
                  h.Href(platformUrl),
                  h.Class(
                    'hero-cta platform-beckon display bg-pink px-10 py-4 text-2xl tracking-[0.08em] text-ink transition-colors duration-300 active:bg-paper md:px-9 md:hover:bg-paper',
                  ),
                ],
                // The same drawn arrow as the menu's Platform entry — the
                // text glyph "→" reads hairline-thin next to Anton.
                ['Enter platform', displayArrow],
              ),
            ],
          ),
          // Corner captions — small typographic anchors that finish the
          // frame's bottom edge, flanking the centered CTA. They fade in
          // last, after the CTA has landed. On phones they live in the flow:
          // `my-auto` centers the cue in the leftover space, so the gap to
          // the CTA equals the gap to the section's end at every viewport
          // height. From `md` up it's the absolute corner strip again.
          h.div(
            [
              h.Class(
                'hero-fade pointer-events-none my-auto flex items-end justify-center px-5 text-[10px] tracking-[0.2em] uppercase text-paper/60 select-none md:absolute md:inset-x-0 md:bottom-7 md:my-0 md:justify-between md:px-8 md:text-xs',
              ),
              h.Style({ '--hero-delay': '1.6s' }),
            ],
            [
              h.span([h.Class('hidden md:inline')], ['Independent media']),
              h.span([], ['Scroll for experience']),
            ],
          ),
        ],
      ),
    ],
  );

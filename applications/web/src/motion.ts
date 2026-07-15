import { Effect, Schema as S } from 'effect';
import { Mount } from 'foldkit';
import { m } from 'foldkit/message';

// The page's scroll and pointer choreography, attached once to the app root.
// Everything here is deliberately outside the Elm model — these effects fire
// per frame, and routing them through `update` would re-render the page
// constantly. One persistent requestAnimationFrame loop drives every
// continuous effect; IntersectionObserver drives the discrete ones.
//
// Subsystems (each marked by a data attribute in the view):
// - [data-reveal]        in/out reveal classes, replaying on every re-entry
// - [data-countup]       numbers count up from 0 when their reveal enters
// - [data-scramble]      slot-machine roll for values a count-up can't
//                        serve ("€1B") — see the Scrambles section
// - [data-parallax]      scroll-lagged layers (speed = fraction of scroll)
// - [data-scrub-align]   scroll-scrubbed cancel of the element's own top
//                        margin — staggered until its parent reaches the
//                        viewport center, then sitting level (a negative
//                        margin scrubs downward, so a ±margin pair
//                        converges to the middle)
// - [data-scrub-dock]    scroll-scrubbed lift: rides `--dock-lift` above its
//                        layout spot while its section still has room below
//                        the viewport, and settles (docks) exactly as the
//                        section's bottom edge reaches the viewport's
// - [data-bracket-scrub] scroll-pinned build: the runway reserves the scroll,
//                        a sticky stage holds the frame, and the runway's
//                        progress stamps `.is-on` onto the numbered
//                        [data-bracket-step] pieces inside — forward builds,
//                        backward unwinds (desktop only; phones force all
//                        steps on)
// - [data-marquee]       ticker whose speed/direction reacts to scroll velocity
// - [data-tilt]          3D card tilt following the pointer while hovered
//
// With `prefers-reduced-motion`, everything is revealed immediately, numbers
// show their final value, and no listeners or loops are installed. Pointer
// effects additionally require a fine pointer (no touch devices).

export const CompletedMountMotion = m('CompletedMountMotion');
export const FailedMountMotion = m('FailedMountMotion', { reason: S.String });

const REVEAL_CLIPPED_VARIANTS = new Set(['mask', 'wipe']);
const COUNT_UP_MILLISECONDS = 1000;
const MARQUEE_BASE_SPEED = 90; // px/s leftward drift with no scrolling
const MARQUEE_VELOCITY_GAIN = 0.4; // how much scroll velocity feeds the ticker
const MARQUEE_MAX_SPEED = 700;
const MARQUEE_FLIP_WINDOW = 150; // px/s of upward velocity over which the base drift flips sign
const TILT_MAX_DEGREES = 6;

const lerp = (from: number, to: number, factor: number): number => from + (to - from) * factor;

const parseRevealDelaySeconds = (element: HTMLElement | null): number => {
  const raw = element?.style.getPropertyValue('--reveal-delay') ?? '';
  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) ? parsed : 0;
};

interface CountUp {
  readonly element: HTMLElement;
  // Re-parsed from the element every time the animation (re)starts — the
  // map's land counters change their value with the league filter, so the
  // mount-time snapshot goes stale.
  prefix: string;
  target: number;
  suffix: string;
  // The exact string this system last wrote, and the number it showed. When
  // the element's text differs from `lastText`, the MODEL rewrote it (league
  // filter) — the rAF loop catches that and counts from `current` to the new
  // value instead of letting it snap.
  lastText: string;
  current: number;
  // Snapshot of `data-recount` (the view stamps filter state + fresh target
  // there); when it changes, the rAF loop spins the counter — even to the
  // SAME value. Undefined for count-ups the model never rewrites.
  lastRecount: string | undefined;
  timeout: number;
  frame: number;
}

interface ParallaxLayer {
  readonly element: HTMLElement;
  readonly host: HTMLElement;
  readonly speed: number;
}

interface MarqueeTrack {
  readonly element: HTMLElement;
  offset: number;
}

interface Tilt {
  readonly element: HTMLElement;
  hovered: boolean;
  targetX: number;
  targetY: number;
  x: number;
  y: number;
  settled: boolean;
}

const setUpMotion = (root: HTMLElement): (() => void) => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(pointer: fine)').matches;
  const cleanups: Array<() => void> = [];

  // iOS Safari only engages CSS `:active` states on touch once the page has
  // at least one touch listener registered — without this no-op, every
  // `active:` tap style (the pink buttons flashing paper) is silently dead.
  const enableActiveStates = (): void => {};
  document.addEventListener('touchstart', enableActiveStates, { passive: true });
  cleanups.push(() => document.removeEventListener('touchstart', enableActiveStates));

  // ----- Count-ups ---------------------------------------------------------
  // Parsed once; started/cancelled from the reveal observer below.

  const countUps = new Map<HTMLElement, CountUp>();
  for (const element of root.querySelectorAll<HTMLElement>('[data-countup]')) {
    const match = (element.textContent ?? '').match(/^([^\d]*)(\d+)([\s\S]*)$/);
    if (!match) continue;
    countUps.set(element, {
      element,
      prefix: match[1] ?? '',
      target: Number(match[2] ?? '0'),
      suffix: match[3] ?? '',
      lastText: element.textContent ?? '',
      current: Number(match[2] ?? '0'),
      lastRecount: element.dataset['recount'],
      timeout: 0,
      frame: 0,
    });
  }

  const renderCount = (countUp: CountUp, value: number): void => {
    const text = `${countUp.prefix}${value}${countUp.suffix}`;
    const node = countUp.element.firstChild;
    // Mutate the EXISTING text node instead of assigning textContent — that
    // would replace the node, and Foldkit's patcher keeps a reference to the
    // original one, so every later model-driven text update (the reactive
    // land counters) would land in a detached node and never show up.
    if (node !== null && node.nodeType === Node.TEXT_NODE) {
      node.nodeValue = text;
    } else {
      countUp.element.textContent = text;
    }
    countUp.lastText = text;
    countUp.current = value;
  };

  // Eases from `from` to the countUp's target via a PEAK well above both, so
  // the number visibly SPINS through intermediates in either direction — no
  // snap-flips. Upward changes overshoot past the target and settle back;
  // downward ones can't overshoot (the floor at zero is right there and a
  // spurious low number reads as a glitch), so they wind UP above the start
  // and roll down through every value. A same-value recount bounces up and
  // back. Either way even a 0↔1 counter flies to ~6 mid-flight — that
  // exaggeration is what sells the recount.
  const animateCount = (countUp: CountUp, from: number, milliseconds: number): void => {
    window.cancelAnimationFrame(countUp.frame);
    const target = countUp.target;
    // The reach scales with the NUMBER'S SIZE, floored at a bold minimum:
    // a 0↔1 land counter still pops to ~6, while "1015 minutes" flies
    // ~120 over before settling. (Scaling by the DELTA was tried twice and
    // read as stutter/clumsy — the magnitude is the right knob.)
    const overshootStep = Math.max(5, Math.round(Math.max(from, target) * 0.12));
    const peak = Math.max(from, target) + overshootStep;
    // Split the duration roughly by distance so both legs move at a similar
    // clip: a long climb gets most of the time, a short wind-up pops fast
    // and leaves room for the descent.
    const rise = peak - from;
    const fall = peak - target;
    const split = Math.min(0.7, Math.max(0.3, rise / (rise + fall)));
    const startedAt = performance.now();
    const step = (now: number): void => {
      const progress = Math.min(1, (now - startedAt) / milliseconds);
      let value: number;
      if (progress < split) {
        const eased = 1 - (1 - progress / split) ** 3;
        value = from + (peak - from) * eased;
      } else {
        const eased = 1 - (1 - (progress - split) / (1 - split)) ** 3;
        value = peak + (target - peak) * eased;
      }
      renderCount(countUp, Math.max(0, Math.round(value)));
      if (progress < 1) countUp.frame = window.requestAnimationFrame(step);
    };
    countUp.frame = window.requestAnimationFrame(step);
  };

  const startCountUp = (countUp: CountUp, delaySeconds: number): void => {
    window.clearTimeout(countUp.timeout);
    window.cancelAnimationFrame(countUp.frame);
    // The element shows its CURRENT resting value here (the view may have
    // changed it since mount) — re-parse so the animation lands on it.
    const match = (countUp.element.textContent ?? '').match(/^([^\d]*)(\d+)([\s\S]*)$/);
    if (match) {
      countUp.prefix = match[1] ?? '';
      countUp.target = Number(match[2] ?? '0');
      countUp.suffix = match[3] ?? '';
    }
    renderCount(countUp, 0);
    // No buffer past the element's own reveal delay — a revealed number
    // that sits on 0 before it starts moving reads as a stall.
    countUp.timeout = window.setTimeout(() => {
      animateCount(countUp, 0, COUNT_UP_MILLISECONDS);
    }, delaySeconds * 1000);
  };

  const cancelCountUp = (countUp: CountUp): void => {
    window.clearTimeout(countUp.timeout);
    window.cancelAnimationFrame(countUp.frame);
    // Re-parse before settling: the model may have patched a new value in
    // since our fields were last synced (league-filter click racing the
    // reveal observer) — settling on the stale target would overwrite it.
    const match = (countUp.element.textContent ?? '').match(/^([^\d]*)(\d+)([\s\S]*)$/);
    if (match && countUp.lastText !== (countUp.element.textContent ?? '')) {
      countUp.prefix = match[1] ?? '';
      countUp.target = Number(match[2] ?? '0');
      countUp.suffix = match[3] ?? '';
    }
    renderCount(countUp, countUp.target);
  };

  cleanups.push(() => {
    for (const countUp of countUps.values()) cancelCountUp(countUp);
  });

  // ----- Scrambles -----------------------------------------------------------
  // [data-scramble] — the calculating feel for display values a count-up
  // can't serve (single-significant-digit figures like "€1B"): every
  // character rolls through a pool of its own KIND — currency signs,
  // digits 1–9, magnitude letters — and the text locks left to right onto
  // the real value, slot-machine style.

  interface Scramble {
    readonly element: HTMLElement;
    readonly final: string;
    timeout: number;
    interval: number;
  }

  const SCRAMBLE_MILLISECONDS = COUNT_UP_MILLISECONDS; // one shared tempo
  const SCRAMBLE_TICK_MS = 60;
  // Pool per character KIND, keyed off the character the roll locks onto:
  // a digit rolls digits, a currency sign rolls currency signs (limited to
  // glyphs Anton actually carries — an exotic sign would fall back to
  // Arial Narrow mid-roll and visibly jump in width), a magnitude letter
  // rolls magnitude letters — and punctuation (the ':' in a score) holds
  // still, so "7:0" rolls like a score and "€1B" like a price tag.
  const scramblePoolFor = (character: string): string => {
    if (/[0-9]/.test(character)) return '123456789';
    if ('$£¥¢€'.includes(character)) return '$£¥¢€';
    if (/[A-Z]/i.test(character)) return 'KMBT';
    return character;
  };

  const scrambles = new Map<HTMLElement, Scramble>();
  for (const element of root.querySelectorAll<HTMLElement>('[data-scramble]')) {
    scrambles.set(element, {
      element,
      final: element.textContent ?? '',
      timeout: 0,
      interval: 0,
    });
  }

  const renderScramble = (scramble: Scramble, text: string): void => {
    // Mutate the existing text node — the same Foldkit-patcher constraint
    // as renderCount above.
    const node = scramble.element.firstChild;
    if (node !== null && node.nodeType === Node.TEXT_NODE) {
      node.nodeValue = text;
    } else {
      scramble.element.textContent = text;
    }
  };

  const stopScramble = (scramble: Scramble): void => {
    window.clearTimeout(scramble.timeout);
    window.clearInterval(scramble.interval);
    renderScramble(scramble, scramble.final);
  };

  const startScramble = (scramble: Scramble, delaySeconds: number): void => {
    window.clearTimeout(scramble.timeout);
    window.clearInterval(scramble.interval);
    scramble.timeout = window.setTimeout(() => {
      const startedAt = performance.now();
      const tick = (): void => {
        const progress = (performance.now() - startedAt) / SCRAMBLE_MILLISECONDS;
        if (progress >= 1) {
          stopScramble(scramble);
          return;
        }
        let text = '';
        for (let index = 0; index < scramble.final.length; index++) {
          // Position i locks once progress passes (i+1)/n; until then it
          // rolls random characters of its own kind.
          if (progress >= (index + 1) / scramble.final.length) {
            text += scramble.final[index];
          } else {
            const pool = scramblePoolFor(scramble.final[index]!);
            text += pool[Math.floor(Math.random() * pool.length)];
          }
        }
        renderScramble(scramble, text);
      };
      // First frame immediately — waiting a full interval tick would flash
      // the resting (final) text before the roll starts.
      tick();
      scramble.interval = window.setInterval(tick, SCRAMBLE_TICK_MS);
    }, delaySeconds * 1000);
  };

  cleanups.push(() => {
    for (const scramble of scrambles.values()) stopScramble(scramble);
  });

  // ----- Neon flicker (the "Her game" sign) --------------------------------
  // Driven from JS with discrete opacity steps rather than a CSS animation.
  // A *running* CSS animation on opacity keeps the element on a compositing
  // layer in WebKit, where its big drop-shadow glow rasterizes at low
  // resolution (a coarse box) for as long as it runs. Setting opacity in
  // one-off steps leaves no animation running, so the element de-composites
  // between steps and the resting glow renders sharp — the same state you'd
  // otherwise only get after scrolling away and back on iOS Safari.

  const neon = root.querySelector<HTMLElement>('.hero-neon');
  if (neon) {
    // WebKit (Safari, all iOS browsers) rasterizes the sign's big drop-shadow
    // coarse under EVERY per-word flicker mechanism we tried — opacity steps
    // inside the filter, opacity or visibility on wrappers above a second
    // (even fully static) filter layer. Only the original shape survives
    // there: one filtered element, opacity stepped exclusively on the
    // unfiltered `.hero-neon` above it. So WebKit ignites the whole sign as
    // one piece, and the word-by-word show is a non-WebKit enhancement.
    const isWebKit = 'webkitConvertPointFromNodeToPage' in window;
    const lateWord = isWebKit ? null : neon.querySelector<HTMLElement>('.hero-neon-late');
    if (reduceMotion) {
      neon.style.opacity = '1';
    } else {
      const neonTimers: Array<number> = [];
      let neonFrame = 0;

      // "Her" igniting: two ULTRA-fast strikes (~45ms phases), a beat, then
      // the final one holds. Every "on" is full brightness — brightness play
      // is reserved for the winks after the sign is lit. The whole pattern is
      // shifted late so "Her" settles just ~300ms before "game" answers —
      // the photo gets a beat alone, then the sign ignites in one cascade.
      const powerOn: ReadonlyArray<readonly [number, number]> = [
        [0, 0],
        [345, 1],
        [390, 0.1],
        [435, 1],
        [480, 0.12],
        [705, 1],
      ];
      // The "game" segment is wired separately, like on a real sign: it stays
      // dark while "Her" strikes, then runs a four-blink pattern — blink,
      // ~300ms dark, blink, ultra-light pause, blink, ~300ms dark, final
      // blink. The final one lands at 500 + 1900 = 2400ms on the intro
      // clock: the exact moment the photo's settle (`hero-photo`, 2.4s)
      // comes to rest, and holds.
      const lateWordOn: ReadonlyArray<readonly [number, number]> = [
        [0, 0],
        [1005, 1],
        [1080, 0.1],
        [1380, 1],
        [1450, 0.1],
        [1540, 1],
        [1610, 0.14],
        [1900, 1],
      ];
      // The idle wink, once the sign is fully lit: the WHOLE sign sags and
      // recovers — one brightness dip, never a blackout, never per-segment.
      const wink: ReadonlyArray<readonly [number, number]> = [
        [0, 0.55],
        [200, 1],
      ];

      neon.style.opacity = '0';

      // The ignition runs on the PHOTO INTRO's own clock, not wall-clock
      // timers: every frame reads the `hero-photo` CSS animation's
      // currentTime and fires the steps that are due. Timers drifted (mount
      // lag, timer throttling) and kept landing the finale off the zoom
      // settle; sampling the animation itself makes the two inseparable by
      // construction. The 500ms lead is part of the same timeline.
      const HERO_DELAY_MS = 500;
      interface NeonStep {
        readonly at: number;
        readonly element: HTMLElement;
        readonly opacity: number;
      }
      const ignitionSteps: ReadonlyArray<NeonStep> = [
        ...powerOn.map(([ms, opacity]) => ({ at: HERO_DELAY_MS + ms, element: neon, opacity })),
        ...(lateWord
          ? lateWordOn.map(([ms, opacity]) => ({
              at: HERO_DELAY_MS + ms,
              element: lateWord,
              opacity,
            }))
          : []),
      ].sort((a, b) => a.at - b.at);

      // First wink a while after ignition, then every ~10–18s (jittered) —
      // frequent enough that a viewer idling on the hero catches one. Winks
      // are relative to "now", so plain timers are fine here.
      const scheduleWink = (delay: number): void => {
        neonTimers.push(
          window.setTimeout(() => {
            for (const [ms, opacity] of wink) {
              neonTimers.push(window.setTimeout(() => (neon.style.opacity = `${opacity}`), ms));
            }
            scheduleWink(10000 + Math.floor(Math.random() * 8000));
          }, delay),
        );
      };

      let introAnimation: Animation | null = null;
      const mountedAt = performance.now();
      const introClock = (): number => {
        // Resolved lazily — the animation may not exist yet on the very
        // first frame after mount. Falls back to time-since-mount if the
        // animation never appears (it will on any styled page).
        introAnimation ??=
          root
            .querySelector<HTMLElement>('.hero-photo')
            ?.getAnimations()
            .find((animation) => (animation as CSSAnimation).animationName === 'hero-photo') ??
          null;
        const time = introAnimation?.currentTime;
        return typeof time === 'number' ? time : performance.now() - mountedAt;
      };

      let nextStep = 0;
      const neonTick = (): void => {
        const now = introClock();
        while (nextStep < ignitionSteps.length && (ignitionSteps[nextStep]?.at ?? 0) <= now) {
          const step = ignitionSteps[nextStep];
          // Plain opacity for everything — including the "game" span's dark
          // phases at ~10%, so the unlit tube keeps a faint outline the way
          // a real neon does. (This path never runs on WebKit; see above.)
          if (step) step.element.style.opacity = `${step.opacity}`;
          nextStep += 1;
        }
        if (nextStep < ignitionSteps.length) {
          neonFrame = window.requestAnimationFrame(neonTick);
        } else {
          scheduleWink(8000);
        }
      };
      neonFrame = window.requestAnimationFrame(neonTick);

      cleanups.push(() => {
        window.cancelAnimationFrame(neonFrame);
        for (const timer of neonTimers) window.clearTimeout(timer);
        neon.style.opacity = '1';
        if (lateWord) lateWord.style.opacity = '';
      });
    }
  }

  // ----- Reveals -----------------------------------------------------------

  const revealTargets = Array.from(root.querySelectorAll<HTMLElement>('[data-reveal]'));

  if (reduceMotion) {
    for (const target of revealTargets) target.classList.add('is-in');
  } else {
    // 'mask' targets sit fully outside their wrapper's overflow clip and
    // 'wipe' targets are clip-pathed to zero area — either way the element
    // itself never registers an intersection, so the reveal would never
    // fire. Observe the parent box (a plain, visible container) instead and
    // map the notification back to the real target. Reveals replay: leaving
    // the viewport removes `.is-in` so the animation runs again on re-entry.
    //
    // Exception: targets inside a `[data-reveal-group]` container all key
    // off the CONTAINER's visibility — one simultaneous cascade instead of
    // per-item observation. The value picks the replay policy: 'once' never
    // un-reveals (the swipeable photo strip — swiping must not replay it),
    // 'replay' re-arms when the group leaves the viewport (the competitions
    // grid). 'replay' groups are a DESKTOP formation: on phones the same
    // cards stack into one tall column, where a single simultaneous beat
    // fires mostly below the fold — there they fall back to per-item
    // observation. 'once' groups stay grouped everywhere (the strip's whole
    // point is the phone behavior).
    //
    // A third policy, 'late', gathers only the container's `data-reveal-late`
    // targets and keys them off the container crossing the LATE line
    // (mid-viewport) — one shared scroll-gated beat (the statement strike +
    // rebuttal land together). Non-late targets inside stay per-item, so a
    // headline can reveal early while its payoff waits. Grouped on every
    // viewport and replays like 'replay'.
    const desktopViewport = window.matchMedia('(min-width: 768px)').matches;
    const targetsByProxy = new Map<Element, Array<HTMLElement>>();
    for (const target of revealTargets) {
      const groupElement = target.closest<HTMLElement>('[data-reveal-group]');
      const groupPolicy = groupElement?.dataset['revealGroup'];
      const group =
        groupElement &&
        (groupPolicy === 'once' ||
          (groupPolicy === 'late' ? target.dataset['revealLate'] !== undefined : desktopViewport))
          ? groupElement
          : null;
      const proxy =
        group ??
        (REVEAL_CLIPPED_VARIANTS.has(target.dataset['reveal'] ?? '')
          ? (target.parentElement ?? target)
          : target);
      const targets = targetsByProxy.get(proxy);
      if (targets) {
        targets.push(target);
      } else {
        targetsByProxy.set(proxy, [target]);
      }
    }

    // Draw-reveal elements get `.is-drawn` stamped when their dash transition
    // finishes — the CSS then drops the dash entirely (see styles.css; GPU
    // rasterizers glitched dashed non-scaling strokes at rest). Removed on
    // exit so the replay starts dashed again.
    for (const target of revealTargets) {
      if (target.dataset['reveal'] !== 'draw') continue;
      target.addEventListener('transitionend', (event) => {
        if (!target.classList.contains('is-in')) return;
        // Only the root's OWN dash transition ending counts — that is the
        // outline pen closing its lap, and the land borders' clip wipes
        // are timed to finish mid-lap (see LAND_BORDER_WIPES in main.ts),
        // so the whole figure is drawn. Bubbling transitions from the
        // region paths (their clips, the tint) must not stamp early.
        if (event.target === target && event.propertyName === 'stroke-dashoffset') {
          target.classList.add('is-drawn');
        }
      });
    }

    // Scroll direction at reveal time — some draw reveals only ANIMATE on
    // the way down (see data-draw-replay below); coming back up they must
    // stand complete, so the reader never watches the same pen twice.
    // The direction is STICKY across callbacks at the same position:
    // several observers share this handler, and the second callback of a
    // scroll step would otherwise read "no movement" and lose the sign.
    let lastRevealScrollY = window.scrollY;
    let revealScrollWasUp = false;

    const onReveal = (entries: ReadonlyArray<IntersectionObserverEntry>): void => {
      if (window.scrollY !== lastRevealScrollY) {
        revealScrollWasUp = window.scrollY < lastRevealScrollY;
        lastRevealScrollY = window.scrollY;
      }
      const scrollingUp = revealScrollWasUp;
      for (const entry of entries) {
        const revealOnce =
          entry.target instanceof HTMLElement && entry.target.dataset['revealGroup'] === 'once';
        for (const target of targetsByProxy.get(entry.target) ?? []) {
          if (revealOnce) {
            if (entry.isIntersecting) target.classList.add('is-in');
          } else {
            target.classList.toggle('is-in', entry.isIntersecting);
            if (!entry.isIntersecting) target.classList.remove('is-drawn');
            // Downward-only pens: re-entering from BELOW (scrolling up)
            // stamps `.is-drawn` together with `.is-in`, so the dash never
            // comes back and the figure is simply there, whole.
            if (
              entry.isIntersecting &&
              scrollingUp &&
              target.dataset['drawReplay'] === 'downward'
            ) {
              target.classList.add('is-drawn');
            }
          }
          for (const element of target.querySelectorAll<HTMLElement>('[data-countup]')) {
            const countUp = countUps.get(element);
            if (!countUp) continue;
            if (entry.isIntersecting) {
              startCountUp(countUp, parseRevealDelaySeconds(target));
            } else if (!revealOnce) {
              cancelCountUp(countUp);
            }
          }
          for (const element of target.querySelectorAll<HTMLElement>('[data-scramble]')) {
            const scramble = scrambles.get(element);
            if (!scramble) continue;
            if (entry.isIntersecting) {
              startScramble(scramble, parseRevealDelaySeconds(target));
            } else if (!revealOnce) {
              stopScramble(scramble);
            }
          }
        }
      }
    };

    // Phones get an earlier trigger: no bottom inset and a lower ratio, so
    // elements start revealing right as they cross the fold — the desktop
    // tuning (15% + an 8% inset) felt late on a small screen.
    const observer = new IntersectionObserver(
      onReveal,
      desktopViewport
        ? { threshold: 0.15, rootMargin: '0px 0px -8% 0px' }
        : { threshold: 0.05, rootMargin: '0px' },
    );
    // Group containers can be taller than the viewport, so a ratio threshold
    // fires far too late (15% of a 1200px grid = a sliver above the fold, or
    // never for very tall groups). They trigger on their top edge instead:
    // threshold 0 with only a small bottom inset, so the cascade starts
    // early — right as the group's top clears the fold.
    const groupObserver = new IntersectionObserver(onReveal, {
      threshold: 0,
      rootMargin: '0px 0px -10% 0px',
    });
    // Phones give draw targets their own late trigger: with the generic 5%
    // threshold the 2.4s pen stroke started the instant a sliver crossed
    // the fold and played out mostly below the viewport — the map read as
    // popping in fully drawn. Waiting for HALF the figure costs moments
    // (the map is short on a phone) but the stroke is actually watched.
    // The un-draw still waits for a full exit, so a half-scrolled map
    // doesn't reset mid-view.
    const drawObserver = desktopViewport
      ? null
      : new IntersectionObserver(
          (entries) => {
            for (const entry of entries) {
              for (const target of targetsByProxy.get(entry.target) ?? []) {
                if (entry.isIntersecting && entry.intersectionRatio >= 0.45) {
                  target.classList.add('is-in');
                } else if (!entry.isIntersecting) {
                  target.classList.remove('is-in', 'is-drawn');
                }
              }
            }
          },
          { threshold: [0, 0.5] },
        );
    // `data-reveal-late` elements wait for MID-viewport instead of first
    // sight. The trigger is scroll POSITION, not time: a slow reader gets
    // their pause for free (the element fires only once they scroll it to
    // the center band), while a fast scroller still sees the sequence at
    // their own pace. Time-based delays could be outrun — the statement
    // stamp either landed unseen or buried its setup line, depending on
    // how fast you scrolled.
    const lateObserver = new IntersectionObserver(onReveal, {
      threshold: 0,
      rootMargin: '0px 0px -42% 0px',
    });
    for (const proxy of targetsByProxy.keys()) {
      const isDraw =
        drawObserver !== null && proxy instanceof SVGElement && proxy.dataset['reveal'] === 'draw';
      const groupPolicy = proxy instanceof HTMLElement ? proxy.dataset['revealGroup'] : undefined;
      const isLate = proxy instanceof HTMLElement && proxy.dataset['revealLate'] !== undefined;
      // 'late' groups wait at the late line with their members.
      (isDraw && drawObserver
        ? drawObserver
        : groupPolicy === 'late'
          ? lateObserver
          : groupPolicy !== undefined
            ? groupObserver
            : isLate
              ? lateObserver
              : observer
      ).observe(proxy);
    }
    cleanups.push(() => {
      observer.disconnect();
      groupObserver.disconnect();
      drawObserver?.disconnect();
      lateObserver.disconnect();
    });
  }

  // ----- Header platform CTA -----------------------------------------------
  // Lives in the header (outside this root), so it's queried off `document`.
  // On the landing page it stays hidden while the hero — which owns the
  // primary CTA — is on screen, then slides in once the hero scrolls past.
  // On pages with no hero (profiles), or with reduced motion, it's shown.
  //
  // Driven from the rAF loop below (see `syncHeaderCta`) rather than an
  // IntersectionObserver + one-shot class: Foldkit re-renders the header on
  // state changes (opening the menu flips the button's aria/label) and would
  // wipe an imperatively-added class, and a re-render can even swap the node.
  // Re-asserting every frame — re-querying if the node was replaced — keeps
  // the CTA in sync no matter what the vdom does.

  const heroForCta = root.querySelector<HTMLElement>('#top');
  let headerCta: HTMLElement | null = null;
  let headerCtaShown: boolean | null = null;

  const syncHeaderCta = (shown: boolean): void => {
    // The header lives OUTSIDE this mount root and may not be in the DOM yet
    // when the mount runs — and a re-render can replace the node. Resolve it
    // lazily on every sync (a mount-time snapshot silently pinned `null`
    // forever, which is why the CTA never appeared).
    if (!headerCta?.isConnected) {
      headerCta = document.querySelector<HTMLElement>('.header-cta');
      headerCtaShown = null;
    }
    if (!headerCta) return;
    // Re-assert if our tracked state changed OR the DOM was reset under us.
    if (headerCtaShown === shown && headerCta.classList.contains('is-visible') === shown) return;
    headerCtaShown = shown;
    headerCta.classList.toggle('is-visible', shown);
  };

  // Reduced motion skips the rAF loop that drives the sync — just show it.
  if (reduceMotion) syncHeaderCta(true);
  cleanups.push(() => headerCta?.classList.remove('is-visible'));

  if (reduceMotion) {
    return () => {
      for (const cleanup of cleanups) cleanup();
    };
  }

  // ----- Parallax ------------------------------------------------------------

  const parallaxLayers: ReadonlyArray<ParallaxLayer> = Array.from(
    root.querySelectorAll<HTMLElement>('[data-parallax]'),
  ).map((element) => ({
    element,
    host: element.parentElement ?? element,
    speed: Number(element.dataset['parallax']) || 0.2,
  }));

  // ----- Scroll-scrubbed alignment -------------------------------------------
  // The element's own top margin IS the stagger being cancelled — measured
  // per frame so responsive margins survive rotations. Progress runs from
  // the parent entering the viewport's bottom edge (0), directly
  // scroll-bound: no easing, no lag, reversible by scrolling back. The
  // lead factor compresses the window — at 1 the scrub would finish with
  // the parent's center on the viewport's center; higher finishes that
  // much sooner. Was 1.4; eased to 1.25 when the honors stagger shrank to
  // 56px (alignment work, 2026-07-13) — the shorter travel deserves a
  // slightly longer window (1.1 read as lagging; user-tuned).

  const SCRUB_ALIGN_LEAD = 1.25;

  const scrubAlignLayers: ReadonlyArray<HTMLElement> = Array.from(
    root.querySelectorAll<HTMLElement>('[data-scrub-align]'),
  );

  // ----- Scroll-scrubbed docking ---------------------------------------------
  // The queen's portrait (section 05): on the section's landing frame it
  // rides `--dock-lift` (rem) higher so she is IN the frame, then sinks
  // with the scroll and sits on the section's bottom edge exactly when
  // that edge reaches the viewport's bottom — offset = the room still
  // below the viewport, capped at the lift. Desktop only: on phones the
  // portrait is mid-flow and a lift would tear a hole under the headline.

  const scrubDockLayers: ReadonlyArray<HTMLElement> = Array.from(
    root.querySelectorAll<HTMLElement>('[data-scrub-dock]'),
  );
  const dockViewport = window.matchMedia('(min-width: 48rem)');

  // ----- Scroll-pinned bracket build ----------------------------------------
  // The runway's own height (minus one viewport) is the scrub track: progress
  // 0 → 1 across it turns the numbered steps on one by one. The +1 head
  // margin holds a beat of empty scroll after the pin engages before step 0
  // fires (a wheel-lock "hard stop" was tried here and pulled — it kept
  // snagging the ride; the pause is plain scroll distance now), with a +2
  // denominator tail so the finished bracket parks before the stage unpins.

  const bracketScrubs: ReadonlyArray<{
    readonly runway: HTMLElement;
    readonly steps: ReadonlyArray<{ readonly element: HTMLElement; readonly index: number }>;
    readonly stepCount: number;
  }> = Array.from(root.querySelectorAll<HTMLElement>('[data-bracket-scrub]')).map((runway) => {
    const steps = Array.from(runway.querySelectorAll<HTMLElement>('[data-bracket-step]')).map(
      (element) => ({ element, index: Number(element.dataset['bracketStep'] ?? '0') }),
    );
    return {
      runway,
      steps,
      stepCount: steps.reduce((max, step) => Math.max(max, step.index + 1), 1),
    };
  });

  // ----- Scroll-velocity-reactive marquees ---------------------------------

  const marquees: Array<MarqueeTrack> = Array.from(
    root.querySelectorAll<HTMLElement>('[data-marquee]'),
  ).map((element) => {
    // The JS loop takes over from the CSS keyframe fallback — an active CSS
    // animation would override the inline transform written each frame.
    element.style.animation = 'none';
    return { element, offset: 0 };
  });

  // ----- Tilt cards ---------------------------------------------------------

  const tilts: Array<Tilt> = finePointer
    ? Array.from(root.querySelectorAll<HTMLElement>('[data-tilt]')).map((element) => {
        const tilt: Tilt = {
          element,
          hovered: false,
          targetX: 0,
          targetY: 0,
          x: 0,
          y: 0,
          settled: true,
        };
        const onMove = (event: MouseEvent): void => {
          const rect = element.getBoundingClientRect();
          const relX = (event.clientX - rect.left) / rect.width;
          const relY = (event.clientY - rect.top) / rect.height;
          tilt.hovered = true;
          tilt.targetY = (relX * 2 - 1) * TILT_MAX_DEGREES;
          tilt.targetX = -(relY * 2 - 1) * TILT_MAX_DEGREES;
        };
        const onLeave = (): void => {
          tilt.hovered = false;
          tilt.targetX = 0;
          tilt.targetY = 0;
        };
        element.addEventListener('mousemove', onMove, { passive: true });
        element.addEventListener('mouseleave', onLeave, { passive: true });
        cleanups.push(() => {
          element.removeEventListener('mousemove', onMove);
          element.removeEventListener('mouseleave', onLeave);
        });
        return tilt;
      })
    : [];

  // ----- Smooth wheel scrolling ----------------------------------------------
  // Wheel input feeds a target that the rAF loop eases toward (Lenis-style
  // inertia) instead of jumping the viewport in native steps. Wheel only:
  // touch scrolling, the scrollbar, and keyboard keep their native feel, and
  // it never runs under reduced motion (we're inside that gate here).

  let smoothTarget = window.scrollY;
  let smoothCurrent = window.scrollY;
  let smoothSettled = true;

  const onWheel = (event: WheelEvent): void => {
    if (event.ctrlKey || event.defaultPrevented) return;
    // Mostly-horizontal gestures belong to overflow-x containers (standings
    // tables) — leave them native.
    if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
    // The menu overlay pins the body (position: fixed) — nothing to scroll.
    if (document.body.style.position === 'fixed') return;
    const max = (document.scrollingElement?.scrollHeight ?? 0) - window.innerHeight;
    if (max <= 0) return;
    event.preventDefault();
    // Adopt any outside movement (anchor jump, keyboard, scrollbar drag)
    // that happened while we were settled.
    if (smoothSettled) {
      smoothTarget = window.scrollY;
      smoothCurrent = window.scrollY;
    }
    const scale = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1;
    smoothTarget = Math.max(0, Math.min(max, smoothTarget + event.deltaY * scale));
    smoothSettled = false;
  };
  window.addEventListener('wheel', onWheel, { passive: false });
  cleanups.push(() => window.removeEventListener('wheel', onWheel));

  // ----- The loop ------------------------------------------------------------

  let lastScrollY = window.scrollY;
  let scrollVelocity = 0;
  let lastFrameAt = performance.now();
  let frame = 0;

  const tick = (now: number): void => {
    const dt = Math.min(64, now - lastFrameAt) / 1000;
    lastFrameAt = now;

    // Ease the viewport toward the wheel target. `behavior: 'instant'`
    // matters — the page has CSS scroll-behavior: smooth, which would turn
    // every per-frame scrollTo into its own competing animation.
    if (!smoothSettled) {
      smoothCurrent = lerp(smoothCurrent, smoothTarget, 0.14);
      if (Math.abs(smoothCurrent - smoothTarget) < 0.5) {
        smoothCurrent = smoothTarget;
        smoothSettled = true;
      }
      window.scrollTo({ top: smoothCurrent, behavior: 'instant' });
    }

    // Smoothed scroll velocity in px/s, feeding the marquees.
    if (dt > 0) {
      const rawVelocity = (window.scrollY - lastScrollY) / dt;
      scrollVelocity = lerp(scrollVelocity, rawVelocity, 0.12);
      lastScrollY = window.scrollY;
    }

    // Model-driven recounts (the land counters react to the league filter):
    // the view stamps `data-recount` with the filter state plus the fresh
    // target. Watching that attribute instead of the text fixes two things
    // text-diffing couldn't: the spin fires even when the VALUE stays the
    // same (every recount should visibly spin), and it can't lose a change
    // to an in-flight animation frame overwriting the text node right after
    // Foldkit patches it (the counter then froze on a stale value).
    for (const countUp of countUps.values()) {
      const recount = countUp.element.dataset['recount'];
      if (recount === undefined || recount === countUp.lastRecount) continue;
      countUp.lastRecount = recount;
      countUp.target = Number(recount.split('|')[0] ?? '0');
      window.clearTimeout(countUp.timeout);
      animateCount(countUp, countUp.current, 700);
    }

    // Header CTA slides in the moment the hero photo visually disappears —
    // i.e. its bottom edge slips under the fixed header — not only once the
    // whole section clears the layout viewport. Pages without a hero
    // (profiles) simply show it.
    const headerBottom = headerCta?.closest('header')?.getBoundingClientRect().bottom ?? 0;
    syncHeaderCta(heroForCta ? heroForCta.getBoundingClientRect().bottom <= headerBottom : true);

    const viewportCenterY = window.innerHeight / 2;

    for (const layer of parallaxLayers) {
      const rect = layer.host.getBoundingClientRect();
      const centerDelta = rect.top + rect.height / 2 - viewportCenterY;
      const scrollOffset = -centerDelta * layer.speed;
      layer.element.style.transform = `translate3d(0, ${scrollOffset.toFixed(1)}px, 0)`;
    }

    for (const layer of scrubAlignLayers) {
      const host = layer.parentElement ?? layer;
      const rect = host.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const progress = Math.min(
        1,
        Math.max(
          0,
          ((viewportHeight - rect.top) / ((viewportHeight + rect.height) / 2)) * SCRUB_ALIGN_LEAD,
        ),
      );
      const stagger = Number.parseFloat(getComputedStyle(layer).marginTop) || 0;
      layer.style.transform = `translate3d(0, ${(-stagger * progress).toFixed(1)}px, 0)`;
      // The finishing CLICK: at full progress the host is stamped so CSS
      // can snap its .collage-snap children together (a transition, not a
      // scrub — it must run on its own element and its own clock).
      host.classList.toggle('is-assembled', progress >= 1);
    }

    for (const layer of scrubDockLayers) {
      if (!dockViewport.matches) {
        layer.style.transform = '';
        continue;
      }
      const section = layer.closest('section');
      if (!section) continue;
      // Rem-based like the pin fan vars, so the lift scales with type.
      const style = getComputedStyle(layer);
      const lift = (Number.parseFloat(style.getPropertyValue('--dock-lift')) || 0) * 16;
      // The ceiling keeps the lifted rider clear of the fixed header AND
      // leaves air for whatever crowns it (the queen's scribble) — without
      // it the mid-ride pin parked her hairline at the header's edge and
      // the crown vanished underneath. rect.top is measured WITH the
      // current translate; subtracting the matrix's Y gives the layout top.
      const ceiling = (Number.parseFloat(style.getPropertyValue('--dock-ceiling')) || 0) * 16;
      const matrix = new DOMMatrix(style.transform === 'none' ? undefined : style.transform);
      const layoutTop = layer.getBoundingClientRect().top - matrix.m42;
      const room = section.getBoundingClientRect().bottom - window.innerHeight;
      const offset = Math.max(0, Math.min(lift, room, layoutTop - ceiling));
      layer.style.transform = `translate3d(0, ${(-offset).toFixed(1)}px, 0)`;
    }

    for (const scrub of bracketScrubs) {
      if (!dockViewport.matches) {
        // Phones have no pin — the bracket is a plain stack, all steps on.
        for (const step of scrub.steps) step.element.classList.add('is-on');
        continue;
      }
      const rect = scrub.runway.getBoundingClientRect();
      const track = rect.height - window.innerHeight;
      const progress = track > 0 ? Math.min(1, Math.max(0, -rect.top / track)) : 1;
      // The build only ever ADDS while the reader is on the runway: coming
      // back up (from below, progress starts at 1 anyway) the bracket rides
      // through standing complete instead of dismantling itself. Steps
      // reset only once the whole runway sits BELOW the viewport — with
      // the reader safely above, the teardown is invisible and the next
      // descent builds from zero again. (Resetting at the unpin line was
      // visible: the upward warp parks the stage in view just above it.)
      const clearedAbove = rect.top > window.innerHeight;
      for (const step of scrub.steps) {
        if (progress >= (step.index + 1) / (scrub.stepCount + 2)) {
          step.element.classList.add('is-on');
        } else if (clearedAbove) {
          step.element.classList.remove('is-on');
        }
      }
    }

    for (const marquee of marquees) {
      // Symmetric feel: scrolling up must drive the ticker as hard as
      // scrolling down. The base drift runs leftward, so a naive
      // base+boost muted upward scrolls (down read much faster) — the
      // boost first had to cancel the drift before the belt even turned.
      // Instead the drift's SIGN flips smoothly across a small
      // upward-velocity window; beyond it, both directions obey exactly
      // base + |velocity| × gain. At rest the belt still drifts left.
      const driftSign =
        scrollVelocity >= 0 ? 1 : Math.max(-1, 1 + (2 * scrollVelocity) / MARQUEE_FLIP_WINDOW);
      const speed = Math.max(
        -MARQUEE_MAX_SPEED,
        Math.min(
          MARQUEE_MAX_SPEED,
          -(MARQUEE_BASE_SPEED * driftSign + scrollVelocity * MARQUEE_VELOCITY_GAIN),
        ),
      );
      const half = marquee.element.scrollWidth / 2;
      if (half > 0) {
        // Keep the offset in (-half, 0] so the two copies swap seamlessly.
        marquee.offset = -(((-(marquee.offset + speed * dt) % half) + half) % half);
        marquee.element.style.transform = `translate3d(${marquee.offset.toFixed(1)}px, 0, 0)`;
      }
    }

    for (const tilt of tilts) {
      tilt.x = lerp(tilt.x, tilt.targetX, 0.14);
      tilt.y = lerp(tilt.y, tilt.targetY, 0.14);
      const resting = !tilt.hovered && Math.abs(tilt.x) < 0.05 && Math.abs(tilt.y) < 0.05;
      if (resting) {
        if (!tilt.settled) {
          tilt.element.style.transform = '';
          tilt.settled = true;
        }
      } else {
        tilt.element.style.transform = `perspective(700px) rotateX(${tilt.x.toFixed(2)}deg) rotateY(${tilt.y.toFixed(2)}deg)`;
        tilt.settled = false;
      }
    }

    frame = window.requestAnimationFrame(tick);
  };

  frame = window.requestAnimationFrame(tick);
  cleanups.push(() => window.cancelAnimationFrame(frame));

  return () => {
    for (const cleanup of cleanups) cleanup();
  };
};

export const MountMotion = Mount.define(
  'MountMotion',
  CompletedMountMotion,
  FailedMountMotion,
)((element) =>
  Effect.gen(function* () {
    if (!(element instanceof HTMLElement)) {
      return FailedMountMotion({ reason: 'Motion host is not an HTMLElement.' });
    }

    return yield* Effect.acquireRelease(
      Effect.try({
        try: () => setUpMotion(element),
        catch: (error) =>
          error instanceof Error ? error : new Error(`Failed to set up motion: ${error}`),
      }),
      (tearDown) => Effect.sync(tearDown),
    ).pipe(
      Effect.map(() => CompletedMountMotion()),
      Effect.catch((error) => Effect.succeed(FailedMountMotion({ reason: error.message }))),
    );
  }),
);

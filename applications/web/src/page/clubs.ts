import { RadioGroup } from '@foldkit/ui';
import clsx from 'clsx';
import { Option } from 'effect';
import { html } from 'foldkit/html';
import type { Html } from 'foldkit/html';

import landsScoutImage from '../assets/lands-scout.webp';
import {
  container,
  displayArrow,
  displayArrowSolo,
  kicker,
  maskedLine,
  revealClass,
} from '../components';
import { CZECHIA_PATH, CZECHIA_VIEW_BOX, CZECH_REGIONS } from '../czechia';
import { FIRST_LEAGUE, MAP_LEAGUE_LABELS, SECOND_LEAGUE, clubs, platformUrl } from '../data';
import type { Club } from '../data';
import { ClosedMapClub, OpenedMapClub, SelectedMapLeague, ToggledAreaUnit } from '../message';
import type { Message } from '../message';
import type { MapLeague, Model } from '../model';

const h = html<Message>();

// A pin filtered out by the league toggle is hidden outright (display:none
// on its wrapper — see the pin wrapper below), never removed from the DOM,
// so switching back is instant and the reveal system keeps its targets.
// Which historical land each club belongs to — everything not listed is
// Bohemian. Drives the region checkboxes: unchecking a land removes its
// pins from the map entirely. Jihlava counts as Moravian: the map draws
// the REAL land border (czechia.ts), and the city sits on its Moravian
// side — the kraj Vysočina grouping doesn't apply here.
const MORAVIAN_CLUBS = new Set([
  'lokomotiva-brno',
  'artis-brno',
  'sigma-olomouc',
  'slovacko',
  'vysocina-jihlava',
]);
const SILESIAN_CLUBS = new Set(['banik-ostrava']);

const clubLand = (club: Club): string =>
  MORAVIAN_CLUBS.has(club.slug) ? 'Moravia' : SILESIAN_CLUBS.has(club.slug) ? 'Silesia' : 'Bohemia';

// A pin OPENS the club's card over the map (clicking it again closes it) —
// navigation to the profile lives on the card's button, not here.
// Every team living on a club's pin: the club itself plus its reserve side.
const pinTeams = (club: Club): ReadonlyArray<Club> => [
  club,
  ...clubs.filter((candidate) => candidate.parent === club.slug),
];

const teamMatchesLeague = (model: Model, team: Club): boolean =>
  model.mapLeague === 'All' ||
  (model.mapLeague === 'First' && team.league === FIRST_LEAGUE) ||
  (model.mapLeague === 'Second' && team.league === SECOND_LEAGUE);

// Where a pin's crest sits relative to its dot. Every dot is at the
// club's TRUE projected city location; in crowded cities (Prague ×4, Brno
// ×2) the crests fan OUT along angled target lines so the logos stay
// readable while the dots stay honest. dx/dy in rem, derived from the
// pin's angle — never authored directly.
interface Fan {
  readonly dx: number;
  readonly dy: number;
}

// Every connector line is the SAME length within a breakpoint — a pin
// differs only by its ANGLE, in degrees: 0 = straight up, positive leans
// right, ±90 = flat, past ±90 the crest hangs below the dot. Both angle
// sets are vetted against the geometric guard in map-collisions.test.ts
// by the uniform-length solver in the session scratchpad — rerun it when
// dots move or a pin joins.
const PIN_LINE_REM = 2;
// Visually halved once more by --fan-scale (see .club-pin in styles.css).
const PIN_LINE_PHONE_REM = 2;

const fanFromAngle = (degrees: number, length: number): Fan => ({
  dx: Math.sin((degrees * Math.PI) / 180) * length,
  dy: Math.cos((degrees * Math.PI) / 180) * length,
});

const PIN_ANGLE: Record<string, number> = {
  'sparta-praha': -45,
  'slavia-praha': 50,
  'prague-raptors': -130,
  'abc-branik': 135,
  // Artis sits practically on the same dot — the Brno pair splits into a
  // vertical stalk (Artis, default 0°) and a flat-left one.
  'lokomotiva-brno': -90,
  // Hradec's dot sits directly above — the Elbe pair splits the same way.
  pardubice: 90,
};

// Phone-only geometry (see .club-pin in styles.css for the var plumbing).
// At a third of the desktop size the true city dots of Prague and Brno sit
// pixels apart — a smudge, not a cluster — so same-city pins collapse onto
// ONE shared anchor there, and their crests fan into whatever space the
// neighboring cities leave free (Plzeň blocks Prague's west, Dynamo its
// south, Teplice's dot the northwest). Values tuned against the geometric
// collision probe in map-collisions.test.ts — don't eyeball-edit these;
// re-run that test.
const PIN_ANCHOR_PHONE: Record<string, { readonly x: number; readonly y: number }> = {
  'sparta-praha': { x: 34.5, y: 39.6 },
  'slavia-praha': { x: 34.5, y: 39.6 },
  'prague-raptors': { x: 34.5, y: 39.6 },
  'abc-branik': { x: 34.5, y: 39.6 },
  'lokomotiva-brno': { x: 67.2, y: 74.4 },
  'artis-brno': { x: 67.2, y: 74.4 },
};

// Phone-only angles: the shared-anchor clusters need their own spread,
// and the neighbourhoods differ at a third of the size. Solved by the
// uniform-length solver (deviation-penalized, so only pins that must
// rotate differ from their desktop selves).
const PIN_ANGLE_PHONE: Record<string, number> = {
  'sparta-praha': -125,
  'slavia-praha': 5,
  'prague-raptors': 75,
  'abc-branik': 145,
  'vysocina-jihlava': -10,
  // Brno's north is pinched between Pardubice's chip and Sigma's dot, so
  // the pair hangs BELOW the shared anchor instead.
  'artis-brno': -125,
  'lokomotiva-brno': 140,
  'dynamo-ceske-budejovice': -15,
  'hradec-kralove': 45,
  slovacko: 45,
  pardubice: 120,
};

// The map choreography: the outline pen runs its lap while each internal
// land border wipes in top-down, timed to MEET the pen at the two points
// where that border joins the outline; the whole figure is done when the
// pen closes the lap (MAP_DRAWN — the borders always finish mid-lap, see
// LAND_BORDER_WIPES). Then the wine tint fades the lands in one by one,
// and only on the finished figure do the pins land, land by land.
const MAP_DRAWN_SECONDS = 0.7;

// Per-land border-wipe timing (--border-delay/--border-duration, in
// seconds from `.is-in`). Derived from the map geometry by the
// junction-times script (session scratchpad): take the pen's lap
// (MAP_DRAWN_SECONDS, draw easing inverted), find when it passes the two
// junctions where a land border meets the outline, and solve the linear
// top-down front over the carrier path's own bbox so it crosses both
// junctions exactly then. Bohemia's path carries the Bohemia–Moravia
// border (junctions at 0.295s/0.457s of the lap); Silesia's carries the
// Moravia–Silesia one, enclaves included (outer junctions 0.318s/0.375s).
// Moravia carries nothing — both its borders are drawn by its neighbours,
// and one front could never match two junction schedules; its stroke is
// hidden below. Regenerate these when the map geometry changes.
const LAND_BORDER_WIPES: Record<string, { delay: number; duration: number }> = {
  Bohemia: { delay: 0.18, duration: 0.335 },
  Silesia: { delay: 0.303, duration: 0.075 },
};

// The tint wave: the lands fade in one AFTER another in CZECH_REGIONS
// order (Bohemia, Moravia, Silesia — already west to east), spread evenly
// across the wave window; each fade takes 0.35s (`land-tint-in` in
// styles.css). Ordinal on purpose: Moravia's and Silesia's label anchors
// sit at nearly the same x, so a position-mapped delay fired them
// together. The delay counts from the `.is-drawn` stamp
// (≈ MAP_DRAWN_SECONDS in), so only the wave component belongs here.
const TINT_WAVE_SECONDS = 0.6;
const landTintDelaySeconds = (index: number): string =>
  ((index / (CZECH_REGIONS.length - 1)) * TINT_WAVE_SECONDS).toFixed(2);

// The pins land WITH their land's tint — every club of a land appears the
// moment its wine fill starts fading in. The tint counts its delay from
// the `.is-drawn` stamp while the pins count theirs from `.is-in`, so the
// pins re-add the drawn figure (MAP_DRAWN) on top of the land's tint slot.
const pinRevealDelaySeconds = (club: Club): string => {
  const landIndex = CZECH_REGIONS.findIndex((region) => region.name === clubLand(club));
  return (MAP_DRAWN_SECONDS + Number(landTintDelaySeconds(landIndex))).toFixed(2);
};

// Crest artwork with more built-in transparent padding than its peers
// reads smaller inside the shared chip circle — scale it back up.
const CREST_SCALE: Record<string, number> = {
  'sparta-praha': 1.1,
  'hradec-kralove': 1.1,
};

const clubPin = (model: Model, club: Club): Html => {
  // Target-line pin: a white dot marks the exact spot, a thin connector
  // runs from the dot to the crest floating above (angled in crowded
  // cities — see PIN_ANGLE). The button is a zero-size anchor at the dot;
  // hover scales ONLY the crest chip (around its own center) — the dot,
  // line, and tooltip hold still, so the tooltip doesn't shrink with the
  // crest on hover-out.
  // The banner rows (also decides the rows' heft: a lone team gets a
  // chunkier row than an A+B pair, which must stay under the crest).
  const bannerTeams = pinTeams(club).filter((team) => teamMatchesLeague(model, team));
  const angle = PIN_ANGLE[club.slug] ?? 0;
  const phoneAngle = PIN_ANGLE_PHONE[club.slug] ?? angle;
  const fan = fanFromAngle(angle, PIN_LINE_REM);
  const phoneFan = fanFromAngle(phoneAngle, PIN_LINE_PHONE_REM);
  const phoneAnchor = PIN_ANCHOR_PHONE[club.slug];
  // The open card's pin wears a pink ring — hover already talks (the
  // crest grows), the ring answers WHICH one is selected.
  const selected = Option.contains(model.mapClub, club.slug);
  // The root is a DIV, not a button: the banner rows are links, and links
  // must not nest inside a button (invalid HTML, broken for screen
  // readers). The crest below is the actual button; the root carries the
  // geometry vars, the reveal target and the selection/land data.
  return h.div(
    [
      // Selection as a data attribute — styles.css keys the selected ring
      // and banner state off it (a class would work now that reveals are
      // model-driven, but the attribute reads fine and the CSS is settled).
      h.DataAttribute('selected', selected ? 'true' : 'false'),
      // The z-index transition lives in styles.css (.club-pin): a fresh
      // hover rises after a 150ms hold, the drop on hover-out DECAYS over
      // the scale-back. The REVEAL deliberately does NOT live on this
      // root: the reveal rules own the `transition` shorthand, and on a
      // shared element they silently erased the z-index transition (the
      // decay never ran — Slavia popped over Sparta's closing pill). The
      // inner wrapper below carries it instead.
      h.Class('club-pin group absolute z-10 hover:z-30'),
      // Pairs the pin with its land: hovering the pin keeps the land's
      // hover tint alive (see the data-land rules in styles.css).
      h.DataAttribute('land', clubLand(club)),
      // All geometry rides CSS vars; the `-phone` variants (when present)
      // win below `md` via the fallback plumbing in styles.css. That's what
      // lets crowded cities collapse onto shared anchors and re-fan into
      // free space on phones while desktop keeps its honest dots.
      h.Style({
        '--reveal-delay': `${pinRevealDelaySeconds(club)}s`,
        '--pin-x': `${club.x}%`,
        '--pin-y': `${club.y}%`,
        '--fan-x': `${fan.dx}rem`,
        '--fan-y': `${fan.dy}rem`,
        '--fan-len': `${PIN_LINE_REM}rem`,
        '--fan-angle': `${angle}deg`,
        ...(phoneAnchor === undefined
          ? {}
          : { '--pin-x-phone': `${phoneAnchor.x}%`, '--pin-y-phone': `${phoneAnchor.y}%` }),
        ...(phoneAngle === angle && PIN_LINE_PHONE_REM === PIN_LINE_REM
          ? {}
          : {
              '--fan-x-phone': `${phoneFan.dx}rem`,
              '--fan-y-phone': `${phoneFan.dy}rem`,
              '--fan-len-phone': `${PIN_LINE_PHONE_REM}rem`,
              '--fan-angle-phone': `${phoneAngle}deg`,
            }),
      }),
    ],
    [
      // The reveal wrapper: the reveal rules own the `transition`
      // shorthand, so opacity/transform reveals must not share an element
      // with the root's z-index transition (they silently erased it).
      // The `.is-in` class renders from the Model here like everywhere
      // else; --reveal-delay inherits from the root. Revealed as part of
      // the map's replay group, but only after the draw-in finishes —
      // land by land (see pinRevealDelaySeconds).
      h.div(
        [
          h.Class(revealClass(model, `pin-${club.slug}`)),
          h.DataAttribute('reveal', 'up'),
          h.DataAttribute('reveal-key', `pin-${club.slug}`),
        ],
        [
          // The connector, rotated around the dot (origin-bottom, bottom = dot).
          h.div(
            [h.Class('club-pin-line absolute bottom-0 left-0 w-px origin-bottom bg-paper')],
            [],
          ),
          h.div(
            [
              h.Class(
                'club-pin-dot absolute h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-paper',
              ),
            ],
            [],
          ),
          // The chip: every crest sits inside an identical paper circle —
          // normalization by construction (shields, circles, and star-topped
          // crests all read as one calm system). A few crest images carry
          // extra transparent padding and read smaller than their peers —
          // CREST_SCALE nudges those up to the same optical size.
          h.button(
            [
              h.Type('button'),
              h.OnClick(selected ? ClosedMapClub() : OpenedMapClub({ slug: club.slug })),
              h.AriaLabel(`${club.name} — ${club.city}, ${club.league}`),
              // The pin toggles its club card open/closed — say so, instead
              // of signalling selection by ring color alone.
              h.AriaExpanded(selected),
              h.Class(
                clsx(
                  'club-pin-chip absolute flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-paper p-1.5 shadow-[0_2px_10px_rgba(0,0,0,0.45)] transition-[scale,box-shadow] delay-[250ms] duration-300 group-hover:scale-110 group-hover:delay-0 group-hover:duration-150 sm:h-10 sm:w-10 sm:p-2 md:h-16 md:w-16 md:p-3',
                  { 'scale-110 ring-2 ring-pink delay-0 md:ring-[3px]': selected },
                ),
              ),
            ],
            [
              h.img([
                h.Src(club.logo),
                h.Alt(''),
                h.Loading('lazy'),
                h.Class('h-full w-full object-contain'),
                ...(CREST_SCALE[club.slug]
                  ? [h.Style({ transform: `scale(${CREST_SCALE[club.slug]})` })]
                  : []),
              ]),
            ],
          ),
          // The hover banner — an "achievement toast": a paper bar slides out
          // of the crest to the right. The outer span is a clipping WINDOW
          // whose left boundary sits exactly at the crest's center, so the
          // bar's background structurally cannot paint left of the circle in
          // any animation phase — it retreats BEHIND the crest, never into
          // the open. Rendered AFTER the crest button (tab order: crest →
          // its own rows) and sunk below it with -z-10 so the crest still
          // paints on top.
          h.span(
            [
              h.Class(
                'club-pin-banner pointer-events-none absolute -z-10 block w-max overflow-hidden py-5 pr-6 text-left whitespace-nowrap',
              ),
            ],
            [
              h.span(
                [
                  // A columns grid (name / league / arrow), so the pink league
                  // labels align even when the A and B names differ in length.
                  // overflow-hidden clips the rows' hover fill to the pill's
                  // rounded cap.
                  h.Class(
                    'club-pin-banner-bar grid w-max grid-cols-[max-content_max-content_max-content] items-center gap-x-3 overflow-hidden bg-paper shadow-[0_6px_18px_rgba(0,0,0,0.45)]',
                  ),
                ],
                // One BUTTON-like link per team — the pill is the navigation:
                // hover (or a tap on phones) opens it, the row click goes to
                // the team's profile. The whole row is the hit area; its pink
                // hover fill starts exactly at the crest's right edge (the
                // ::before inset), so nothing peeks around the circle. One
                // line per team keeps the bar SHORTER than the crest that
                // hides its left edge; under the second-league filter a
                // parent pin reads as its B side. Subgrid keeps the columns
                // aligned across A and B.
                bannerTeams.map((team, index) =>
                  // Keyed by slug: the banner's rows appear and disappear with
                  // the league filter, so patch by identity — the first-row
                  // border and hover state follow the team, not the slot.
                  h.keyed('a')(
                    team.slug,
                    [
                      h.Href(`${platformUrl}/clubs/${team.slug}`),
                      // The hover fill SLIDES UP from below the row — the
                      // same signature move as the menu anchors' underlay,
                      // same curve. overflow-hidden keeps the slide inside
                      // its own row; the fill runs edge to edge (the crest
                      // hides its left reach, and the sliver of row peeking
                      // around the circle's curve must flood too).
                      h.Class(
                        clsx(
                          'group/row relative isolate col-span-3 grid grid-cols-subgrid items-center gap-x-3 overflow-hidden py-1.5 pr-5 pl-[calc(var(--chip-r)+0.8rem)]',
                          bannerTeams.length > 1 ? 'md:py-2' : 'md:py-3',
                          'before:absolute before:inset-y-0 before:right-0 before:left-0 before:-z-10 before:translate-y-[101%] before:bg-pink before:transition-transform before:duration-[450ms] before:ease-[cubic-bezier(0.22,1,0.36,1)] hover:before:translate-y-0',
                          { 'border-t border-ink/10': index > 0 },
                        ),
                      ),
                    ],
                    [
                      h.span(
                        [h.Class('display text-sm leading-none text-ink md:text-lg')],
                        [team.name],
                      ),
                      // A split-flap cell: at rest it reads the league, on
                      // hover the label rolls up and OPEN PROFILE rolls in
                      // from below — the row announces its own click, in
                      // sync with the pink flood (same duration and curve).
                      h.span(
                        [
                          h.Class(
                            'block h-[1.2em] overflow-hidden text-[10px] tracking-[0.2em] uppercase md:text-[11px]',
                          ),
                        ],
                        [
                          h.span(
                            [
                              h.Class(
                                'flex flex-col transition-transform duration-[450ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/row:-translate-y-1/2',
                              ),
                            ],
                            [
                              h.span([h.Class('block leading-[1.2] text-pink')], [team.league]),
                              h.span(
                                [h.Class('block leading-[1.2] text-ink'), h.AriaHidden(true)],
                                ['Open profile'],
                              ),
                            ],
                          ),
                        ],
                      ),
                      h.span(
                        [
                          // Full-strength ink like every other CTA arrow;
                          // the hover nudge is the same 0.14em press the
                          // platform-beckon arrows use.
                          h.Class('flex text-sm text-ink md:text-lg'),
                        ],
                        [displayArrowSolo],
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    ],
  );
};
// The map's league filter: three mutually-exclusive options, so a real
// radiogroup rather than a row of independent buttons (arrow-key roving and
// the radio semantics come from the component). The selected state is
// color-only visually, driven by the `data-checked` the component sets.
const mapLeagueFilter = (model: Model): Html =>
  RadioGroup.view<MapLeague, Message>({
    id: 'map-league-filter',
    selectedValue: Option.some(model.mapLeague),
    options: ['All', 'First', 'Second'],
    ariaLabel: 'Filter clubs by league',
    onSelect: (league) => SelectedMapLeague({ league }),
    toView: ({ group, options }) =>
      h.div(
        [
          ...group,
          // Centered on phones (one row, all three side by side); right-aligned
          // to the stage from md, where it reads as a map control.
          h.Class(
            clsx(
              'mx-auto mt-10 flex max-w-5xl flex-wrap justify-center gap-1.5 md:mt-14 md:justify-end md:gap-2',
              revealClass(model, 'map-filter'),
            ),
          ),
          h.DataAttribute('reveal', 'up'),
          h.DataAttribute('reveal-key', 'map-filter'),
        ],
        options.map((option) =>
          h.div(
            [
              ...option.option,
              // Compact on phones so all three fit one row (incl. the tighter
              // tracking — the canonical 0.2em wraps the row); from `md` up the
              // chips match the outlined-button spec (border-2 + text-xs — the
              // UEFA strategy link is the reference).
              h.Class(
                'cursor-pointer border border-paper px-2 py-1.5 text-[10px] tracking-[0.15em] text-paper uppercase transition-colors duration-300 hover:border-pink md:border-2 md:px-4 md:py-2 md:text-xs md:tracking-[0.2em] data-[checked]:border-pink data-[checked]:bg-pink data-[checked]:text-ink',
              ),
            ],
            [MAP_LEAGUE_LABELS[option.value]],
          ),
        ),
      ),
  });

export const clubsView = (model: Model): Html =>
  h.section(
    // Ink, not paper: the white map line work is the section's hero, and the
    // dark ground restores the light/dark rhythm around it (competitions is
    // photo-textured ink, champions after it is paper).
    [h.Id('across-the-lands'), h.Class('relative bg-ink py-16 text-paper md:py-24')],
    [
      // The lands scout, md+ only — the knight-mascot treatment (section
      // 01): a decorative accent anchored to the section's right edge,
      // behind the copy (the container below is z-10), sliding in from the
      // right and idle-floating. She surveys the headline and the counters
      // through her spyglass. Narrower caps than the knight — the figure is
      // a tall 1:2 portrait, so the knight's widths would blow her up huge.
      // Phones give her an in-flow stage inside the container instead (the
      // 01 grammar): the absolute corner seat has no room there and she sat
      // on the kicker.
      h.div(
        [
          h.Class(
            // 19% matches the knight's ~510px CAP HEIGHT at 1280, not her
            // width — the figure is a tall 1:2 portrait, so width parity
            // would still blow her up huge (sizes unified, user call).
            clsx(
              'pointer-events-none absolute z-0 hidden select-none md:top-12 md:right-10 md:block md:w-[19%] md:max-w-[260px] xl:right-[calc((100vw-80rem)/2+2.5rem)]',
              revealClass(model, 'clubs-scout'),
            ),
          ),
          h.DataAttribute('reveal', 'right'),
          h.DataAttribute('reveal-key', 'clubs-scout'),
          h.Style({ '--reveal-delay': '0.1s' }),
        ],
        [
          h.img([
            h.Src(landsScoutImage),
            h.Width('383'),
            h.Height('800'),
            h.Alt('Illustrated footballer in a pink kit scouting through a spyglass'),
            h.Loading('lazy'),
            h.Class('idle-float block w-full'),
            // The four-direction paper drop-shadow is a thin sticker
            // outline lifting the pink kit off the ink background.
            h.Style({
              filter:
                'drop-shadow(1.5px 0 0 var(--color-paper)) drop-shadow(-1.5px 0 0 var(--color-paper)) drop-shadow(0 1.5px 0 var(--color-paper)) drop-shadow(0 -1.5px 0 var(--color-paper))',
            }),
          ]),
        ],
      ),
      h.div(
        [h.Class(`${container} relative z-10`)],
        [
          kicker(model, '03', 'Across the lands', true, '/#across-the-lands'),
          h.h2(
            [h.Class('mt-10 md:mt-16')],
            [
              maskedLine(
                model,
                'clubs-headline',
                ['Where ', h.span([h.Class('text-pink')], ['she']), ' plays.'],
                'text-fluid-6xl-9xl',
                0,
              ),
            ],
          ),
          // The framing line — about the country, not the map (the map
          // speaks for itself). The area carries a dotted underline and
          // reveals the imperial conversion on hover/tap. Body face, not
          // `display` — the same call as 01's ledes: Anton is for headlines,
          // a three-line factual sentence in it is cognitive load.
          h.p(
            [
              h.Class(
                clsx(
                  'mt-8 max-w-2xl text-lg leading-relaxed md:mt-12 md:text-xl',
                  revealClass(model, 'clubs-lede'),
                ),
              ),
              h.DataAttribute('reveal', 'up'),
              h.DataAttribute('reveal-key', 'clubs-lede'),
            ],
            [
              'Quite a few clubs fit into ',
              // Desktop hover previews the metric figure via CSS (see
              // `.area-swap` in styles.css — gated to hover-capable devices
              // so sticky mobile hover can't fight the model); on touch a
              // tap TOGGLES it through the model. Both variants always
              // occupy the same grid cell, so the width never shifts — it's
              // fixed by the wider one, and the sentence period lives inside
              // each variant to hug its own number.
              // A real button so the unit swap also works from the keyboard
              // and gets the pink focus ring; cursor-help still signals
              // "informational" rather than navigational.
              h.button(
                [
                  h.Type('button'),
                  h.Class(
                    // justify-items-start + underline ON THE VARIANTS, not
                    // the button: the cell is as wide as the wider variant,
                    // and a centered short variant with a full-width
                    // underline floated mid-sentence instead of reading as
                    // plain text. clip-path, NOT overflow-hidden, hides the
                    // rolling figure — a non-visible overflow moves an
                    // inline box's baseline to its bottom edge and the
                    // number would sink out of the sentence's line.
                    'area-swap inline-grid cursor-help justify-items-start whitespace-nowrap select-none [clip-path:inset(0)]',
                  ),
                  h.OnClick(ToggledAreaUnit()),
                  h.AriaLabel('Toggle between metric and imperial area'),
                ],
                [
                  h.span(
                    [
                      h.Class(
                        // The odometer poses: metric parks ABOVE the clip,
                        // imperial BELOW — toggling rolls one out and the
                        // other through in the same direction.
                        `area-metric col-start-1 row-start-1 underline decoration-pink decoration-dotted decoration-2 underline-offset-4 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${model.isMapAreaImperial ? 'invisible -translate-y-full opacity-0' : 'translate-y-0 opacity-100'}`,
                      ),
                    ],
                    ['78,871 km².'],
                  ),
                  h.span(
                    [
                      h.Class(
                        `area-imperial col-start-1 row-start-1 underline decoration-pink decoration-dotted decoration-2 underline-offset-4 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${model.isMapAreaImperial ? 'translate-y-0 opacity-100' : 'invisible translate-y-full opacity-0'}`,
                      ),
                    ],
                    ['30,452 sq mi.'],
                  ),
                ],
              ),
              // The second sentence opens its own line — two beats, the same
              // device as 01's ledes.
              h.br([]),
              'The country’s ',
              h.span([h.Class('text-pink')], ['three biggest cities']),
              ' all have top-flight football.',
            ],
          ),
          // The land counters close the section head — the league filter
          // lives further down on the map's own beat, so the menu-jump
          // landing frame is just headline → payoff → stats. On phones this
          // row is a two-column composition: the counters stack vertically
          // on the left and the scout stands at the knight's scale on the
          // right (the 01 grammar — in-flow, full color, no animations);
          // md+ returns the three-column grid and its floating corner emblem.
          h.div(
            // justify-center + fixed column widths: the pair sits centered
            // with the SAME air to both container edges, and only a small
            // gutter between them.
            [h.Class('mt-8 flex items-center justify-center gap-3 md:mt-10 md:block')],
            [
              // The geography of the coverage, in the same count-up device
              // as the "On the rise" receipts — the lands' imbalance IS the
              // story. Plain display, deliberately NOT interactive: the old
              // land-checkbox toggling (counters + clicking the lands) read
              // as a glitch, not a feature (user call — removed with the
              // whole region-toggle mechanism). The numbers still REACT to
              // the league filter: with only the second league selected
              // they count that land's second-league sides (B teams count
              // via their parent's pin).
              h.div(
                [
                  h.Class(
                    'grid w-1/3 shrink-0 grid-cols-1 gap-8 md:w-auto md:grid-cols-3 md:gap-12',
                  ),
                ],
                (
                  [
                    ['Bohemian', 'Bohemia'],
                    ['Moravian', 'Moravia'],
                    ['Silesian', 'Silesia'],
                  ] as const
                ).map(([adjective, region], index) => {
                  const count = clubs.filter(
                    (candidate) =>
                      !candidate.parent &&
                      clubLand(candidate) === region &&
                      pinTeams(candidate).some((team) => teamMatchesLeague(model, team)),
                  ).length;
                  const value = `${count}`;
                  const label = `${adjective} ${count === 1 ? 'Club' : 'Clubs'}`;
                  return h.div(
                    [
                      h.Class(clsx('select-none', revealClass(model, `clubs-count-${index}`))),
                      h.DataAttribute('reveal', 'up'),
                      h.DataAttribute('reveal-key', `clubs-count-${index}`),
                      h.Style({ '--reveal-delay': `${index * 0.15}s` }),
                    ],
                    [
                      h.div([h.Class('mb-4 h-1 w-12 bg-pink')], []),
                      // Aria-hidden: the count-up/recount rewrites this
                      // text mid-flight — the sr-only twin (model-driven,
                      // so it follows the league filter too) carries the
                      // real value for screen readers.
                      h.div(
                        [
                          h.Class('display text-fluid-6xl-7xl text-pink'),
                          h.AriaHidden(true),
                          h.DataAttribute('countup', ''),
                          // EVERY league-filter interaction spins the
                          // counter, value change or not — motion.ts
                          // watches this attribute (league + target),
                          // never the text (see the recount loop there).
                          h.DataAttribute('recount', `${count}|${model.mapLeague}`),
                        ],
                        [value],
                      ),
                      h.span([h.Class('sr-only')], [value]),
                      h.div(
                        [
                          h.Class(
                            'mt-3 text-xs leading-relaxed tracking-[0.2em] uppercase md:whitespace-nowrap',
                          ),
                        ],
                        [label],
                      ),
                    ],
                  );
                }),
              ),
              // The scout's phone stage — w-[60%] puts her at the knight's
              // rendered height (~470px against 01's 467).
              h.div(
                [h.Class('w-[60%] shrink-0 md:hidden')],
                [
                  h.img([
                    h.Src(landsScoutImage),
                    h.Width('383'),
                    h.Height('800'),
                    h.Alt('Illustrated footballer in a pink kit scouting through a spyglass'),
                    h.Loading('lazy'),
                    h.Class('block h-auto w-full'),
                    // The same sticker outline as the md emblem.
                    h.Style({
                      filter:
                        'drop-shadow(1.5px 0 0 var(--color-paper)) drop-shadow(-1.5px 0 0 var(--color-paper)) drop-shadow(0 1.5px 0 var(--color-paper)) drop-shadow(0 -1.5px 0 var(--color-paper))',
                    }),
                  ]),
                ],
              ),
            ],
          ),
          // Map and the trailing CTA reveal as one beat (same device as the
          // competitions grid): the button belongs to the map's moment, not
          // a later scroll position below the tall figure.
          h.div(
            [h.DataAttribute('reveal-group', 'replay')],
            [
              // League filter — 'all' keeps both flights on the map, a league
              // hides the other one's pins. It sits ON the map's beat, right-aligned
              // to the stage: it is a MAP control, and up in the headline band
              // it floated orphaned in the section's landing frame (the menu
              // jump shows the head of the section while the map it controls
              // is still below the fold).
              mapLeagueFilter(model),
              h.div(
                // The chips row above owns the band spacing; the stage keeps
                // only a tight gap so the filter reads as part of the map.
                // On phones the map is NOT squeezed into the viewport: the
                // stage runs 180% of the screen inside this full-bleed
                // horizontal pan (the 01 photo-strip mechanism, minus the
                // snap) — crests keep their touch size and the country stays
                // legible. overflow-y-hidden so the reveals' translateY can't
                // make the pan vertically scrollable (the 01 lesson); the
                // vertical padding keeps edge pins inside that clip. From md
                // up the wrapper dissolves back into the plain centered stage.
                [
                  h.Class(
                    'no-scrollbar -mx-5 mt-4 overflow-x-auto overflow-y-hidden px-5 py-6 md:mx-auto md:mt-5 md:max-w-5xl md:overflow-visible md:p-0',
                  ),
                ],
                [
                  h.div(
                    [h.Class('map-stage relative w-[180%] md:w-auto')],
                    [
                      // The draw-in reveal lives on the SVG ROOT: stroke-dasharray
                      // and stroke-dashoffset are inherited properties, so the
                      // animated offset pen-draws the country outline. The root is
                      // the only safe carrier: WebKit's IntersectionObserver
                      // doesn't reliably fire for inner SVG elements like <g>
                      // (the map never drew on iPhones), so the observers must
                      // watch the root. (The old second reason — per-path
                      // classes being wiped by filter patches — died when
                      // reveals moved into the Model.) Each
                      // path carries pathLength=1 so the unit dash math works. The
                      // labels AND the region paths opt back out of the dash
                      // inheritance via `stroke-dasharray: none` (.region-label,
                      // .region-path — the regions reveal behind clips instead).
                      h.svg(
                        [
                          h.Xmlns('http://www.w3.org/2000/svg'),
                          h.ViewBox(CZECHIA_VIEW_BOX),
                          h.Class(clsx('h-auto w-full', revealClass(model, 'map-draw'))),
                          h.DataAttribute('reveal', 'draw'),
                          h.DataAttribute('reveal-key', 'map-draw'),
                          h.AriaHidden(true),
                        ],
                        [
                          // The three historical lands, each a tinted fill with
                          // its label — display only, the old checkbox toggling
                          // is gone (user call): every land always wears the wine
                          // tint (pink over ink). The internal borders don't pen-draw
                          // like the outline: each land's stroke wipes in top-down
                          // behind its own clip, timed to meet the outline pen at
                          // the junctions (see LAND_BORDER_WIPES). Moravia's stroke
                          // is `stroke-none` — its neighbours draw both its borders.
                          ...CZECH_REGIONS.map((region, index) => {
                            const wipe = LAND_BORDER_WIPES[region.name];
                            return h.path(
                              [
                                h.D(region.d),
                                h.DataAttribute('land', region.name),
                                h.Style({
                                  '--tint-delay': `${landTintDelaySeconds(index)}s`,
                                  // Inline on purpose: the unlayered .region-path
                                  // stroke in styles.css outweighs any utility.
                                  ...(wipe
                                    ? {
                                        '--border-delay': `${wipe.delay}s`,
                                        '--border-duration': `${wipe.duration}s`,
                                      }
                                    : { stroke: 'none' }),
                                }),
                                h.Class('region-path fill-pink/25 transition-[fill] duration-300'),
                              ],
                              [],
                            );
                          }),
                          h.path(
                            [
                              h.D(CZECHIA_PATH),
                              h.Attribute('pathLength', '1'),
                              h.Class('map-path'),
                            ],
                            [],
                          ),
                        ],
                      ),
                      // The league filter HIDES pins outright — no dimmed
                      // in-between state: every pin without a team in that league
                      // goes (a club whose B side plays the selected league keeps
                      // its pin). B sides never have a pin of their own — they
                      // live on their parent's.
                      //
                      // Hidden via display:none on a WRAPPER, never removed: the
                      // reveal system (the west-to-east pin wave) collects its
                      // targets once at mount, so a pin re-added after a filter
                      // round-trip would never get `.is-in` again and stay
                      // invisible forever. The wrapper also keeps the class churn
                      // away from the pin button itself — a patched class string
                      // would wipe the `is-in` the observer stamped on it.
                      ...clubs
                        .filter((club) => !club.parent)
                        .map((club) =>
                          h.div(
                            [
                              h.Class(
                                pinTeams(club).some((team) => teamMatchesLeague(model, team))
                                  ? 'contents'
                                  : 'hidden',
                              ),
                            ],
                            [clubPin(model, club)],
                          ),
                        ),
                      // While a card is open, an invisible backdrop over the map
                      // closes it on any click outside. It sits BELOW the pins
                      // (z-10), so clicking another pin still switches the card
                      // instead of merely closing this one.
                      ...(Option.isNone(model.mapClub)
                        ? []
                        : [
                            h.div(
                              [
                                h.Class('absolute inset-0 z-[5]'),
                                h.OnClick(ClosedMapClub()),
                                h.AriaHidden(true),
                              ],
                              [],
                            ),
                          ]),
                    ],
                  ),
                ],
              ),
              h.div(
                // No reveal — CTAs sit still while the content around them
                // animates, same as everywhere.
                [h.Class('mt-14 flex justify-center md:mt-20')],
                [
                  h.a(
                    [
                      h.Href(`${platformUrl}/clubs`),
                      h.Class(
                        'display inline-block bg-pink px-8 py-4 text-xl tracking-[0.08em] text-ink transition-colors duration-300 hover:bg-paper active:bg-paper md:text-2xl',
                      ),
                    ],
                    ['Discover all clubs', displayArrow],
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    ],
  );

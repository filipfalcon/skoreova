import { color } from '@skoreova/design/color.stylex';
import { duration, easing } from '@skoreova/design/motion.stylex';
import { layout, leading, space, type } from '@skoreova/design/scale.stylex';
import * as stylex from '@stylexjs/stylex';
import type { Attribute, Html, HtmlBuilder } from 'foldkit/html';

import { cta } from './cta.stylex';
import { displayCut } from './display-cut';
import { focusRing } from './focus-ring';
import type { Message } from './message';
import { type StyleXStyle, getStyleXAttributes } from './stylex-attributes';

const HOVER = '@media (hover: hover)';

const HIT = layout['touch-target'];

// A state change: Material 3's short4 on the standard easing.
const STATE_CHANGE = `${duration.short4} ${easing.standard}`;

/**
 * The call to action's sizes, Material 3's button sizes on this scale's steps.
 */
export type CtaSize = 'small' | 'medium' | 'large';

/**
 * The call to action's variants, Material 3's filled and outlined buttons.
 */
export type CtaVariant = 'filled' | 'outlined';

const styles = stylex.create({
  link: {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    fontSize: type['step-0'],
    lineHeight: leading['step-0'],
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
    textDecoration: 'none',
    color: color['on-primary-container'],
    backgroundColor: {
      default: color['primary-container'],
      ':active': color['on-surface'],
      ':hover': { default: null, [HOVER]: color['on-surface'] },
    },
    transition: `background-color ${STATE_CHANGE}, color ${STATE_CHANGE}`,
  },
  // Material 3's outlined button: no container, an outline in the outline role inside the box, so
  // both variants are one size, and its label on-surface, filled on-surface under a surface label
  // while hovered or pressed.
  outlined: {
    boxShadow: `inset 0 0 0 ${cta['outline-width']} ${color.outline}`,
    color: {
      default: color['on-surface'],
      ':active': color.surface,
      ':hover': { default: null, [HOVER]: color.surface },
    },
    backgroundColor: {
      default: 'transparent',
      ':active': color['on-surface'],
      ':hover': { default: null, [HOVER]: color['on-surface'] },
    },
  },
  // Material 3's Small button, 40dp tall with 16dp of inline padding: step 0's line plus space 2xs
  // above and below, 40px at the narrowest viewport and 50px at the widest.
  small: {
    paddingBlock: space['2xs'],
    paddingInline: space.s,
    // Where the box is shorter than a touch target, its pointer target reaches out to one,
    // centred; where it is taller, the box itself is the target.
    '::before': {
      content: '""',
      position: 'absolute',
      top: `min(0px, calc(50% - ${HIT} / 2))`,
      bottom: `min(0px, calc(50% - ${HIT} / 2))`,
      insetInline: 0,
    },
  },
  // Material 3's Medium button, 56dp tall with a 16dp label and 24dp of inline padding: step 0's
  // line plus space s above and below, 56px at the narrowest viewport and 70px at the widest, with
  // space m inline, exactly Material 3's at 320.
  medium: {
    paddingBlock: space.s,
    paddingInline: space.m,
  },
  // Material 3's Large button, 96dp tall with a 24dp Headline Small label and 48dp of inline
  // padding: step 2's line plus space l above and below, 95.04px at the narrowest viewport and
  // 121.25px at the widest, with space xl inline, exactly Material 3's at 320.
  large: {
    fontSize: type['step-2'],
    lineHeight: leading['step-2'],
    paddingBlock: space.l,
    paddingInline: space.xl,
  },
  // A caller's block size for the box: the label's line, 1lh, centred in it, the block padding the
  // rest.
  blockSize: (size: string) => ({
    paddingBlock: `calc((${size} - 1lh) / 2)`,
  }),
});

/**
 * A call to action: a link set as a button, in the display cut's tracked capitals. Filled, the
 * default, its container is primary and its label on-primary-container, the container on-surface
 * while hovered or pressed; outlined, it has no container but an outline.
 *
 * @param h - The view's HTML builder.
 * @param options - The link's destination, its size and variant, a block size its context sets in
 *   place of the size's own, and the attributes and styles its context adds.
 * @param children - The label, and anything set beside it.
 */
export const ctaLink = (
  h: HtmlBuilder<Message>,
  options: {
    readonly href: string;
    readonly size: CtaSize;
    readonly variant?: CtaVariant;
    readonly blockSize?: string;
    readonly attributes?: ReadonlyArray<Attribute<Message>>;
    readonly styles?: ReadonlyArray<StyleXStyle>;
  },
  children: ReadonlyArray<Html | string>,
): Html =>
  h.a(
    [
      h.Href(options.href),
      ...(options.attributes ?? []),
      ...getStyleXAttributes(
        h,
        stylex.defaultMarker(),
        displayCut.cut,
        focusRing.ring,
        styles.link,
        options.variant === 'outlined' && styles.outlined,
        styles[options.size],
        options.blockSize !== undefined && styles.blockSize(options.blockSize),
        ...(options.styles ?? []),
      ),
    ],
    children,
  );

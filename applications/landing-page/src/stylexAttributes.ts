import * as stylex from '@stylexjs/stylex';

/**
 * Anything `stylex.props` accepts: compiled styles, falsy values for conditional ones, and nested
 * arrays of both.
 */
export type StyleXStyle = stylex.StyleXArray<
  | (null | undefined | stylex.CompiledStyles)
  | boolean
  | Readonly<[stylex.CompiledStyles, stylex.InlineStyles]>
>;

type StyleXProps = {
  readonly className?: string;
  readonly 'data-style-src'?: string;
  readonly style?: Readonly<Record<string, string | number>>;
};

const getStyleXProps: (...styles: ReadonlyArray<StyleXStyle>) => StyleXProps = stylex.props;

interface StyleXHtml<ClassAttribute, StyleAttribute, DataAttribute> {
  readonly Class: (value: string) => ClassAttribute;
  readonly DataAttribute: (key: string, value: string) => DataAttribute;
  readonly Style: (value: Record<string, string>) => StyleAttribute;
}

const toFoldkitStyle = (
  style: Readonly<Record<string, string | number>>,
): Record<string, string> => {
  const foldkitStyle: Record<string, string> = {};
  for (const key in style) {
    const value = style[key];
    if (value !== undefined) {
      foldkitStyle[key] = typeof value === 'string' ? value : String(value);
    }
  }
  return foldkitStyle;
};

const toAttributes = <ClassAttribute, StyleAttribute, DataAttribute>(
  h: StyleXHtml<ClassAttribute, StyleAttribute, DataAttribute>,
  extraClasses: string,
  styles: ReadonlyArray<StyleXStyle>,
): ReadonlyArray<ClassAttribute | StyleAttribute | DataAttribute> => {
  const props = getStyleXProps(...styles);
  const attributes: Array<ClassAttribute | StyleAttribute | DataAttribute> = [];

  const className = [extraClasses, props.className ?? ''].filter((part) => part !== '').join(' ');
  if (className !== '') {
    attributes.push(h.Class(className));
  }
  if (props.style !== undefined) {
    attributes.push(h.Style(toFoldkitStyle(props.style)));
  }
  const styleSrc = props['data-style-src'];
  if (styleSrc !== undefined && styleSrc !== '') {
    attributes.push(h.DataAttribute('style-src', styleSrc));
  }

  return attributes;
};

/**
 * The Foldkit attributes that apply the given StyleX styles to an element.
 *
 * @param h The attribute builder of the element's view.
 * @param styles The styles to apply, later ones winning.
 */
export const getStyleXAttributes = <ClassAttribute, StyleAttribute, DataAttribute>(
  h: StyleXHtml<ClassAttribute, StyleAttribute, DataAttribute>,
  ...styles: ReadonlyArray<StyleXStyle>
): ReadonlyArray<ClassAttribute | StyleAttribute | DataAttribute> => toAttributes(h, '', styles);

/**
 * The Foldkit attributes that apply the given StyleX styles to an element that also carries plain
 * classes.
 *
 * Foldkit keeps one class attribute per element, the last one written, so a plain class the
 * stylesheet or a test selects by cannot ride a second `Class` beside the compiled styles; it is
 * merged into the one they produce.
 *
 * @param h The attribute builder of the element's view.
 * @param extraClasses The plain classes, space-separated, merged into the element's one class
 *   attribute.
 * @param styles The styles to apply, later ones winning.
 */
export const getStyleXAttributesWith = <ClassAttribute, StyleAttribute, DataAttribute>(
  h: StyleXHtml<ClassAttribute, StyleAttribute, DataAttribute>,
  extraClasses: string,
  ...styles: ReadonlyArray<StyleXStyle>
): ReadonlyArray<ClassAttribute | StyleAttribute | DataAttribute> =>
  toAttributes(h, extraClasses, styles);

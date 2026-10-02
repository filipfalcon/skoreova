import * as stylex from '@stylexjs/stylex';

// Bridges StyleX's compiled props onto Foldkit's attribute builders (the
// kassandra pattern). Generic over the attribute type so the returned array
// carries the caller's real `html<Message>()` attribute type, not a
// structural stand-in.
//
// Foldkit keeps ONE class attribute per element (last wins), so an element
// cannot take StyleX styles through one h.Class and a global contract class
// (`screen`, `trend-row`, `ticker` — the motion layer that stays in
// styles.css) through another. `getStyleXAttributesWith` exists for exactly
// those elements: it merges the plain classes into the single Class
// attribute the compiled styles produce.

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

export const getStyleXAttributes = <ClassAttribute, StyleAttribute, DataAttribute>(
  h: StyleXHtml<ClassAttribute, StyleAttribute, DataAttribute>,
  ...styles: ReadonlyArray<StyleXStyle>
): ReadonlyArray<ClassAttribute | StyleAttribute | DataAttribute> => toAttributes(h, '', styles);

export const getStyleXAttributesWith = <ClassAttribute, StyleAttribute, DataAttribute>(
  h: StyleXHtml<ClassAttribute, StyleAttribute, DataAttribute>,
  extraClasses: string,
  ...styles: ReadonlyArray<StyleXStyle>
): ReadonlyArray<ClassAttribute | StyleAttribute | DataAttribute> =>
  toAttributes(h, extraClasses, styles);

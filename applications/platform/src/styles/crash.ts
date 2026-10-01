import * as stylex from '@stylexjs/stylex';

// The crash screen borrows the 404 anatomy (styles/not-found.ts); its one
// action is a button rather than a link, so it drops the button chrome the
// link never had.

export const styles = stylex.create({
  reload: {
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
});

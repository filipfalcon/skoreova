import { page } from 'vitest/browser';
import { Runtime } from 'foldkit';
import { beforeAll, expect, test } from 'vitest';

import { ChangedUrl, ClickedLink, Model, init, update, view } from './main';
import './styles.css';

// Guards the "cut-off knight" saga: the mascot in the why-care section must
// be fully painted. Two distinct failure modes are pinned down separately:
// an ancestor clipping her box (overflow), and actual content painting over
// her head (stacking). The content container legitimately sits at z-10 above
// her, but on phones her head band lies above the container's box entirely —
// so every hit-test there must land on the image itself.

const waitUntil = async (predicate: () => boolean, timeout = 3000): Promise<void> => {
  const start = performance.now();
  while (!predicate()) {
    if (performance.now() - start > timeout) throw new Error('waitUntil timed out');
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
};

// `.idle-float` is shared with the champion's crest — scope to the section.
const knight = (): HTMLImageElement => {
  const element = document.querySelector<HTMLImageElement>('#why-care .idle-float');
  if (!element) throw new Error('knight not rendered');
  return element;
};

beforeAll(async () => {
  // Hit tests are layout-sensitive — pin the viewport instead of inheriting
  // whatever a previously run file left on the shared page.
  await page.viewport(414, 896);
  const root = document.createElement('div');
  root.id = 'root';
  document.body.appendChild(root);

  Runtime.run(
    Runtime.makeApplication({
      Model,
      init,
      update,
      view,
      container: root,
      routing: {
        onUrlRequest: (request) => ClickedLink({ request }),
        onUrlChange: (url) => ChangedUrl({ url }),
      },
    }),
  );

  await waitUntil(() => document.querySelector('#why-care .idle-float') !== null);

  // Bring the section in with its top ~150px below the viewport top: clear of
  // the fixed header (z-50), and high enough that the reveal observer fires.
  const section = document.querySelector<HTMLElement>('#why-care');
  if (!section) throw new Error('why-care section not rendered');
  window.scrollTo({ top: section.offsetTop - 150, behavior: 'instant' });

  const wrapper = knight().closest<HTMLElement>('[data-reveal]');
  if (!wrapper) throw new Error('knight reveal wrapper missing');
  await waitUntil(() => wrapper.classList.contains('is-in'));
  // Let the reveal transition (0.1s delay + 0.9s) fully land.
  await new Promise((resolve) => setTimeout(resolve, 1400));

  const image = knight();
  console.log(
    `[knight] asset=${image.currentSrc} natural=${image.naturalWidth}x${image.naturalHeight}`,
  );
  console.log(`[knight] img rect=${JSON.stringify(image.getBoundingClientRect())}`);
  console.log(`[knight] section rect=${JSON.stringify(section.getBoundingClientRect())}`);
});

test('no ancestor clips the mascot box', () => {
  const image = knight();
  const rect = image.getBoundingClientRect();
  const clippers: Array<string> = [];

  for (
    let node = image.parentElement;
    node && node !== document.documentElement;
    node = node.parentElement
  ) {
    const style = getComputedStyle(node);
    const clipsX = style.overflowX !== 'visible';
    const clipsY = style.overflowY !== 'visible';
    if (!clipsX && !clipsY) continue;
    const box = node.getBoundingClientRect();
    const cut =
      (clipsY && (rect.top < box.top - 0.5 || rect.bottom > box.bottom + 0.5)) ||
      (clipsX && (rect.left < box.left - 0.5 || rect.right > box.right + 0.5));
    if (cut) clippers.push(`${node.tagName}.${node.className} [${style.overflow}]`);
  }

  expect(clippers).toEqual([]);
});

test('nothing paints over the mascot head band', async () => {
  const image = knight();
  const wrapper = image.closest<HTMLElement>('[data-reveal]');
  if (!wrapper) throw new Error('knight reveal wrapper missing');

  // The wrapper is pointer-events-none by design; hit-testing needs it on.
  // Its reveal TRANSITION is also frozen at the resting pose: WebKit's hit
  // test disagrees with getBoundingClientRect around animated transforms
  // (see the pose loop below), and under a cold-cache full-suite run the
  // slide-in can still be settling when sampling starts.
  wrapper.style.pointerEvents = 'auto';
  wrapper.style.transition = 'none';
  wrapper.style.transform = 'none';
  try {
    // The idle float matters here — near its peak the head rises past the
    // wrapper box, the exact spot the clip-path regression cut. The float
    // is switched OFF and poses are set as static inline transforms (a
    // running or even merely paused animation makes WebKit's hit test
    // disagree with getBoundingClientRect). Two deliberate distortions
    // make the guard load-proof:
    //
    // The sample bands MUST stay within the head band (top ~9% of the
    // image): on the phone viewport that is the only region guaranteed to
    // be pure mascot — deeper points legitimately sit under the z-10 copy
    // container. And sampling is only meaningful once the image has
    // actually LOADED and fonts have settled: on a cold-cache run the webp
    // is still streaming when the test starts, and the drifting layout
    // made rects and hit tests disagree.
    await waitUntil(() => image.complete && image.naturalWidth > 0, 10000);
    await document.fonts.ready;

    const sampleOffenders = async (): Promise<Array<string>> => {
      const offenders = new Set<string>();
      for (const pose of ['0px', '-4.8px', '-9.6px']) {
        image.style.animation = 'none';
        image.style.transform = `translateY(${pose})`;
        // Let the style land and a frame paint before hit-testing.
        await new Promise((resolve) => setTimeout(resolve, 100));
        const rect = image.getBoundingClientRect();
        for (const fx of [0.25, 0.45, 0.65]) {
          for (const fy of [0.03, 0.05, 0.08]) {
            const x = rect.left + rect.width * fx;
            const y = rect.top + rect.height * fy;
            if (y < 0 || x < 0) continue;
            const top = document.elementFromPoint(x, y);
            if (!top || top === image || wrapper.contains(top)) continue;
            offenders.add(
              `${top.tagName}.${(top as HTMLElement).className} at ${Math.round(x)},${Math.round(y)} (pose ${pose})`,
            );
          }
        }
      }
      return [...offenders];
    };

    // One retry: a REAL stacking regression reproduces on every pass, while
    // a transient blip under full-suite load (a neighboring file resizing
    // the shared page mid-sample) clears itself.
    let offenders = await sampleOffenders();
    if (offenders.length > 0) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      offenders = await sampleOffenders();
    }
    expect(offenders).toEqual([]);
  } finally {
    wrapper.style.pointerEvents = '';
    wrapper.style.transition = '';
    wrapper.style.transform = '';
    image.style.animation = '';
    image.style.transform = '';
  }
});

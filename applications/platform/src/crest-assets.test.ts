import { expect, test } from 'vite-plus/test';

// THE CREST ASSETS render bare on the hero — no disc behind them — so a crest
// drawn on an opaque white or light background would show as a pale square
// on ink. This walks every crest file and flags one whose edges are opaque
// and light; such a crest needs a transparent version from the data layer,
// not a ground drawn behind it.
//
// The files arrive as data URLs through the bundler rather than off the disk,
// so the test needs nothing of Node's and reads the same bytes the app ships.
const crests: Record<string, string> = import.meta.glob('./assets/clubs/*.{png,svg}', {
  query: '?inline',
  import: 'default',
  eager: true,
});

// How many samples run along each edge.
const EDGE_SAMPLES = 12;
// A pixel counts as background when it is this opaque and this light.
const OPAQUE_ALPHA = 250;
const LIGHT_CHANNEL = 225;

// A decoded PNG as its unfiltered scanlines: each row is its filter byte followed by `width * 4` RGBA bytes, so the pixel at (x, y) starts at `y * (width * 4 + 1) + 1 + x * 4`.
interface Pixels {
  readonly width: number;
  readonly height: number;
  readonly scanlines: Uint8Array;
}

const dataUrlBytes = (url: string): Uint8Array => {
  const match = url.match(/^data:([^,]*),(.*)$/s);
  if (match === null) throw new Error('not a data URL');
  const [, meta = '', payload = ''] = match;
  if (!meta.endsWith(';base64')) return new TextEncoder().encode(decodeURIComponent(payload));
  const binary = atob(payload);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
};

const inflate = async (bytes: Uint8Array<ArrayBuffer>): Promise<Uint8Array> => {
  const stream = new DecompressionStream('deflate');
  const writer = stream.writable.getWriter();
  void writer.write(bytes);
  void writer.close();
  const reader = stream.readable.getReader();
  const chunks: Array<Uint8Array> = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    total += value.length;
  }
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out;
};

// Reverses one scanline's PNG filter in place, against the scanline above it, which is already unfiltered (all zeros above the first). The filters are the five of the PNG specification, section 9.2, with a pixel of 4 bytes.
const unfilterRow = (filter: number, row: Uint8Array, above: Uint8Array): void => {
  if (filter === 1) {
    for (let x = 4; x < row.length; x += 1) {
      row[x] = ((row[x] ?? 0) + (row[x - 4] ?? 0)) & 0xff;
    }
  } else if (filter === 2) {
    for (let x = 0; x < row.length; x += 1) {
      row[x] = ((row[x] ?? 0) + (above[x] ?? 0)) & 0xff;
    }
  } else if (filter === 3) {
    for (let x = 0; x < row.length; x += 1) {
      const left = x >= 4 ? (row[x - 4] ?? 0) : 0;
      row[x] = ((row[x] ?? 0) + ((left + (above[x] ?? 0)) >> 1)) & 0xff;
    }
  } else if (filter === 4) {
    for (let x = 0; x < row.length; x += 1) {
      const left = x >= 4 ? (row[x - 4] ?? 0) : 0;
      const upper = above[x] ?? 0;
      const upperLeft = x >= 4 ? (above[x - 4] ?? 0) : 0;
      const toLeft = Math.abs(upper - upperLeft);
      const toUpper = Math.abs(left - upperLeft);
      const toUpperLeft = Math.abs(left + upper - 2 * upperLeft);
      const predictor =
        toLeft <= toUpper && toLeft <= toUpperLeft
          ? left
          : toUpper <= toUpperLeft
            ? upper
            : upperLeft;
      row[x] = ((row[x] ?? 0) + predictor) & 0xff;
    }
  }
};

// A minimal PNG reader for the one shape every crest is saved in: 8-bit RGBA,
// not interlaced. Anything else is refused loudly rather than misread.
const readPng = async (file: Uint8Array): Promise<Pixels> => {
  const view = new DataView(file.buffer, file.byteOffset, file.byteLength);
  let offset = 8;
  let width = 0;
  let height = 0;
  const idat: Array<Uint8Array> = [];
  while (offset < file.length) {
    const length = view.getUint32(offset);
    const type = String.fromCharCode(...file.subarray(offset + 4, offset + 8));
    const data = file.subarray(offset + 8, offset + 8 + length);
    if (type === 'IHDR') {
      width = view.getUint32(offset + 8);
      height = view.getUint32(offset + 12);
      const [depth, colorType, interlace] = [data[8], data[9], data[12]];
      if (depth !== 8 || colorType !== 6 || interlace !== 0) {
        throw new Error(`crest is not 8-bit RGBA: depth ${depth}, type ${colorType}`);
      }
    } else if (type === 'IDAT') {
      idat.push(data);
    }
    offset += 12 + length;
  }
  const joined = new Uint8Array(idat.reduce((sum, chunk) => sum + chunk.length, 0));
  idat.reduce((at, chunk) => {
    joined.set(chunk, at);
    return at + chunk.length;
  }, 0);
  const scanlines = await inflate(joined);
  const stride = width * 4 + 1;
  let above: Uint8Array = new Uint8Array(stride - 1);
  for (let y = 0; y < height; y += 1) {
    const row = scanlines.subarray(y * stride + 1, (y + 1) * stride);
    unfilterRow(scanlines[y * stride] ?? 0, row, above);
    above = row;
  }
  return { width, height, scanlines };
};

// The share of a crest's edge that is opaque and light — 1 for a crest drawn on a white card.
const lightEdgeShare = ({ width, height, scanlines }: Pixels): number => {
  const points: Array<readonly [number, number]> = [];
  for (let step = 0; step <= EDGE_SAMPLES; step += 1) {
    const x = Math.round(((width - 1) * step) / EDGE_SAMPLES);
    const y = Math.round(((height - 1) * step) / EDGE_SAMPLES);
    points.push([x, 0], [x, height - 1], [0, y], [width - 1, y]);
  }
  const light = points.filter(([x, y]) => {
    const index = y * (width * 4 + 1) + 1 + x * 4;
    const [r, g, b, a] = [
      scanlines[index],
      scanlines[index + 1],
      scanlines[index + 2],
      scanlines[index + 3],
    ];
    return (
      a !== undefined &&
      r !== undefined &&
      g !== undefined &&
      b !== undefined &&
      a >= OPAQUE_ALPHA &&
      Math.min(r, g, b) >= LIGHT_CHANNEL
    );
  });
  return light.length / points.length;
};

// An SVG crest is flagged when its first painted shape is a full-size light rectangle — the export idiom for a crest on a white card.
const svgHasLightCard = (svg: string): boolean => {
  const firstShape = svg.match(/<(rect|path|circle|polygon|ellipse)\b[^>]*>/);
  if (firstShape === null || firstShape[1] !== 'rect') return false;
  return /fill\s*[:=]\s*["']?\s*(#fff(?:fff)?|white|#f[0-9a-f]{5})\b/i.test(firstShape[0]);
};

test('no crest asset carries an opaque light background', async () => {
  const entries = Object.entries(crests);
  expect(entries.length).toBeGreaterThan(0);
  for (const [path, url] of entries) {
    const bytes = dataUrlBytes(url);
    if (path.endsWith('.svg')) {
      expect(svgHasLightCard(new TextDecoder().decode(bytes)), `${path} is on a light card`).toBe(
        false,
      );
    } else {
      expect(lightEdgeShare(await readPng(bytes)), `${path} is on a light card`).toBeLessThan(0.5);
    }
  }
});

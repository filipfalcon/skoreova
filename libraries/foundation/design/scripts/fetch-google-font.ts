// Refreshes a committed font from the Google Fonts CSS2 API, on demand: never at build or run time, where the committed files are the source of truth. Run with `node scripts/fetch-google-font.ts <family> [--dry-run]`.
import { writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// The families the design package self-hosts, by the name the command takes: the API's family query, and the prefix of the committed files.
const FAMILIES = {
  anton: { query: 'Anton', prefix: 'anton' },
  archivo: { query: 'Archivo:wdth,wght@62..125,100..900', prefix: 'archivo' },
} as const;

// The subsets the package commits.
const SUBSETS = ['latin', 'latin-ext'] as const;

// The API serves WOFF2 with unicode-range subsets only to a browser that declares itself modern.
const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';

const FONT_FOLDER = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'font');

const isFamily = (name: string): name is keyof typeof FAMILIES => Object.hasOwn(FAMILIES, name);

const main = async (): Promise<void> => {
  const [name = '', ...flags] = process.argv.slice(2);
  if (!isFamily(name)) {
    throw new Error(`Name a family: ${Object.keys(FAMILIES).join(' or ')}.`);
  }
  const isDryRun = flags.includes('--dry-run');
  const family = FAMILIES[name];
  const response = await fetch(
    `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family.query).replace(/%40/g, '@').replace(/%2C/g, ',').replace(/%3A/g, ':')}&display=swap`,
    { headers: { 'User-Agent': USER_AGENT } },
  );
  if (!response.ok) throw new Error(`The API answered ${response.status} for ${family.query}.`);
  const css = await response.text();
  for (const subset of SUBSETS) {
    // Each face follows a comment naming its subset.
    const face = new RegExp(`/\\* ${subset} \\*/\\s*@font-face \\{([^}]*)\\}`).exec(css)?.[1];
    const url = face && /url\((https:[^)]+\.woff2)\)/.exec(face)?.[1];
    const range = face && /unicode-range:\s*([^;]+);/.exec(face)?.[1];
    if (url === undefined || range === undefined) {
      throw new Error(`No ${subset} WOFF2 face for ${family.query}.`);
    }
    const version = /\/(v\d+)\//.exec(url)?.[1] ?? 'unknown';
    const file = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
    if (!file.ok) throw new Error(`${url} answered ${file.status}.`);
    const bytes = new Uint8Array(await file.arrayBuffer());
    const target = join(FONT_FOLDER, `${family.prefix}-${subset}.woff2`);
    if (!isDryRun) await writeFile(target, bytes);
    process.stdout.write(
      `${family.query} ${version} ${subset}: ${bytes.byteLength} bytes${isDryRun ? '' : ` → ${target}`}\n  unicode-range: ${range}\n`,
    );
  }
};

await main();

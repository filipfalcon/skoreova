// Every browser test renders in the page's own typeface. The page loads Archivo from entry.ts, which
// the tests do not run, so without this they would lay out in the browser's fallback sans, wider
// than Archivo's condensed display cut, and the header's give-way widths, measured from Archivo,
// would not hold.
import '@skoreova/design/font.css';

// The one variable file holds every cut; wait for it, so no test lays out before the swap.
await document.fonts.load("16px 'Archivo'");

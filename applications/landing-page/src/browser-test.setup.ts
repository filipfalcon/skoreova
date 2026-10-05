// Every browser test renders in the page's own typeface. The page loads Archivo from its stylesheet,
// which not every test imports, so without this they would lay out in the browser's fallback sans, wider
// than Archivo's condensed display cut, and the header's give-way widths, measured from Archivo,
// would not hold.
import '@skoreova/design/font.css';

import stylesheet from './styles.css?raw';

// The page declares its cascade-layer order in its stylesheet, linked first in the document's head, so StyleX's layer sits above Tailwind's. Here the StyleX plugin's rules reach the page before any test's stylesheet, and layer order is fixed by first declaration, so the page's own statement goes first.
const layerOrder = /^@layer [^{;]+;/m.exec(stylesheet)?.[0];
if (layerOrder === undefined) throw new Error('the stylesheet declares no layer order');
const layers = document.createElement('style');
layers.textContent = layerOrder;
document.head.prepend(layers);

// The one variable file holds every cut; wait for it, so no test lays out before the swap.
await document.fonts.load("16px 'Archivo'");

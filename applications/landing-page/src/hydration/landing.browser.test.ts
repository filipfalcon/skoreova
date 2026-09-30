import { test } from 'vite-plus/test';

import { expectHydrationAdopts } from './adopts';

test('the client adopts the server render of the landing page', async () => {
  await expectHydrationAdopts('/');
});

import { test } from 'vite-plus/test';

import { expectHydrationAdopts } from './adopts';

// The largest view in the app, and the one with the most markup the client could disagree with.
test('the client adopts the server render of a club profile', async () => {
  await expectHydrationAdopts('/clubs/sparta-praha');
});

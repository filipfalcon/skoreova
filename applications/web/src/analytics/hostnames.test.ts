import { expect, test } from 'vite-plus/test';

import deploySource from '../../../../alchemy.run.ts?raw';
import { PRODUCTION_HOSTNAMES } from './config';

// WHAT THIS REPLACES. The hostname list used to carry a comment asking the next
// person to keep it in step with the deploy, because the two live in different
// files and drift between them is silent: measurement and Sentry both go quiet
// on a domain that is serving traffic, and nothing else looks wrong. A comment
// cannot fail. This can.

// The beta.66 website options renamed the domain shape from a flat array to
// `domain: { name, aliases }` — the capture spans the whole object, and the
// quoted-string sweep below collects the name and every alias alike.
const WEB_DOMAINS = /rootDir: 'applications\/web',[\s\S]*?domain: \{([^}]*)\}/;

const deployedHostnames = (): ReadonlyArray<string> => {
  const match = WEB_DOMAINS.exec(deploySource);
  if (match?.[1] === undefined) {
    throw new Error('No domain list found for the web app in alchemy.run.ts.');
  }
  return [...match[1].matchAll(/'([^']+)'/g)].map((quoted) => quoted[1] ?? '');
};

test('measurement runs on exactly the hostnames the web app deploys to', () => {
  expect([...PRODUCTION_HOSTNAMES].sort()).toEqual([...deployedHostnames()].sort());
});

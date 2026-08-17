// The one place a route becomes a page title. The view titles the tab after
// the runtime boots; the Worker writes the same string into the served HTML,
// which is what a crawler reads before it ever executes the app.

import type { AppRoute } from './route';

export const SITE_ORIGIN = 'https://skoreova.com';

// An unknown path renders the landing page, so it is titled as one.
export const documentTitle = (route: AppRoute): string =>
  route._tag === 'PolicyRoute'
    ? 'Cookies & Privacy — Skóreová'
    : 'Skóreová — Czech Women’s Football Coverage';

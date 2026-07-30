/**
 * The measurement stream everything here reports into.
 */
export const MEASUREMENT_ID = 'G-PJ131P52RX';

/**
 * The hostnames that record anything at all.
 *
 * `.com` is canonical and `.cz` the alias; both are live deploys. Everywhere else — localhost, LAN
 * testing, preview deploys, tunnels — stays silent, so development traffic never reaches the data.
 */
export const PRODUCTION_HOSTNAMES: ReadonlyArray<string> = [
  'beta.skoreova.com',
  'beta.skoreova.cz',
];

/**
 * Where the visitor's choice is kept between visits.
 */
export const CONSENT_STORAGE_KEY = 'skoreova-consent';

/**
 * The only two values that choice ever holds.
 *
 * Narrower than `string` deliberately: the same value is handed to the tag as `analytics_storage`,
 * which its types accept only as `granted` or `denied`, so a third choice fails to compile rather
 * than being dropped without complaint at run time.
 */
export type ConsentChoice = 'granted' | 'denied';

/**
 * Whether this page is one of the silent ones.
 */
export const isMeasurementOff = (): boolean =>
  !PRODUCTION_HOSTNAMES.includes(window.location.hostname);

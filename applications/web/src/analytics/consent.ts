import { Effect, Option } from 'effect';

import { CONSENT_STORAGE_KEY, type ConsentChoice } from './config';
import { setAnalyticsStorageConsent } from './gtag';

const isChoice = (value: string): value is ConsentChoice =>
  value === 'granted' || value === 'denied';

/**
 * The choice this visitor made on an earlier visit, if it survived.
 *
 * Reports None rather than failing when storage is unreachable: blocked cookies make the read throw
 * outright, and a visitor who cannot be remembered is not the same as one who refused.
 */
export const readChoice: Effect.Effect<Option.Option<ConsentChoice>> = Effect.try({
  try: () => localStorage.getItem(CONSENT_STORAGE_KEY),
  catch: () => new Error('storage unreachable'),
}).pipe(
  Effect.map(Option.fromNullOr),
  Effect.map(Option.filter(isChoice)),
  Effect.orElseSucceed(() => Option.none<ConsentChoice>()),
);

/**
 * Remembers a choice for the next visit, if storage will take it.
 *
 * Best effort by design — the choice is honored for this session either way, and only its
 * persistence is at risk.
 *
 * @param choice - What the visitor decided.
 */
export const writeChoice = (choice: ConsentChoice): Effect.Effect<void> =>
  Effect.try({
    try: () => localStorage.setItem(CONSENT_STORAGE_KEY, choice),
    catch: () => new Error('storage unreachable'),
  }).pipe(Effect.ignore);

/**
 * Drops the remembered choice, returning the visitor to undecided.
 */
export const forgetChoice: Effect.Effect<void> = Effect.try({
  try: () => localStorage.removeItem(CONSENT_STORAGE_KEY),
  catch: () => new Error('storage unreachable'),
}).pipe(Effect.ignore);

/**
 * Tells every tag about a choice — the one place a new integration is wired in, so nothing upstream
 * has to learn which vendors exist.
 *
 * @param choice - What the visitor decided.
 */
export const applyChoice = (choice: ConsentChoice): Effect.Effect<void> =>
  setAnalyticsStorageConsent(choice);

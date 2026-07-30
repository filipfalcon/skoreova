import { Effect, Option } from 'effect';

import { isMeasurementOff, MEASUREMENT_ID, type ConsentChoice } from './config';

declare global {
  interface Window {
    /**
     * The queue every command is pushed onto. Arrays take the consumer's legacy branch and get
     * dropped; only the raw `arguments` object reaches the command table, and `callee` is the
     * single property enforcing that.
     */
    dataLayer?: IArguments[];
  }
}

/**
 * Reifies a call as the object the queue's consumer accepts.
 *
 * @param values - A command name followed by that command's arguments.
 */
const pack: (...values: ReadonlyArray<unknown>) => IArguments = function () {
  return arguments;
};

/**
 * Pushes each call onto the queue verbatim.
 *
 * @param name - The command the consumer dispatches on.
 * @param args - The arguments that command takes.
 */
const emit = <Name extends keyof Gtag.GtagCommands>(
  name: Name,
  ...args: Gtag.GtagCommands[Name]
): Effect.Effect<void> =>
  Effect.sync(() => {
    (window.dataLayer ??= []).push(pack(name, ...args));
  });

/**
 * Tells the tag whether it may use storage for measurement.
 *
 * @param choice - What the visitor decided.
 */
export const setAnalyticsStorageConsent = (choice: ConsentChoice): Effect.Effect<void> =>
  emit('consent', 'update', { analytics_storage: choice });

const loadTag: Effect.Effect<void> = Effect.sync(() => {
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
  document.head.appendChild(script);
});

/**
 * Registers the consent defaults and starts the tag under them.
 *
 * The order of what follows is the contract: every signal is denied before the consumer is fetched,
 * so no hit can be sent under a consent state nobody declared.
 *
 * @param stored - A choice from an earlier visit, replayed before the first hit.
 */
export const startGtag = (stored: Option.Option<ConsentChoice>): Effect.Effect<void> =>
  Effect.gen(function* () {
    // Keeps non-production traffic out of the data, silenced before the first tag fires — the consumer still loads, it just sends nothing.
    if (isMeasurementOff()) {
      Reflect.set(window, `ga-disable-${MEASUREMENT_ID}`, true);
    }

    // Every signal starts denied until a choice exists, in compliance with consent regulations.
    // functionality_storage and security_storage stay absent: they gate the consumer's own exempt storage, and refusing security storage weakens fraud protection for nothing.
    yield* emit('consent', 'default', {
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      analytics_storage: 'denied',
      personalization_storage: 'denied',
    });

    // The denial above stops the storing; this scrubs what still goes out. Only takes effect while that denial holds.
    yield* emit('set', 'ads_data_redaction', true);

    // A returning visitor's grant is replayed before any hit fires.
    if (Option.contains(stored, 'granted')) {
      yield* setAnalyticsStorageConsent('granted');
    }

    yield* emit('js', new Date());
    yield* emit('config', MEASUREMENT_ID);
    yield* loadTag;
  });

import { Toast } from '@foldkit/ui';
import { Schema } from 'effect';

// THE PLATFORM'S TOAST STACK — one bound Toast Submodel for every passing
// confirmation the app makes (a follow, an unfollow). The payload is the
// sentence and nothing else: the entry's tone, place and timing are the
// stack's, so no caller can invent a toast that looks different.

/**
 * What a toast carries: one line of paper text.
 */
export const ToastPayload = Schema.Struct({ text: Schema.String });

/**
 * The bound Toast module — its Model lives in the app Model, its Messages arrive wrapped, and its
 * headless view is drawn in the shell.
 */
export const AppToast = Toast.make(ToastPayload);

/**
 * The stack's DOM id, which is also the prefix of every entry's id.
 */
export const TOAST_ID = 'toasts';

/**
 * How long a toast stays: long enough to read one line, short enough never to need dismissing.
 */
export const TOAST_DURATION = '3 seconds';

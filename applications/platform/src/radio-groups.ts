import { RadioGroup } from '@foldkit/ui';

import type { ScorerScope } from './model';

// The platform's two radio groups, created once at module scope so the view
// and the update fold share one Value-typed pair. Creating one per render
// would hand `toView` a `string` where the union belongs, and the fold a
// `Selected` OutMessage it would have to cast.
//
// The ids are the Submodel's identity in the DOM, so they live beside the
// bundles rather than at the call sites that would otherwise each restate
// them — `init` and the slot both need to agree.

/**
 * The DOM id of the club profile's top-scorers scope picker.
 */
export const SCOPE_GROUP_ID = 'club-top-scorers-scope';

/**
 * The DOM id of the competition profile's edition picker.
 */
export const EDITION_GROUP_ID = 'competition-edition';

/**
 * The top-scorers scope picker, typed to the scopes a club profile offers.
 */
export const ScopeRadioGroup = RadioGroup.create<ScorerScope>();

/**
 * The edition picker. Its options are season labels read off the competition, so the value stays an
 * open string rather than a union.
 */
export const EditionRadioGroup = RadioGroup.create<string>();

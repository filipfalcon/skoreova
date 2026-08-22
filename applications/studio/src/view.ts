// The studio view: dispatches to the sign-in screen or, once signed in, the
// dashboard (the section list and the record drawer). Each view lives in its
// own module under ./page (reached through that directory’s barrel); the
// shared class-string constants live in styles.ts.

import type { Document, HtmlBuilder } from 'foldkit/html';

import type { Model } from './model';
import { SectionList, SignIn } from './page';

import type { Message } from './message';

export const view = (model: Model, h: HtmlBuilder<Message>): Document => ({
  ...(model.session._tag === 'SignedIn' ? SectionList.view(model, h) : SignIn.view(model, h)),
  // American English, the language every string in this app is written in; the runtime writes it after the first render, so what a crawler reads is whatever the served document already carried.
  lang: 'en-US',
});

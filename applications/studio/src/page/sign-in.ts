import { Input } from '@foldkit/ui';
import { html } from 'foldkit/html';
import type { Document } from 'foldkit/html';

import loginBackground from '../assets/login-background.jpg';
import { ClickedSignIn, UpdatedEmail, UpdatedPassword } from '../message';
import type { Message } from '../message';
import type { Model } from '../model';
import { cardStyle, chipStyle, forgotStyle, inputStyle, submitStyle } from '../styles';

const h = html<Message>();

export const loginView = (model: Model): Document => {
  return {
    title: 'Skóreová Studio — Sign in',
    body: h.div(
      [h.Class('relative min-h-screen overflow-hidden')],
      [
        h.img([
          h.Src(loginBackground),
          h.Alt(''),
          h.Class('absolute inset-0 h-full w-full object-cover object-top'),
        ]),
        h.main(
          [
            h.Class(
              'relative flex min-h-screen items-center justify-center p-6 md:justify-start md:pl-[8%]',
            ),
          ],
          [
            h.div(
              [h.Class(cardStyle)],
              [
                h.div(
                  [h.Class('flex items-center justify-between')],
                  [
                    h.span([h.Class('text-lg font-semibold text-white')], ['Skóreová']),
                    h.span([h.Class(chipStyle)], ['Studio']),
                  ],
                ),
                h.h1([h.Class('mt-8 text-3xl font-medium text-white')], ['Sign in']),
                h.div(
                  [h.Class('mt-6 flex flex-col gap-3')],
                  [
                    // The fields carry only a placeholder visually; the real
                    // <label> is sr-only so each is a properly labeled form
                    // control without changing the card's look.
                    Input.view({
                      id: 'signin-email',
                      type: 'email',
                      placeholder: 'email address',
                      value: model.email,
                      onInput: (value) => UpdatedEmail({ value }),
                      toView: (attributes) =>
                        h.div(
                          [],
                          [
                            h.label([...attributes.label, h.Class('sr-only')], ['Email address']),
                            h.input([
                              ...attributes.input,
                              h.Name('email'),
                              h.Autocomplete('email'),
                              h.Class(inputStyle),
                            ]),
                          ],
                        ),
                    }),
                    Input.view({
                      id: 'signin-password',
                      type: 'password',
                      placeholder: 'password',
                      value: model.password,
                      onInput: (value) => UpdatedPassword({ value }),
                      toView: (attributes) =>
                        h.div(
                          [],
                          [
                            h.label([...attributes.label, h.Class('sr-only')], ['Password']),
                            h.input([
                              ...attributes.input,
                              h.Name('password'),
                              h.Autocomplete('current-password'),
                              h.Class(inputStyle),
                            ]),
                          ],
                        ),
                    }),
                  ],
                ),
                h.a([h.Href('#'), h.Class(forgotStyle)], ['Forgot password?']),
                h.div(
                  [h.Class('mt-8 flex items-end justify-between gap-4')],
                  [
                    h.p(
                      [h.Class('max-w-52 text-xs leading-relaxed text-white/80')],
                      [
                        'The Skóreová editorial workspace. Access is limited to members of the editorial team.',
                      ],
                    ),
                    h.button([h.OnClick(ClickedSignIn()), h.Class(submitStyle)], ['→']),
                  ],
                ),
              ],
            ),
          ],
        ),
      ],
    ),
  };
};

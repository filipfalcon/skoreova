// HTTP semantics every response of this app's Worker shares. The app serves
// read-only resources, so it answers GET and HEAD, describes itself on
// OPTIONS, and refuses everything else (RFC 9110 §9.3.7, §15.5.6).

/**
 * The methods every resource of this app supports, as an `Allow` header value.
 */
export const ALLOWED_METHODS = 'GET, HEAD, OPTIONS';

/**
 * Headers every response carries. `nosniff` holds the browser to the declared `Content-Type`, so a
 * response is never reinterpreted as script or a stylesheet.
 */
export const BASE_HEADERS: Readonly<Record<string, string>> = {
  'x-content-type-options': 'nosniff',
};

/**
 * The answer to a request whose method is not a read: 204 with `Allow` for OPTIONS, which carries
 * no CORS headers because no resource is shared cross-origin, and 405 with `Allow` for any other
 * method. `undefined` for GET and HEAD, which the resource answers itself.
 *
 * @param method The request method.
 */
export const answerNonReadMethod = (method: string): Response | undefined => {
  if (method === 'GET' || method === 'HEAD') {
    return undefined;
  }
  return new Response(null, {
    status: method === 'OPTIONS' ? 204 : 405,
    headers: { ...BASE_HEADERS, allow: ALLOWED_METHODS },
  });
};

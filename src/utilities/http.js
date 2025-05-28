/**
 * @enum {string}
 */
export const RequestMethod = {
  GET: 'get',
  POST: 'post',
};

/**
 * @enum {string}
 */
export const ResponseStatus = {
  OK: 200,
};

/**
 * Add query parameters to a given URL.
 *
 * @param {string|URL} url
 * @param {string|string[][]|{[key: string]: string}|FormData|URLSearchParams} params
 * @returns {URL}
 */
export function addSearchParams(url, params) {
  url = new URL(url, location.origin);
  params = new URLSearchParams(params);

  for (const [key, value] of params) {
    url.searchParams.set(key, value);
  }

  return url;
}


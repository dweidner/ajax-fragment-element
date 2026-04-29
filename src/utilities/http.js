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

  const valuesByKey = new Map();

  for (const [key, value] of params) {
    const values = valuesByKey.get(key) || [];

    values.push(value);
    valuesByKey.set(key, values);
  }

  for (const [key, values] of valuesByKey) {
    url.searchParams.delete(key);

    for (const value of values) {
      url.searchParams.append(key, value);
    }
  }

  return url;
}


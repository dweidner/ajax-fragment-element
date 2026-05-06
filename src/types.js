/**
 * @typedef {'init'|'navigate'|'submit'|'restore'} FragmentMutationType
 */

/**
 * @typedef {object} FragmentMutation
 * @property {FragmentMutationType} type
 * @property {string} url
 * @property {string} [method]
 * @property {URLSearchParams} [data]
 */

/**
 * @callback MorphStrategy
 * @param {Element} currentFragment
 * @param {Element} targetFragment
 * @returns {Promise<void>}
 */

/**
 * @typedef {string|string[][]|{[key: string]: string}|FormData|URLSearchParams} RequestData
 */

/**
 * @typedef {object} TrustedTypesPolicy
 * @property {function(string): string} createHTML
 */

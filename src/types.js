/**
 * @typedef {'init'|'navigate'|'submit'|'restore'} MutationType
 */

/**
 * @typedef {'get'|'post'} RequestMethod
 */

/**
 * @typedef {string|string[][]|{[key: string]: string}|FormData|URLSearchParams} RequestData
 */

/**
 * @typedef {object} Mutation
 * @property {MutationType} type
 * @property {string} url
 * @property {RequestMethod} [method]
 * @property {RequestData} [data]
 */

/**
 * @callback MorphStrategy
 * @param {Element} currentFragment
 * @param {Element} targetFragment
 * @returns {Promise<void>}
 */

/**
 * @typedef {object} TrustedTypesPolicy
 * @property {function(string): string} createHTML
 */

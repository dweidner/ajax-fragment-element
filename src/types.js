/**
 * @typedef {'init'|'navigate'|'submit'|'restore'|string} MutationType
 */

/**
 * @typedef {'get'|'post'|string} RequestMethod
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
 * @param {HTMLElement} currentFragment
 * @param {HTMLElement} targetFragment
 * @returns {Promise<void>}
 */

/**
 * @typedef {object} TrustedTypesPolicy
 * @property {function(string): string} createHTML
 */

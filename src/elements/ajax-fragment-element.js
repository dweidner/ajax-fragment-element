import {
  setFormState,
  startTransition,
} from '../utilities/dom.js';

import {
  addSearchParams,
} from '../utilities/http.js';

import {
  nextMacroTask,
} from '../utilities/queue.js';

/**
 * @typedef {import('../types.js').Mutation} Mutation
 * @typedef {import('../types.js').MorphStrategy} MorphStrategy
 * @typedef {import('../types.js').RequestMethod} RequestMethod
 * @typedef {import('../types.js').RequestData} RequestData
 * @typedef {import('../types.js').TrustedTypesPolicy} TrustedTypesPolicy
 */

/**
 * @customElement ajax-fragment
 * @fires ajax-fragment:loadstart
 * @fires ajax-fragment:load
 * @fires ajax-fragment:loadend
 * @fires ajax-fragment:updatestart
 * @fires ajax-fragment:update
 * @fires ajax-fragment:updateend
 * @fires ajax-fragment:error
 */
export class AjaxFragmentElement extends HTMLElement {

  /**
   * @returns {?TrustedTypesPolicy}
   */
  static getTrustedTypesPolicy() {
    return this.#cspTrustedTypesPolicy;
  }

  /**
   * @param {?TrustedTypesPolicy} policy
   */
  static useTrustedTypesPolicy(policy) {
    this.#cspTrustedTypesPolicy = policy;
  }

  /**
   * @returns {MorphStrategy}
   */
  static getMorphStrategy() {
    return this.#morphStrategy || function (currentFragment, targetFragment) {
      const updateTitle = () => {
        document.title = targetFragment.ownerDocument.title;
      };

      const updateContent = () => {
        currentFragment.replaceChildren(...targetFragment.children);
      };

      const redirectFocus = () => {
        const focusTarget = /** @type {HTMLElement} */ (
          currentFragment.querySelector('[autofocus]') || currentFragment
        );

        const {top} = focusTarget.getBoundingClientRect();

        if (top < 0) {
          focusTarget.scrollIntoView();
        }

        focusTarget.focus({ preventScroll: true });
      };

      const morph = () => {
        const {activeElement} = document;

        updateTitle();
        updateContent();

        if (! document.contains(activeElement)) {
          redirectFocus();
        }
      };

      return startTransition(() => morph());
    };
  }

  /**
   * @param {MorphStrategy} fn
   */
  static useMorphStrategy(fn) {
    this.#morphStrategy = fn;
  }

  /**
   * @param {string} [tag]
   * @param {CustomElementRegistry} [registry]
   * @returns {typeof AjaxFragmentElement}
   */
  static define(tag = 'ajax-fragment', registry = customElements) {
    registry.define(tag, this);
    return this;
  }

  /**
   * @attribute
   * @returns {boolean}
   */
  get loading() {
    return this.hasAttribute('loading');
  }

  /**
   * @param {?boolean} value
   */
  set loading(value) {
    this.toggleAttribute('loading', value);
    this.targetElement?.toggleAttribute('loading', value);
    this.progressElement?.toggleAttribute('hidden', !value);
  }

  /**
   * @attribute
   * @returns {?string}
   */
  get target() {
    return this.getAttribute('target') || this.id;
  }

  /**
   * @param {?string} value
   */
  set target(value) {
    if (value) {
      this.setAttribute('target', value);
    } else {
      this.removeAttribute('target');
    }
  }

  /**
   * @returns {?HTMLElement}
   */
  get targetElement() {
    return document.getElementById(this.target);
  }

  /**
   * @returns {?HTMLProgressElement}
   */
  get progressElement() {
    const {target} = this;

    if (! target) {
      return null;
    }

    return /** @type {?HTMLProgressElement} */ (
      document.querySelector(`[data-ajax-progress~="${target}"]`)
    );
  }

  /**
   * @returns {?HTMLElement}
   */
  get statusElement() {
    const {target} = this;

    if (! target) {
      return null;
    }

    return document.querySelector(`[data-ajax-status~="${target}"]`);
  }

  /**
   * @returns {?HTMLElement}
   */
  get errorElement() {
    const {target} = this;

    if (! target) {
      return null;
    }

    return document.querySelector(`[data-ajax-error~="${target}"]`);
  }

  /**
   * @type {TrustedTypesPolicy|null}
   */
  static #cspTrustedTypesPolicy = null;

  /**
   * @type {MorphStrategy|null}
   */
  static #morphStrategy = null;

  /**
   * @returns {void}
   */
  connectedCallback() {
    window.addEventListener('popstate', this);

    document.addEventListener('submit', this);
    document.addEventListener('click', this);

    this.#commit({
      type: 'init',
      url: location.origin + location.pathname,
      data: new URLSearchParams(location.search),
    });
  }

  /**
   * @returns {void}
   */
  disconnectedCallback() {
    window.removeEventListener('popstate', this);

    document.removeEventListener('click', this);
    document.removeEventListener('submit', this);
  }

  /**
   * @param {string} url
   * @param {RequestMethod} [method]
   * @param {RequestData} [data]
   * @returns {Promise<void>}
   */
  async load(url, method = 'get', data = {}) {
    try {
      if (this.loading) {
        return;
      }

      this.loading = true;

      this.#setStatus('loading', 'Loading content…');
      this.#clearError();

      await nextMacroTask();
      this.#fire(['updatestart']);

      const targetDocument = await this.#fetch(this.#request(url, method, data));
      await this.#morphFragment(targetDocument);

      await nextMacroTask();
      this.#fire(['update', 'updateend']);
      this.#setStatus('success', 'Content loaded.');
    } catch (error) {
      await nextMacroTask();
      this.#fire(['error', 'updateend'], {detail: { error }});
      this.#setError('error', 'Failed to load content.');
      this.#clearStatus();
    } finally {
      this.loading = false;
    }
  }

  /**
   * @param {Event} event
   */
  handleEvent(event) {
    const {type} = event;

    if (type === 'click') {
      this.#handleClick(/** @type {MouseEvent} */ (event));
    } else if (type === 'submit') {
      this.#handleSubmit(/** @type {SubmitEvent} */ (event));
    } else if (type === 'popstate') {
      this.#handlePopState(/** @type {PopStateEvent} */ (event));
    }
  }

  /**
   * @param {?Node} node
   * @returns {boolean}
   */
  #isInScope(node) {
    return this.contains(node) || !! this.targetElement?.contains(node);
  }

  /**
   * @param {string|string[]} eventTypes
   * @param {object} [options]
   * @returns {void}
   */
  #fire(eventTypes, options = {}) {
    const types = Array.isArray(eventTypes) ? eventTypes : [eventTypes];

    for (const eventType of types) {
      this.dispatchEvent(new CustomEvent(`${this.localName}:${eventType}`, options));
    }
  }

  /**
   * @param {string} url
   * @param {RequestMethod} [method]
   * @param {RequestData} [data]
   * @returns {Request}
   */
  #request(url, method = 'get', data = {}) {
    if (method === 'post') {
      return new Request(url, {
        method: 'post',
        headers: {
          'Accept': 'text/html',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(data),
      });
    } else {
      return new Request(String(addSearchParams(url, data)), {
        method: 'get',
        headers: {
          'Accept': 'text/html',
        },
      });
    }
  }

  /**
   * @param {Request} request
   * @returns {Promise<Document>}
   */
  async #fetch(request) {
    try {
      await nextMacroTask();
      this.#fire(['loadstart']);

      const response = await fetch(request);

      if (response.status !== 200) {
        throw new Error(`Failed to load document: the server responded with a status of ${response.status}`);
      }

      const contentType = response.headers.get('Content-Type');

      if (! contentType?.includes('text/html')) {
        throw new Error(`Failed to load document: expected text/html but was ${contentType}`);
      }

      const responseText = await response.text();

      await nextMacroTask();
      this.#fire(['load', 'loadend']);

      return this.#parseHTML(responseText);
    } catch (error) {
      await nextMacroTask();
      this.#fire(['error', 'loadend'], {detail: { error }});

      throw error;
    }
  }

  /**
   * @param {Mutation} mutation
   * @returns {Promise<void>}
   */
  async #commit(mutation) {
    const {
      type,
      url,
      method = 'get',
      data = new URLSearchParams(),
    } = mutation;

    if (this.loading) {
      return;
    }

    const shouldSave = ['init', 'navigate', 'submit'].includes(type);

    if (shouldSave) {
      this.#saveState(String(addSearchParams(url, data)), type === 'init');
    }

    const shouldSync = ['init', 'navigate', 'submit', 'restore'].includes(type);

    if (shouldSync) {
      this.#syncForms(data);
    }

    const shouldLoad = ['navigate', 'submit', 'restore'].includes(type);

    if (shouldLoad) {
      await this.load(url, method, data);
    }
  }

  /**
   * @param {?HTMLElement} element
   * @param {string} key
   * @param {string} fallback
   */
  #updateLiveRegion(element, key, fallback) {
    if (element) {
      element.textContent = element.getAttribute(`data-message-${key}`) || fallback;
    }
  }

  /**
   * @param {?HTMLElement} element
   */
  #clearLiveRegion(element) {
    if (element) {
      element.textContent = '';
    }
  }

  /**
   * @param {string} key
   * @param {string} fallback
   */
  #setStatus(key, fallback) {
    this.#updateLiveRegion(this.statusElement, key, fallback);
  }

  /**
   * @returns {void}
   */
  #clearStatus() {
    this.#clearLiveRegion(this.statusElement);
  }

  /**
   * @param {string} key
   * @param {string} fallback
   */
  #setError(key, fallback) {
    this.#updateLiveRegion(this.errorElement, key, fallback);
  }

  /**
   * @returns {void}
   */
  #clearError() {
    this.#clearLiveRegion(this.errorElement);
  }

  /**
   * @param {string} url
   * @param {boolean} [replace]
   * @returns {void}
   */
  #saveState(url, replace = false) {
    const state = history.state || {};

    if (! state.fragments) {
      state.fragments = {};
    }

    state.fragments[this.id] = url;

    if (replace) {
      history.replaceState(state, '', url);
    } else {
      history.pushState(state, '', url);
    }
  }

  /**
   * @param {URLSearchParams} data
   * @returns {void}
   */
  #syncForms(data) {
    for (const form of /** @type {NodeListOf<HTMLFormElement>} */ (
      this.querySelectorAll('form[data-use-ajax]')
    )) {
      setFormState(form, data);
    }
  }

  /**
   * @param {string} responseText
   * @returns {Document}
   */
  #parseHTML(responseText) {
    const trustedTypesPolicy = AjaxFragmentElement.getTrustedTypesPolicy();

    if (trustedTypesPolicy) {
      responseText = trustedTypesPolicy.createHTML(responseText);
    }

    return (new DOMParser()).parseFromString(responseText, 'text/html');
  }

  /**
   * @param {Document} targetDocument
   * @returns {Promise<void>}
   */
  async #morphFragment(targetDocument) {
    const morphStrategy = AjaxFragmentElement.getMorphStrategy();

    const currentFragment = document.getElementById(this.target);

    if (! currentFragment) {
      throw new Error(`Element not found: an element with the id ${this.target} does not exist in the source document`);
    }

    const targetFragment = targetDocument.getElementById(this.target);

    if (! targetFragment) {
      throw new Error(`Element not found: an element with the id ${this.target} does not exist in the target document`);
    }

    return morphStrategy(currentFragment, targetFragment);
  }

  /**
   * @param {MouseEvent} event
   */
  #handleClick(event) {
    const anchor = /** @type {?HTMLAnchorElement} */ (
      event.target.closest('a[data-use-ajax]')
    );

    if (! this.#isInScope(anchor)) {
      return;
    }

    event.preventDefault();

    const {
      origin,
      pathname,
      search,
      hash,
    } = new URL(anchor.href);

    this.#commit({
      type: 'navigate',
      url: origin + pathname + hash,
      data: new URLSearchParams(search),
    });
  }

  /**
   * @param {SubmitEvent} event
   */
  #handleSubmit(event) {
    const form = /** @type {?HTMLFormElement} */ (
      event.target.closest('form[data-use-ajax]')
    );

    if (! this.#isInScope(form)) {
      return;
    }

    event.preventDefault();

    this.#commit({
      type: 'submit',
      url: form.action,
      method: form.method,
      data: new URLSearchParams(new FormData(form)),
    });
  }

  /**
   * @param {PopStateEvent} event
   */
  #handlePopState(event) {
    const href = /** @type {?string} */ (
      event.state?.fragments?.[this.id]
    );

    if (! href) {
      return;
    }

    const {
      origin,
      pathname,
      search,
      hash,
    } = new URL(href);

    this.#commit({
      type: 'restore',
      url: origin + pathname + hash,
      data: new URLSearchParams(search),
    });
  }

}

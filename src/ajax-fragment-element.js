import {
  setFormState,
} from './utilities/dom.js';

import {
  addSearchParams,
  RequestMethod,
  ResponseStatus,
} from './utilities/http.js';

import {
  nextMacroTask,
} from './utilities/queue.js';

/**
 * @type {HTMLTemplateElement}
 */
const template = document.createElement('template');

template.innerHTML = /*html*/`
  <style>
    :host {
      display: block;
    }

    .visually-hidden {
      position: absolute;
      top: 0px;
      left: 0px;
      display: block;
      width: 4px;
      height: 4px;
      padding: 0;
      border: none;
      margin: 0;
      opacity: 0;
      overflow: hidden;
      visibility: visible;
      pointer-events: none;
    }
  </style>
  <div role="status" class="visually-hidden"></div>
  <slot></slot>
`;

/**
 * @typedef {string|string[][]|{[key: string]: string}|FormData|URLSearchParams} RequestData
 */
export class AjaxFragmentElement extends HTMLElement {

  /**
   * @type {boolean}
   */
  #busy = false;

  /**
   * @returns {?AjaxFragmentElement}
   */
  get targetElement() {
    return document.getElementById(this.target);
  }

  /**
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

  constructor() {
    super();

    const shadowRoot = this.attachShadow({ mode: 'open' });
    shadowRoot.appendChild(template.content.cloneNode(true));
  }

  /**
   * @returns {void}
   */
  connectedCallback() {
    window.addEventListener('popstate', this);

    this.addEventListener('submit', this);
    this.addEventListener('click', this);

    this.#recordState(location.href, {data: location.search}, true);
  }

  /**
   * @returns {void}
   */
  disconnectedCallback() {
    window.removeEventListener('popstate', this);

    this.removeEventListener('submit', this);
    this.removeEventListener('click', this);
  }

  /**
   * @param {string} url
   * @param {string} [method]
   * @param {RequestData} [data]
   * @returns {Request}
   */
  request(url, method = RequestMethod.GET, data = {}) {
    const headers = {
      'Accept': 'text/html',
      'Content-Type': 'application/x-www-form-urlencoded',
    };

    if (method === RequestMethod.POST) {
      return new Request(url, {
        method,
        headers,
        body: new URLSearchParams(data),
      });
    } else {
      return new Request(addSearchParams(url, data), {
        method,
        headers,
      });
    }
  }

  /**
   * @param {Request} request
   * @returns {Promise<Document>}
   */
  async fetch(request) {
    try {
      await nextMacroTask();
      await this.#fire(['loadstart'], {detail: {request}});

      const response = await fetch(request);

      if (response.status !== ResponseStatus.OK) {
        throw new Error(`Failed to load document: the server responded with a status of ${response.status}`);
      }

      const contentType = response.headers.get('Content-Type');

      if (! contentType?.includes('text/html')) {
        throw new Error(`Failed to load document: expected text/html but was ${contentType}`);
      }

      const responseText = await response.text();

      await nextMacroTask();
      this.#fire(['load', 'loaded'], {detail: {request, response}});

      return (new DOMParser()).parseFromString(responseText, 'text/html');
    } catch (error) {
      await nextMacroTask();
      this.#fire(['error', 'loadend'], {detail: {request, error}});

      throw error;
    }
  }

  /**
   * @param {string} url
   * @param {string} [method]
   * @param {RequestData} [data]
   * @returns {Promise<void>}
   */
  async load(url, method = RequestMethod.GET, data = {}) {
    if (this.#isBusy()) {
      return;
    }

    this.#markAsBusy();
    this.#announce('loading', 'Loading fragment …');

    try {
      const currentFragment = document.getElementById(this.target);

      if (! currentFragment) {
        throw new Error(`Element not found: an element with the id ${this.target} does not exist in the source document`);
      }

      const request = this.request(url, method, data);

      const targetDocument = await this.fetch(request);
      const targetFragment = targetDocument.getElementById(this.target);

      if (! targetFragment) {
        throw new Error(`Element not found: an element with the id ${this.target} does not exist in the target document`);
      }

      const isCancelled = this.#fire('update', {
        cancelable: true,
        detail: {
          currentFragment,
          targetFragment,
        },
      });

      if (isCancelled) {
        this.#markAsIdle();
        this.#announce('cancelled', 'Operation cancelled.');
        return;
      }

      if ('startViewTransition' in document) {
        document.startViewTransition(() => currentFragment.replaceChildren(...targetFragment.children));
      } else {
        currentFragment.replaceChildren(...targetFragment.children);
      }

      this.#fire('updated', {
        detail: {
          currentFragment,
          targetFragment,
        },
      });

      this.#announce('success', 'Success!');
    } catch (error) {
      this.#announce('error', 'Something went wrong. Please try again.');
      console.error(error);
    } finally {
      this.#markAsIdle();
    }
  }

  /**
   * @param {Event} event
   * @returns {void}
   */
  handleEvent(event) {
    const {type, target} = event;

    if (type === 'click' && target.closest('a[data-use-ajax]')) {
      this.#handleAnchorClick(event);
    } else if (type === 'submit' && target.closest('form[data-use-ajax]')) {
      this.#handleFormSubmit(event);
    } else if (type === 'popstate') {
      this.#handlePopState(event);
    }
  }

  /**
   * @param {string} tagName
   * @returns {this}
   */
  static define(tagName) {
    if (! ('customElements' in window)) {
      console.warn('Custom elements are not supported by your browser.');
      return this;
    }

    const custromElementName = customElements.getName(this);

    if (custromElementName) {
      console.warn(`${this.name} already defined as <${custromElementName}>.`);
      return this;
    }

    const customElement = customElements.get(tagName);

    if (customElement && customElement !== this) {
      console.warn(`<${tagName}> already defined as ${customElement.name}`);
      return this;
    }

    customElements.define(tagName, this);
    return this;
  }

  /**
   * @returns {boolean}
   */
  #isBusy() {
    return this.#busy;
  }

  /**
   * @returns {this}
   */
  #markAsBusy() {
    this.#busy = true;

    this.setAttribute('loading', '');

    this.targetElement?.setAttribute('loading', '');
    this.targetElement?.setAttribute('aria-busy', 'true');

    return this;
  }

  /**
   * @returns {this}
   */
  #markAsIdle() {
    this.#busy = false;

    this.removeAttribute('loading');

    this.targetElement?.removeAttribute('loading');
    this.targetElement?.removeAttribute('aria-busy');

    return this;
  }

  /**
   * @param {string} key
   * @param {?string} fallback
   * @returns {?string}
   */
  #translate(key, fallback = null) {
    return this.getAttribute(`status-${key}`) || fallback;
  }

  /**
   * @param {string} key
   * @param {?string} fallback
   * @returns {this}
   */
  #announce(key, fallback = null) {
    const status = this.shadowRoot.querySelector('[role="status"]');
    const message = this.#translate(key, fallback) || key;

    status.textContent = message;

    return this;
  }

  /**
   * @param {string|string[]} eventTypes
   * @param {object} [options]
   * @returns {boolean}
   */
  #fire(eventTypes, options = {}) {
    eventTypes = Array.isArray(eventTypes) ? eventTypes : [eventTypes];

    const cancelled = !eventTypes.every((eventType) => this.dispatchEvent(
      new CustomEvent(`ajax-fragment:${eventType}`, options),
    ));

    return cancelled;
  }

  /**
   * @param {string} url
   * @param {object} [state]
   * @param {boolean} [initial]
   * @returns {this}
   */
  #recordState(url, state = {}, initial = false) {
    const globalState = history.state || {};

    globalState.fragments = globalState.fragments || {};
    globalState.fragments[this.id] = { url: String(url), ...state };

    if (initial) {
      history.replaceState(globalState, '', url);
    } else {
      history.pushState(globalState, '', url);
    }

    return this;
  }

  /**
   * @param {MouseEvent} event
   * @returns {Promise<void>}
   */
  async #handleAnchorClick(event) {
    event.preventDefault();

    /** @type {HTMLAnchorElement} */
    const target = event.target.closest('a[data-use-ajax]');

    const url = target.href;
    const data = new URLSearchParams(target.search);

    await this.load(url);

    this.#recordState(url, {
      data: data.toString(),
    });
  }

  /**
   * @param {SubmitEvent} event
   * @returns {Promise<void>}
   */
  async #handleFormSubmit(event) {
    event.preventDefault();

    /** @type {HTMLFormElement} */
    const target = event.target.closest('form[data-use-ajax]');

    const url = target.action;
    const method = target.method || RequestMethod.GET;
    const data = new URLSearchParams(new FormData(target));

    await this.load(url, method, data);

    if (method === RequestMethod.GET) {
      this.#recordState(addSearchParams(url, data), {
        data: data.toString(),
      });
    }
  }

  /**
   * @param {PopStateEvent} event
   * @returns {Promise<void>}
   */
  async #handlePopState(event) {
    const state = event.state?.fragments[this.id];

    if (! state) {
      return;
    }

    const {url, data} = state;

    if (! url || ! data) {
      return;
    }

    await this.load(url);

    for (const form of this.querySelectorAll('form[data-use-ajax]')) {
      setFormState(form, data);
    }
  }

}

AjaxFragmentElement.define('ajax-fragment');

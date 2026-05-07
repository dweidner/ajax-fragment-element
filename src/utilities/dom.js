/**
 * @param {HTMLFormElement} form
 * @returns {object}
 */
export function getFormState(form) {
  return Object.fromEntries(new FormData(form));
}

/**
 * @param {HTMLFormElement} form
 * @param {string|string[][]| Record<string, string>|URLSearchParams} data
 */
export function setFormState(form, data) {
  const params = new URLSearchParams(data);

  for (const element of form.elements) {
    const {type, name, value} = element;

    if (!name || ['button', 'file', 'password', 'submit', 'reset'].includes(type)) {
      continue;
    }

    const $value = params.get(name);
    const $values = params.getAll(name);

    const $sole = $values.length === 1;

    switch (type) {
    case 'checkbox':
      element.checked = $values.includes(value) || ($sole && value === '' && $value === 'on');
      break;
    case 'radio':
      element.checked = $value !== null && $value === value;
      break;
    case 'select-multiple':
      for (const option of element.options) {
        option.selected = $values.includes(option.value);
      }
      break;
    default:
      element.value = $value || '';
      break;
    }
  }
}

/**
 * @param {() => void} callback
 * @returns {Promise<void>}
 */
export function startTransition(callback) {
  if (document.startViewTransition) {
    return document.startViewTransition(callback).updateCallbackDone;
  }

  return Promise.resolve(callback());
}

/**
 * @param {Element} element
 * @returns {Promise<PromiseSettledResult<Animation>[]>}
 */
export function animationsEnded(element) {
  return Promise.allSettled(
    element?.getAnimations().map((animation) => animation.finished) ?? []
  );
}

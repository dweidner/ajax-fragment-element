/**
 * @param {HTMLFormElement} form
 * @returns {object}
 */
export function getFormState(form) {
  return Object.fromEntries(new FormData(form));
}

/**
 * @param {HTMLFormElement} form
 * @param {string|string[][]|{[key: string]: string}|FormData|URLSearchParams} state
 */
export function setFormState(form, state) {
  state = new URLSearchParams(state);

  for (const element of form.elements) {
    const {name, type, value} = element;

    if (!name || ['button', 'file', 'password', 'submit', 'reset'].includes(type)) {
      continue;
    }

    const $value = state.get(name);
    const $values = state.getAll(name);

    const $sole = $values.length === 1;

    switch (type) {
    case 'checkbox':
      element.checked = $values.includes(value) || (value === '' && $sole && $value === 'on');
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

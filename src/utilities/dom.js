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
    const {name} = element;

    if (!name || ['button', 'file', 'password', 'submit', 'reset'].includes(type)) {
      continue;
    }

    const {type, value} = element;

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

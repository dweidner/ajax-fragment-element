/**
 * @param {number} [n]
 * @returns {Promise<void>}
 */
export function nextFrame(n = 1) {
  return new Promise((resolve) => {
    if (--n === 0) {
      return requestAnimationFrame(resolve);
    } else {
      return resolve(nextFrame(n));
    }
  });
}

/**
 * @returns {Promise<void>}
 */
export function nextMicroTask() {
  return Promise.resolve();
}

/**
 * @returns {Promise<void>}
 */
export function nextMacroTask() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

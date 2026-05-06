/**
 * @returns {Promise<void>}
 */
export function nextMacroTask() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

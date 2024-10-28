/**
 * Limits a function to be called only once in a time interval.
 * @module debounce
 */

/**
 * Returns function that invokes `fn` with a delay, with latest arguments.
 * You can call `cancel` on the return value to prevent `fn` trigger.
 * @param {Function} fn - The function to be triggered after the delay.
 * @param {Number} wait - Millisecond delay after last call, before trigger.
 * @param {boolean} [immediate] - True to call on the leading edge of interval.
 * @returns {Function} Function to serve as proxy for `fn`.
 */
export default (fn, wait, immediate) => {
  let timeout;

  let debounced = function () {
    const triggerCall = () => fn.apply(this, arguments);

    clearTimeout(timeout);
    if (immediate) {
      const firstCall = !timeout;
      timeout = setTimeout(() => {
        timeout = null;
      }, wait);
      if (firstCall) { return fn.apply(this, arguments); }
    }
    else {
      timeout = setTimeout(triggerCall, wait);
    }
  };

  debounced.cancel = () => {
    clearTimeout(timeout);
    timeout = null;
  };

  return debounced;
};

/**
 * Tracks the system clock for a given fixed-schedule provider.
 * Also provides clock sync for simulation at a given speed.
 * Allows the clock speed to change dynamically.
 * @module clock
 */

/*
 TODO:
 1. Get clock sync updates from the stream websocket.
 2. Eventually, provide a slider to control the simulation rate.
*/

const delayTimers = []; // created by setTimeout
const intervalTimers = []; // created by setInterval

const clock = {

  clockRate: 1.0,
  clockStartValue: null, // simulated clock start time
  clockStartTime: null, // real time that simulated clock was started
  pausedAt: null,

  /**
   * Go to real time.
   */
  reset: () => {
    clock.clockStartValue = null;
    clock.clockStartTime = null;
    clock.setClockRate(1);
  },

  /**
   * Equivalent of Date.now(), returns milliseconds since Unix epoch.
   * Provide an optional transit agency ID to use their system time.
   */
  now: (/* agencyId */) => {
    // TODO: sync with transit agency time
    const now = clock.pausedAt || Date.now();
    if (clock.clockStartTime) {
      return clock.clockStartValue + (now - clock.clockStartTime) * clock.clockRate;
    }
    return now;
  },

  /**
   * Change the value of the `now` function.
   */
  setNow: (ms) => {
    clock.clockStartValue = ms;
    clock.clockStartTime = Date.now();
  },

  setClockRate: (factor) => {
    if (factor === 0) {
      clock.pause();
    } else {
      if (factor === clock.clockRate) {return;}
      clock.pause();
      delayTimers.forEach((timer) => {
        timer.milliseconds /= factor;
      });
      intervalTimers.forEach((timer) => {
        timer.milliseconds /= factor;
      });
      clock.clockRate = factor;
      clock.resume();
    }
  },

  _fireTimer: (timer) => {
    delayTimers.splice(delayTimers.indexOf(timer), 1);
    timer.callback();
  },

  _resumeDelayTimer: (timer) => {
    let delay = timer.milliseconds;
    if (clock.pausedAt && timer.startTime) {
      const elapsedBeforePause = Math.min(0, clock.pausedAt - timer.startTime);
      delay -= elapsedBeforePause;
    }

    timer.startTime = Date.now();
    timer.milliseconds = delay;

    const intdelay = Math.round(delay);
    // the intdelay may be 0, but we still need to create a timer in case the
    // timer creator was not expecting an instant run.
    timer.timeoutID = setTimeout(() => {
      clock._fireTimer(timer);
    }, intdelay);
  },

  _resumeIntervalTimer: (timer) => {
    const interval = timer.milliseconds / clock.clockRate;
    if (clock.pausedAt) {
      // calculate the time since the last interval & resume the interval after a delay
      const elapsedBeforePause = Math.min(0, clock.pausedAt - timer.startTime) % interval;
      const delay = interval - elapsedBeforePause;
      if (elapsedBeforePause > 0 && delay > 0) {
        timer.startDelayTimer = setTimeout(() => {
          delete timer.startDelayTimer;
          // now we can fire the timer and start normal intervals.
          timer.callback();
          timer.timeoutID = setInterval(timer.callback, interval);
        }, delay);
      } else {
        timer.timeoutID = setInterval(timer.callback, interval);
      }
    } else {
      timer.timeoutID = setInterval(timer.callback, interval);
    }
  },

  /**
   * Equivalent of global setTimeout.
   */
  setTimeout: (callback, milliseconds) => {
    const timer = {
      timeoutID: -1,
      startTime: null,
      callback,
      milliseconds: milliseconds / clock.clockRate,
    };

    if (!clock.pausedAt) {
      clock._resumeDelayTimer(timer);
    }
    delayTimers.push(timer);
  },

  /**
   * Equivalent of global setInterval.
   */
  setInterval: (callback, milliseconds) => {
    const timer = {
      timeoutID: -1,
      startTime: Date.now(),
      callback,
      milliseconds: milliseconds / clock.clockRate,
    };

    if (!clock.pausedAt) {
      clock._resumeIntervalTimer(timer);
    }
    intervalTimers.push(timer);
  },

  /**
   * Equivalent of global clearTimeout.
   */
  clearTimeout: (timeoutID) => {
    for (let i = 0; i < delayTimers.length; i++) {
      const timer = delayTimers[i];
      if (timer.timeoutID === timeoutID) {
        clearTimeout(timer.timeoutID);
        delayTimers.splice(i, 1);
        return;
      }
    }
  },

  /**
   * Equivalent of global clearInterval.
   */
  clearInterval: (timeoutID) => {
    for (let i = 0; i < intervalTimers.length; i++) {
      const timer = intervalTimers[i];
      if (timer.timeoutID === timeoutID) {
        clearInterval(timer.timeoutID);
        intervalTimers.splice(i, 1);
        return;
      }
    }
  },

  /**
   * Stop the clock temporarily, equivalent to setting the clock rate to 0.
   */
  pause: () => {
    if (clock.pausedAt) {return;}
    clock.pausedAt = Date.now();

    delayTimers.forEach((timer) => {
      clearTimeout(timer.timeoutID);
      timer.timeoutID = -1;
    });
    intervalTimers.forEach((timer) => {
      clearInterval(timer.timeoutID);
      timer.timeoutID = -1;
      if (timer.startDelayTimer) {
        clearTimeout(timer.startDelayTimer);
        delete timer.startDelayTimer;
      }
    });
  },

  resume: () => {
    if (!clock.pausedAt) {return;}

    delayTimers.forEach((timer) => {
      clock._resumeDelayTimer(timer);
    });
    intervalTimers.forEach((timer) => {
      clock._resumeIntervalTimer(timer);
    });

    clock.pausedAt = null;
  },

};

export default clock;

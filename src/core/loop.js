export const STEP_SECONDS = 1 / 240;
export const MAX_STEPS = 8;

/** Fixed ticks driven by an injected monotonic timestamp, independent of render rate. */
export function createFixedStepper(update, step = STEP_SECONDS, maxSteps = MAX_STEPS) {
  let previous = null;
  let accumulator = 0;
  let tick = 0;
  let droppedSeconds = 0;
  return {
    advance(nowMs) {
      if (previous === null) { previous = nowMs; return { alpha: 0, steps: 0 }; }
      const elapsed = Math.max(0, (nowMs - previous) / 1000);
      previous = nowMs;
      const accepted = Math.min(elapsed, step * maxSteps);
      droppedSeconds += elapsed - accepted;
      accumulator += accepted;
      let steps = 0;
      while (accumulator + 1e-10 >= step && steps < maxSteps) {
        update(step, tick++);
        accumulator = Math.max(0, accumulator - step);
        steps++;
      }
      return { alpha: Math.min(1, accumulator / step), steps };
    },
    resetClock() { previous = null; accumulator = 0; },
    get tick() { return tick; },
    get droppedSeconds() { return droppedSeconds; },
  };
}

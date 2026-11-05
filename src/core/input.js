const LEFT = new Set(['ArrowLeft', 'KeyA']);
const RIGHT = new Set(['ArrowRight', 'KeyD']);
const BRAKE = new Set(['ArrowDown', 'KeyS', 'Space']);
const PAUSE = new Set(['Escape', 'KeyP']);
const PUSH = new Set(['ArrowUp', 'KeyW']);
const PULL = new Set(['ArrowDown', 'KeyS']);

/** Raw digital intent. Smoothing happens once per simulation tick. */
export function createInputState({ manualPush = false } = {}) {
  const keys = new Set();
  const pointers = new Map();
  return {
    key(code, down) { down ? keys.add(code) : keys.delete(code); },
    pointer(id, action) { action ? pointers.set(id, action) : pointers.delete(id); },
    clear() { keys.clear(); pointers.clear(); },
    sample() {
      const values = [...pointers.values()];
      const left = [...LEFT].some(code => keys.has(code)) || values.includes('left');
      const right = [...RIGHT].some(code => keys.has(code)) || values.includes('right');
      const brake = [...(manualPush ? ['Space'] : BRAKE)].some(code => keys.has(code)) || values.includes('brake');
      const result = { steer: Number(right) - Number(left), brake };
      if (manualPush) {
        const forward = [...PUSH].some(code => keys.has(code)) || values.includes('push');
        const backward = [...PULL].some(code => keys.has(code)) || values.includes('pull');
        result.push = Number(forward) - Number(backward);
      }
      return result;
    },
  };
}

/** Bind DOM input at the boundary; return cleanup for replacing a game session. */
export function bindInput({ target, canvas, buttons, state, onPause, onInput, isPaused, canvasSteering = true }) {
  const cleanup = [];
  const listen = (element, event, handler) => {
    element.addEventListener(event, handler);
    cleanup.push(() => element.removeEventListener(event, handler));
  };
  listen(target, 'keydown', event => {
    if (PAUSE.has(event.code)) {
      event.preventDefault();
      if (!event.repeat) onPause();
      return;
    }
    if (![...LEFT, ...RIGHT, ...BRAKE, ...PUSH].includes(event.code) || isPaused()) return;
    if (event.code === 'Space' && event.target?.tagName === 'BUTTON') return;
    event.preventDefault();
    state.key(event.code, true);
    onInput();
  });
  listen(target, 'keyup', event => state.key(event.code, false));
  const bindPointer = (element, actionAt) => {
    listen(element, 'pointerdown', event => {
      if (isPaused() || (event.pointerType === 'mouse' && event.button !== 0)) return;
      event.preventDefault();
      element.setPointerCapture(event.pointerId);
      state.pointer(event.pointerId, actionAt(event));
      onInput();
    });
    listen(element, 'pointermove', event => {
      if (element.hasPointerCapture(event.pointerId) && !isPaused()) state.pointer(event.pointerId, actionAt(event));
    });
    for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) {
      listen(element, name, event => state.pointer(event.pointerId, null));
    }
  };
  if (canvasSteering) bindPointer(canvas, event => {
    const rect = canvas.getBoundingClientRect();
    return event.clientX - rect.left < rect.width / 2 ? 'left' : 'right';
  });
  for (const [action, element] of Object.entries(buttons)) {
    bindPointer(element, () => action);
    listen(element, 'keydown', event => {
      if (isPaused() || !['Space', 'Enter'].includes(event.code)) return;
      event.preventDefault();
      state.pointer(`button-${action}`, action);
      onInput();
    });
    listen(element, 'keyup', event => {
      if (['Space', 'Enter'].includes(event.code)) state.pointer(`button-${action}`, null);
    });
    listen(element, 'blur', () => state.pointer(`button-${action}`, null));
  }
  return () => { cleanup.forEach(remove => remove()); state.clear(); };
}

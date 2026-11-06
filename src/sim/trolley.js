import { trolleyParams as defaults } from './params.js';
import { casterMounts, sandbox } from '../content/sandbox.js';

const clamp = (v, low, high) => Math.max(low, Math.min(high, v));
export const angleDifference = (to, from) => Math.atan2(Math.sin(to - from), Math.cos(to - from));
const offset = (x, y, heading) => ({ x: x * Math.cos(heading) + y * Math.sin(heading), y: -x * Math.sin(heading) + y * Math.cos(heading) });
const yawTorque = (arm, fx, fy) => arm.y * fx - arm.x * fy;

export function createTrolley(initial = sandbox.spawn) {
  const heading = initial.heading ?? 0;
  return { x: initial.x ?? 0, y: initial.y ?? 0, heading,
    vx: 0, vy: 0, r: 0, steer: 0, time: 0, tick: 0, distance: 0, impact: 0, contacts: [],
    wheels: casterMounts.map(mount => ({ bearing: heading, rate: 0, flutter: 0, q: 0,
      angle: heading, roll: 0, height: 0, surface: null, excitationActive: false, hits: 0 })),
  };
}

export function wheelPosition(state, index) {
  const mount = casterMounts[index];
  const arm = offset(mount.x, mount.y, state.heading);
  return { x: state.x + arm.x, y: state.y + arm.y, arm };
}

/** Test both collision discs so parking checks match the trolley footprint. */
export function trolleyInRect(cart, rect, p = defaults) {
  return [-p.collisionOffset, p.collisionOffset].every(along => {
    const arm = offset(0, along, cart.heading);
    const x = cart.x + arm.x, y = cart.y + arm.y;
    return x - p.collisionRadius >= rect.x && x + p.collisionRadius <= rect.x + rect.width &&
      y - p.collisionRadius >= rect.y && y + p.collisionRadius <= rect.y + rect.height;
  });
}

/** Return profile height; wheels sample independently, including entering and leaving a hole. */
export function groundAt(x, y, surfaces) {
  for (const surface of surfaces) {
    if (surface.kind === 'pothole') {
      const fraction = Math.hypot(x - surface.x, y - surface.y) / surface.radius;
      if (fraction < 1) return { ...surface, z: surface.rise * Math.sin((1 - fraction) * Math.PI / 2) ** 2 };
    } else if (x > surface.x && x < surface.x + surface.width && y > surface.y && y < surface.y + surface.height) {
      const fraction = surface.width > surface.height ? (y - surface.y) / surface.height : (x - surface.x) / surface.width;
      return { ...surface, z: surface.rise * Math.sin(fraction * Math.PI) ** 2 };
    }
  }
  return null;
}

/** Two contact discs approximate the basket footprint, including the ends when turning. */
function resolveWalls(state, walls, p) {
  for (let iteration = 0; iteration < 3; iteration++) {
    for (const along of [-p.collisionOffset, p.collisionOffset]) {
      const arm = offset(0, along, state.heading);
      for (const wall of walls) {
        const px = state.x + arm.x, py = state.y + arm.y;
        const nearestX = clamp(px, wall.x, wall.x + wall.width);
        const nearestY = clamp(py, wall.y, wall.y + wall.height);
        const dx = px - nearestX, dy = py - nearestY;
        const separation = Math.hypot(dx, dy);
        if (separation >= p.collisionRadius) continue;
        let nx, ny, depth;
        if (separation > 1e-9) { nx = dx / separation; ny = dy / separation; depth = p.collisionRadius - separation; }
        else {
          const faces = [
            { distance: px - wall.x, nx: -1, ny: 0 },
            { distance: wall.x + wall.width - px, nx: 1, ny: 0 },
            { distance: py - wall.y, nx: 0, ny: -1 },
            { distance: wall.y + wall.height - py, nx: 0, ny: 1 },
          ].sort((a, b) => a.distance - b.distance);
          ({ nx, ny } = faces[0]); depth = faces[0].distance + p.collisionRadius;
        }
        state.x += nx * depth; state.y += ny * depth;
        const contactVx = state.vx + state.r * arm.y;
        const contactVy = state.vy - state.r * arm.x;
        const normalSpeed = contactVx * nx + contactVy * ny;
        if (normalSpeed >= 0) continue;
        const leverage = yawTorque(arm, nx, ny);
        const impulse = -normalSpeed / (1 / p.mass + leverage * leverage / p.inertia);
        state.vx += impulse * nx / p.mass; state.vy += impulse * ny / p.mass;
        state.r += leverage * impulse / p.inertia;
        const tangentSpeed = -state.vx * ny + state.vy * nx;
        state.vx += ny * tangentSpeed * p.collisionFriction;
        state.vy -= nx * tangentSpeed * p.collisionFriction;
        const strength = Math.min(1, -normalSpeed / 2);
        state.impact = Math.max(state.impact, strength);
        state.contacts.push({ kind: 'wall', id: wall.id, strength });
      }
    }
  }
}

/**
 * Manual force at the handle, rigid-body inertia, four trailing/swivelling casters.
 * This is a deliberately simplified planar handling model, not an engineering solver.
 * @param {ReturnType<typeof createTrolley>} state
 * @param {{push:number, steer:number, brake:boolean}} input
 * @param {number} dt
 */
export function stepTrolley(state, input, dt, world = sandbox, p = defaults) {
  const next = { ...state, wheels: state.wheels.map(wheel => ({ ...wheel })), impact: state.impact * Math.exp(-dt * 8), contacts: [] };
  const steer = state.steer + (clamp(input.steer, -1, 1) - state.steer) * (1 - Math.exp(-dt / p.steeringTimeConstant));
  const push = input.brake ? 0 : clamp(input.push, -1, 1);
  const forceForward = push * (push >= 0 ? p.pushForce : p.pullForce);
  const forceSide = input.brake ? 0 : -steer * p.turnForce;
  const handleForce = offset(forceSide, forceForward, state.heading);
  let fx = handleForce.x - state.vx * p.linearDrag;
  let fy = handleForce.y - state.vy * p.linearDrag;
  let torque = -p.handleOffset * forceSide - state.r * p.yawDrag;

  for (let i = 0; i < casterMounts.length; i++) {
    const mount = casterMounts[i], old = state.wheels[i], wheel = next.wheels[i];
    const point = wheelPosition(state, i);
    let vx = state.vx + state.r * point.arm.y, vy = state.vy - state.r * point.arm.x;
    const speed = Math.hypot(vx, vy);
    const surface = groundAt(point.x, point.y, world.surfaces);
    const entered = surface && surface.id !== old.surface;
    if (entered && speed > .04) {
      const severity = surface.severity;
      // Impact impulse at this particular wheel: the lever arm determines the yaw kick.
      const impulse = p.mass / 4 * speed * severity * p.bumpImpulse;
      const ix = -vx / speed * impulse, iy = -vy / speed * impulse;
      next.vx += ix / p.mass; next.vy += iy / p.mass;
      next.r += yawTorque(point.arm, ix, iy) / p.inertia;
      wheel.bearing += mount.bias * p.bumpSwivelKick * speed * severity;
      wheel.q += mount.bias * p.bumpFlutterKick * speed * severity;
      wheel.hits++; next.impact = Math.min(1, speed * severity / 2);
      next.contacts.push({ kind: 'ground', id: surface.id, wheel: i, strength: next.impact });
    }
    wheel.height = surface?.z ?? 0; wheel.surface = surface?.id ?? null;
    if (speed > .02) {
      const error = angleDifference(Math.atan2(vx, vy), wheel.bearing);
      let alignment = Math.sin(error);
      // A perfectly reversed caster needs a repeatable side to begin its 180° swivel.
      if (Math.cos(error) < -.98 && Math.abs(alignment) < .03) alignment = mount.bias * .03;
      wheel.rate += (p.casterAlignment * speed * alignment - p.casterDamping * wheel.rate) * dt;
      wheel.rate = clamp(wheel.rate, -p.maxCasterRate, p.maxCasterRate);
      wheel.bearing += wheel.rate * dt;
    } else { wheel.rate *= Math.exp(-p.casterDamping * dt); wheel.bearing += wheel.rate * dt; }

    const unstable = mount.bad && speed > p.flutterCriticalSpeed && !input.brake;
    if (unstable && !old.excitationActive && Math.hypot(wheel.flutter, wheel.q / (2 * Math.PI * p.flutterFrequency)) < p.excitation) wheel.flutter = p.excitation;
    wheel.excitationActive = unstable;
    const growth = unstable ? p.flutterGrowth * (speed / p.flutterCriticalSpeed - 1) : -p.flutterDecay;
    wheel.q += ((growth - p.flutterCap * wheel.flutter ** 2) * wheel.q - (2 * Math.PI * p.flutterFrequency) ** 2 * wheel.flutter) * dt;
    wheel.flutter += wheel.q * dt;
    wheel.angle = wheel.bearing + wheel.flutter;
    const forwardX = Math.sin(wheel.angle), forwardY = Math.cos(wheel.angle);
    const normalX = forwardY, normalY = -forwardX;
    const along = vx * forwardX + vy * forwardY;
    const lateral = vx * normalX + vy * normalY;
    const rollForce = -p.rollingDrag * along - p.rollingResistance * Math.tanh(along / .12);
    const sideForce = clamp(-p.lateralGrip * lateral, -p.maxWheelForce, p.maxWheelForce);
    const wx = forwardX * rollForce + normalX * sideForce;
    const wy = forwardY * rollForce + normalY * sideForce;
    fx += wx; fy += wy; torque += yawTorque(point.arm, wx, wy);
    wheel.roll += along * dt;
  }
  next.vx += fx / p.mass * dt; next.vy += fy / p.mass * dt;
  next.r += torque / p.inertia * dt;
  if (input.brake) {
    const damping = Math.exp(-p.brakeDrag * dt);
    next.vx *= damping; next.vy *= damping; next.r *= damping;
  }
  if (Math.hypot(next.vx, next.vy) < .003 && push === 0 && Math.abs(steer) < .001) { next.vx = 0; next.vy = 0; }
  if (Math.abs(next.r) < .001 && Math.abs(steer) < .001) next.r = 0;
  next.heading += next.r * dt;
  next.x += next.vx * dt; next.y += next.vy * dt;
  resolveWalls(next, world.walls, p);
  next.steer = steer; next.tick++; next.time += dt;
  next.distance += Math.hypot(next.x - state.x, next.y - state.y);
  return next;
}

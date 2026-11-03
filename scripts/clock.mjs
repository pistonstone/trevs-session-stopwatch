// Independent clock logic: times are milliseconds, supplied by the caller.
export const emptyClock = () => ({elapsedMs: 0, enabled: false, since: null});

export function elapsed(state, now) {
  return Math.max(0, Number(state.elapsedMs) || 0) +
    (Number.isFinite(state.since) ? Math.max(0, now - state.since) : 0);
}

export function transition(state, action, now, paused = false) {
  if (action === "restore") {
    // Never count time while the GM client was closed. Resume manually.
    return {elapsedMs: Math.max(0, Number(state.elapsedMs) || 0), enabled: false, since: null};
  }
  if (action === "reset") return emptyClock();
  const total = elapsed(state, now);
  if (action === "start") return {elapsedMs: total, enabled: true, since: paused ? null : now};
  if (action === "stop") return {elapsedMs: total, enabled: false, since: null};
  if (action === "pause") return {elapsedMs: total, enabled: Boolean(state.enabled), since: null};
  if (action === "resume" || action === "checkpoint") {
    return {elapsedMs: total, enabled: Boolean(state.enabled), since: state.enabled && !paused ? now : null};
  }
  throw new Error(`Unknown clock action: ${action}`);
}

export function formatTime(ms) {
  const seconds = Math.floor(Math.max(0, ms) / 1000);
  return [Math.floor(seconds / 3600), Math.floor(seconds / 60) % 60, seconds % 60]
    .map(v => String(v).padStart(2, "0")).join(":");
}

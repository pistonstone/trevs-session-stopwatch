// Reads only the old persisted total; never includes an old running timestamp.
export function legacyTotal(serialized) {
  if (serialized === null || serialized === undefined) return null;
  const data = JSON.parse(serialized);
  if (!data || typeof data.elapsedMs !== "number" || !Number.isFinite(data.elapsedMs) || data.elapsedMs < 0) {
    throw new Error("Invalid old stopwatch total");
  }
  return {elapsedMs: data.elapsedMs, enabled: false, since: null};
}

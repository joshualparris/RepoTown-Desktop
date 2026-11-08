// RuneScape's heartbeat (docs/RUNESCAPE_ROADMAP.md, engine step 1): actions advance on a global
// 0.6-second game tick — a woodcutting roll every 4 ticks, a tinderbox strike every tick — while
// walking, the camera and the town simulation stay smooth and real-time. Pure logic, no three.js.
export const TICK_SECONDS = 0.6;
export const CHOP_TICKS = 4;        // 2.4 s between log rolls, as in RuneScape
export const LIGHT_TICKS = 1;       // one tinderbox strike per tick until the logs catch
export const LIGHT_GIVE_UP = 20;    // stop after 12 s of failed strikes

// Turns frame time into whole ticks. A long pause (a backgrounded tab) runs at most one
// tick on return rather than a burst, so nothing happens "while you weren't looking".
export function createGameTick() {
  let acc = 0, count = 0;
  return {
    get count() { return count; },
    advance(dt, { catchUp = false } = {}) {
      acc += Math.max(0, dt);
      // Foreground rendering may stall on slow phones. Preserve up to four
      // earned ticks so gameplay time doesn't run slower than wall time.
      // Long stalls/background resumes still advance at most one tick.
      if (acc > TICK_SECONDS * 2) {
        acc = catchUp && dt <= 5
          ? Math.min(acc, TICK_SECONDS * 4)
          : TICK_SECONDS;
      }
      let n = 0;
      while (acc >= TICK_SECONDS) { acc -= TICK_SECONDS; count++; n++; }
      return n;
    },
  };
}

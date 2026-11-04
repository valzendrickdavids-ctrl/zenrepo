// Keep the heading, empty padding and player rows in the same scroll target.
const WHEEL_GAIN = 1.8;
const SWIPE_COAST = 640;
const MAX_COAST_SCREENS = 4;

export function attachLeaderboardScrolling(panel, list) {
  if (!panel || !list) return;
  const view = panel.ownerDocument.defaultView;
  const reducedMotion = view.matchMedia('(prefers-reduced-motion: reduce)');
  let wheelTarget = null, wheelTimer, drag = null, coastFrame = 0;
  const clamp = value => Math.max(0, Math.min(list.scrollHeight - list.clientHeight, value));
  const stopCoast = () => {
    view.cancelAnimationFrame(coastFrame);
    coastFrame = 0;
  };
  const coast = distance => {
    stopCoast();
    const start = list.scrollTop, travel = clamp(start + distance) - start;
    const duration = Math.min(1100, Math.max(500, Math.abs(travel) * .8));
    const began = view.performance.now();
    const step = now => {
      const progress = Math.min(1, (now - began) / duration);
      list.scrollTo({top:start + travel * (1 - (1 - progress) ** 3), behavior:'instant'});
      coastFrame = progress < 1 ? view.requestAnimationFrame(step) : 0;
    };
    if (travel) coastFrame = view.requestAnimationFrame(step);
  };
  const clearWheel = () => {
    wheelTarget = null;
    view.clearTimeout(wheelTimer);
  };
  const wheel = event => {
    // Preserve browser zoom and horizontal trackpad gestures.
    if (event.ctrlKey || Math.abs(event.deltaY) <= Math.abs(event.deltaX) || list.scrollHeight <= list.clientHeight) return;
    event.preventDefault();
    stopCoast();
    const unit = event.deltaMode === 1 ? 20 : event.deltaMode === 2 ? list.clientHeight : 1;
    wheelTarget = clamp((wheelTarget ?? list.scrollTop) + event.deltaY * unit * WHEEL_GAIN);
    list.scrollTo({top:wheelTarget, behavior:reducedMotion.matches ? 'instant' : 'smooth'});
    view.clearTimeout(wheelTimer);
    wheelTimer = view.setTimeout(clearWheel, 500);
  };
  const down = event => {
    clearWheel();
    stopCoast();
    if (event.pointerType !== 'touch' || !event.isPrimary || list.scrollHeight <= list.clientHeight) return;
    list.scrollTo({top:list.scrollTop, behavior:'instant'});
    drag = {id:event.pointerId, y:event.clientY, time:event.timeStamp, velocity:0};
    panel.setPointerCapture(event.pointerId);
  };
  const move = event => {
    if (!drag || event.pointerId !== drag.id) return;
    const delta = drag.y - event.clientY;
    const elapsed = Math.max(1, event.timeStamp - drag.time);
    drag.velocity = .65 * drag.velocity + .35 * delta / elapsed;
    drag.y = event.clientY;
    drag.time = event.timeStamp;
    list.scrollTo({top:clamp(list.scrollTop + delta), behavior:'instant'});
  };
  const up = event => {
    if (!drag || event.pointerId !== drag.id) return;
    if (!reducedMotion.matches && event.timeStamp - drag.time < 100) {
      const limit = list.clientHeight * MAX_COAST_SCREENS;
      const momentum = Math.max(-limit, Math.min(limit, drag.velocity * SWIPE_COAST));
      coast(momentum);
    }
    drag = null;
  };
  const cancel = () => { drag = null; };
  const keydown = event => {
    clearWheel();
    stopCoast();
    if (event.target !== list || event.ctrlKey || event.metaKey || event.altKey) return;
    const positions = {
      ArrowUp:list.scrollTop - 32,
      ArrowDown:list.scrollTop + 32,
      PageUp:list.scrollTop - list.clientHeight,
      PageDown:list.scrollTop + list.clientHeight,
      Home:0,
      End:list.scrollHeight,
    };
    if (!Object.hasOwn(positions, event.key)) return;
    event.preventDefault();
    list.scrollTo({top:clamp(positions[event.key]), behavior:reducedMotion.matches ? 'instant' : 'smooth'});
  };
  panel.addEventListener('wheel', wheel, {passive:false});
  panel.addEventListener('pointerdown', down);
  panel.addEventListener('pointermove', move);
  panel.addEventListener('pointerup', up);
  panel.addEventListener('pointercancel', cancel);
  panel.addEventListener('lostpointercapture', cancel);
  panel.addEventListener('keydown', keydown);
  return () => {
    clearWheel();
    stopCoast();
    panel.removeEventListener('wheel', wheel);
    panel.removeEventListener('pointerdown', down);
    panel.removeEventListener('pointermove', move);
    panel.removeEventListener('pointerup', up);
    panel.removeEventListener('pointercancel', cancel);
    panel.removeEventListener('lostpointercapture', cancel);
    panel.removeEventListener('keydown', keydown);
  };
}

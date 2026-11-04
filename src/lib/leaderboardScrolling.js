// Keep the heading, empty padding and player rows in the same scroll target.
export function attachLeaderboardScrolling(panel, list) {
  if (!panel || !list) return;
  const view = panel.ownerDocument.defaultView;
  const reducedMotion = view.matchMedia('(prefers-reduced-motion: reduce)');
  let wheelTarget = null, wheelTimer, drag = null;
  const clamp = value => Math.max(0, Math.min(list.scrollHeight - list.clientHeight, value));
  const clearWheel = () => {
    wheelTarget = null;
    view.clearTimeout(wheelTimer);
  };
  const wheel = event => {
    // Preserve browser zoom and horizontal trackpad gestures.
    if (event.ctrlKey || Math.abs(event.deltaY) <= Math.abs(event.deltaX) || list.scrollHeight <= list.clientHeight) return;
    event.preventDefault();
    const unit = event.deltaMode === 1 ? 20 : event.deltaMode === 2 ? list.clientHeight : 1;
    wheelTarget = clamp((wheelTarget ?? list.scrollTop) + event.deltaY * unit);
    list.scrollTo({top:wheelTarget, behavior:reducedMotion.matches ? 'instant' : 'smooth'});
    view.clearTimeout(wheelTimer);
    wheelTimer = view.setTimeout(clearWheel, 500);
  };
  const down = event => {
    clearWheel();
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
      const momentum = Math.max(-list.clientHeight, Math.min(list.clientHeight, drag.velocity * 160));
      list.scrollTo({top:clamp(list.scrollTop + momentum), behavior:'smooth'});
    }
    drag = null;
  };
  const cancel = () => { drag = null; };
  const keydown = event => {
    clearWheel();
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
    panel.removeEventListener('wheel', wheel);
    panel.removeEventListener('pointerdown', down);
    panel.removeEventListener('pointermove', move);
    panel.removeEventListener('pointerup', up);
    panel.removeEventListener('pointercancel', cancel);
    panel.removeEventListener('lostpointercapture', cancel);
    panel.removeEventListener('keydown', keydown);
  };
}

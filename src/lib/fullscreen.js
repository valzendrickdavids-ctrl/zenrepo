export function fullscreenSupported(doc) {
  return doc.fullscreenEnabled !== false &&
    typeof doc.documentElement?.requestFullscreen === 'function' &&
    typeof doc.exitFullscreen === 'function';
}

export function isFullscreenShortcut(event) {
  if (event.key?.toLowerCase() !== 'f' || event.repeat || event.defaultPrevented ||
      event.isComposing || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return false;
  const path = event.composedPath?.() || [event.target];
  return !path.some(target => target?.isContentEditable ||
    target?.closest?.('input, textarea, select, [role="textbox"], [role="combobox"]'));
}

export async function toggleFullscreen(doc) {
  if (doc.fullscreenElement) {
    await doc.exitFullscreen();
  } else {
    if (!fullscreenSupported(doc)) throw Error('Full screen is unavailable.');
    // Use the document root so every screen and dialog stays in full screen.
    await doc.documentElement.requestFullscreen();
  }
}

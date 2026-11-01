import {useCallback, useEffect, useRef, useState} from 'react';
import {fullscreenSupported, isFullscreenShortcut, toggleFullscreen} from './fullscreen.js';

export default function useFullscreen() {
  const [active, setActive] = useState(() => Boolean(document.fullscreenElement));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const pending = useRef(false);

  const toggle = useCallback(async () => {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError('');
    try {
      await toggleFullscreen(document);
      setActive(Boolean(document.fullscreenElement));
    } catch {
      setError('Full screen could not change. Try again, or open the game in Chrome and press F11.');
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    const changed = () => {
      setActive(Boolean(document.fullscreenElement));
      setError('');
    };
    const keydown = event => {
      if (!isFullscreenShortcut(event) || !fullscreenSupported(document)) return;
      event.preventDefault();
      void toggle();
    };
    document.addEventListener('fullscreenchange', changed);
    window.addEventListener('keydown', keydown);
    return () => {
      document.removeEventListener('fullscreenchange', changed);
      window.removeEventListener('keydown', keydown);
    };
  }, [toggle]);

  return {active, busy, error, supported: fullscreenSupported(document), toggle, clearError: () => setError('')};
}

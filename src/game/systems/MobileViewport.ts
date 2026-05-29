type ViewportListener = () => void;

export function installMobileViewport(): { onChange: (listener: ViewportListener) => void } {
  const listeners = new Set<ViewportListener>();
  const root = document.documentElement;

  const apply = (): void => {
    const viewport = window.visualViewport;
    const width = viewport?.width ?? window.innerWidth;
    const height = viewport?.height ?? window.innerHeight;
    const left = viewport?.offsetLeft ?? 0;
    const top = viewport?.offsetTop ?? 0;

    root.style.setProperty('--app-width', `${Math.round(width)}px`);
    root.style.setProperty('--app-height', `${Math.round(height)}px`);
    root.style.setProperty('--viewport-left', `${Math.round(left)}px`);
    root.style.setProperty('--viewport-top', `${Math.round(top)}px`);
    root.classList.toggle('is-touch-device', window.matchMedia('(pointer: coarse)').matches);
    listeners.forEach((listener) => listener());
  };

  const scheduleApply = (): void => {
    window.requestAnimationFrame(apply);
    window.setTimeout(apply, 250);
    window.setTimeout(apply, 700);
  };

  window.addEventListener('resize', scheduleApply, { passive: true });
  window.addEventListener('orientationchange', scheduleApply, { passive: true });
  window.addEventListener('pageshow', scheduleApply, { passive: true });
  window.visualViewport?.addEventListener('resize', scheduleApply, { passive: true });
  window.visualViewport?.addEventListener('scroll', scheduleApply, { passive: true });

  apply();
  scheduleApply();

  return {
    onChange(listener: ViewportListener): void {
      listeners.add(listener);
    },
  };
}

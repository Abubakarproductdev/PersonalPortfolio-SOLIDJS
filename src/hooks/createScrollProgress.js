import { createSignal, onCleanup, onMount } from "solid-js";

export function createScrollProgress(targetAccessor) {
  const [progress, setProgress] = createSignal(0);

  onMount(() => {
    let cachedTop = 0;
    let cachedHeight = 1;
    let rafId = 0;
    let lastProgress = -1;

    const measure = () => {
      const target = targetAccessor?.();
      const scrollY = window.scrollY || document.documentElement.scrollTop || 0;

      if (!target) {
        cachedTop = 0;
        cachedHeight = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        return;
      }

      const rect = target.getBoundingClientRect();
      cachedTop = rect.top + scrollY;
      cachedHeight = Math.max(1, target.offsetHeight - window.innerHeight);
    };

    const update = () => {
      const scrollY = window.scrollY || document.documentElement.scrollTop || 0;
      let nextProgress = (scrollY - cachedTop) / cachedHeight;
      nextProgress = Math.min(1, Math.max(0, nextProgress));

      // Avoid redundant signal notifications for imperceptible subpixel movements
      if (Math.abs(nextProgress - lastProgress) > 0.0004) {
        lastProgress = nextProgress;
        setProgress(nextProgress);
      }
    };

    const onScroll = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = 0;
        update();
      });
    };

    const onResize = () => {
      measure();
      update();
    };

    measure();
    update();

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });

    onCleanup(() => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    });
  });

  return progress;
}


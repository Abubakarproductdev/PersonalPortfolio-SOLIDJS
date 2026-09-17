export const FRAME_COUNT = 192;
export const FRAME_PAD_LENGTH = 5;

export const getFrameSrc = (index) =>
  `/frames/${String(index).padStart(FRAME_PAD_LENGTH, "0")}_compressed.webp`;

export const PHYSICS_TEXTURES = [
  "/nextjs.jpg",
  "/react.jpg",
  "/python.jpg",
  "/javascript.jpg",
  "/html.png",
  "/tailwind.jpg",
  "/nodejs.jpg",
  "/expressjs.jpg",
  "/mongodb.jpg",
];

export const PHYSICS_ENVIRONMENT = "/adamsbridge.hdr";

// Module-level persistent state (retained across route changes)
export const frameCache = new Array(FRAME_COUNT).fill(null);
export let hasInitiallyLoaded = false;
export function setHasInitiallyLoaded(val) {
  hasInitiallyLoaded = Boolean(val);
}

export let isAllFramesLoaded = false;
let isPreloadStarted = false;
const listeners = new Set();

export function subscribePreload(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notifyListeners(data) {
  listeners.forEach((fn) => {
    try {
      fn(data);
    } catch {
      // ignore
    }
  });
}

export async function loadFrameAsset(index) {
  const cacheIndex = index - 1;
  if (frameCache[cacheIndex]) {
    return frameCache[cacheIndex];
  }

  const src = getFrameSrc(index);

  // Try createImageBitmap for zero-jank GPU-ready decoding if supported
  if (typeof window !== "undefined" && "createImageBitmap" in window && "fetch" in window) {
    try {
      const response = await fetch(src);
      if (response.ok) {
        const blob = await response.blob();
        const bitmap = await createImageBitmap(blob);
        frameCache[cacheIndex] = bitmap;
        return bitmap;
      }
    } catch {
      // fallback to HTMLImageElement below
    }
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.decoding = "async";
    img.loading = "eager";
    const finish = () => {
      frameCache[cacheIndex] = img;
      resolve(img);
    };
    img.onload = () => {
      if (typeof img.decode === "function") {
        img.decode().catch(() => {}).finally(finish);
        return;
      }
      finish();
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

export function findClosestLoadedFrame(targetIndex) {
  if (frameCache[targetIndex]) return frameCache[targetIndex];

  for (let distance = 1; distance < FRAME_COUNT; distance += 1) {
    const before = targetIndex - distance;
    const after = targetIndex + distance;

    if (before >= 0 && frameCache[before]) return frameCache[before];
    if (after < FRAME_COUNT && frameCache[after]) return frameCache[after];
  }

  return null;
}

export async function initFramesPreload(onFirstFrameReady) {
  // Always ensure frame 1 is ready ASAP
  if (!frameCache[0]) {
    const first = await loadFrameAsset(1);
    if (first && onFirstFrameReady) {
      onFirstFrameReady(first);
    }
  } else if (onFirstFrameReady) {
    onFirstFrameReady(frameCache[0]);
  }

  if (isPreloadStarted) return;
  isPreloadStarted = true;

  // Stream remaining frames sequentially / in small concurrent batches in background
  const remaining = [];
  for (let i = 2; i <= FRAME_COUNT; i += 1) {
    if (!frameCache[i - 1]) remaining.push(i);
  }

  let loadedCount = FRAME_COUNT - remaining.length;
  let cursor = 0;
  const concurrency = typeof navigator !== "undefined" && navigator.hardwareConcurrency ? Math.min(6, navigator.hardwareConcurrency) : 4;

  const runWorker = async () => {
    while (cursor < remaining.length) {
      const index = remaining[cursor++];
      await loadFrameAsset(index);
      loadedCount += 1;
      const progress = Math.round((loadedCount / FRAME_COUNT) * 100);
      notifyListeners({ loadedCount, total: FRAME_COUNT, progress });
    }
  };

  await Promise.all(Array.from({ length: concurrency }, runWorker));
  isAllFramesLoaded = true;
  notifyListeners({ loadedCount: FRAME_COUNT, total: FRAME_COUNT, progress: 100, done: true });
}

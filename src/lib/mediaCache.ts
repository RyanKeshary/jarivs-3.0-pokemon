// Client-side media caching and instant playback utility
// Uses CacheStorage + Blob URLs to chunk-packet, store, and stream media instantly

const CACHE_NAME = 'jarvis-media-cache-v1';
const blobUrlMap = new Map<string, string>();
const activeAudioPool = new Map<string, HTMLAudioElement[]>();

/**
 * Preload, packet, and store a video in CacheStorage and memory
 * Returns an instant Blob URL or cached source
 */
export async function getCachedVideoUrl(src: string): Promise<string> {
  if (typeof window === 'undefined') return src;

  // If already in memory Blob map, return immediately
  if (blobUrlMap.has(src)) {
    return blobUrlMap.get(src)!;
  }

  try {
    if ('caches' in window) {
      const cache = await caches.open(CACHE_NAME);
      let response = await cache.match(src);

      if (!response) {
        response = await fetch(src, {
          headers: { Range: 'bytes=0-' },
        });
        if (response.ok || response.status === 206) {
          cache.put(src, response.clone()).catch(() => {});
        }
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      blobUrlMap.set(src, blobUrl);
      return blobUrl;
    }
  } catch (err) {
    console.warn('Media cache fallback for:', src, err);
  }

  return src;
}

/**
 * Lazy loads and stores media in the background (chunk packeting to disk/cache)
 */
export function lazyStoreMedia(urls: string[]) {
  if (typeof window === 'undefined') return;

  const run = () => {
    urls.forEach((url) => {
      getCachedVideoUrl(url).catch(() => {});
    });
  };

  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(run);
  } else {
    setTimeout(run, 1000);
  }
}

/**
 * High-performance audio player for rapid clicking voice lines
 * Reuses or pools audio elements so rapid clicks trigger instantly without clipping
 */
export function playInstantVoice(src: string, volume: number = 1.0) {
  if (typeof window === 'undefined') return;

  try {
    let pool = activeAudioPool.get(src);
    if (!pool) {
      pool = [];
      activeAudioPool.set(src, pool);
    }

    // Find an idle audio element or allocate a new one (max 4 concurrent in pool)
    let audio = pool.find((a) => a.paused || a.ended);
    if (!audio) {
      if (pool.length < 4) {
        audio = new Audio(src);
        audio.preload = 'auto';
        pool.push(audio);
      } else {
        audio = pool[0]; // Reuse oldest
      }
    }

    audio.volume = volume;
    audio.currentTime = 0;
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Autoplay policy or gesture required
      });
    }
  } catch {
    // Fallback silent fail
  }
}

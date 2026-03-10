const cache = new Map();

export function getCache(key: string) {
  return cache.get(key);
}

export function setCache(key: string, value: any) {
  cache.set(key, value);

  // optional expiration
  setTimeout(() => {
    cache.delete(key);
  }, 1000 * 60 * 60); // 1 hour
}
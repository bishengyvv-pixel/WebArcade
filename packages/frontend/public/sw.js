const CACHE_NAME = 'webarcade-roms-v1';
const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_PARALLEL = 4;

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (!url.pathname.startsWith('/roms/')) return;
  if (event.request.method !== 'GET') return;

  event.respondWith(handleRomRequest(event.request));
});

async function handleRomRequest(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const response = await downloadWithChunks(request.url);
    cache.put(request, response.clone());
    return response;
  } catch {
    return fetch(request);
  }
}

async function downloadWithChunks(url) {
  const head = await fetch(url, { method: 'HEAD' });
  if (!head.ok) return fetch(url);

  const size = parseInt(head.headers.get('Content-Length') || '0');
  const contentType = head.headers.get('Content-Type') || 'application/octet-stream';

  // Small or unknown size: download normally
  if (!size || size < CHUNK_SIZE) {
    return fetch(url);
  }

  // Build chunk boundaries
  const chunkBoundaries = [];
  for (let start = 0; start < size; start += CHUNK_SIZE) {
    chunkBoundaries.push({ start, end: Math.min(start + CHUNK_SIZE - 1, size - 1) });
  }

  const results = new Array(chunkBoundaries.length);

  // Download in parallel batches
  for (let i = 0; i < chunkBoundaries.length; i += MAX_PARALLEL) {
    const batch = chunkBoundaries.slice(i, i + MAX_PARALLEL);
    const responses = await Promise.all(
      batch.map((chunk) =>
        fetch(url, { headers: { Range: `bytes=${chunk.start}-${chunk.end}` } })
      )
    );
    const buffers = await Promise.all(responses.map((r) => r.arrayBuffer()));
    for (let j = 0; j < buffers.length; j++) {
      results[i + j] = new Uint8Array(buffers[j]);
    }
  }

  // Assemble all chunks
  const total = results.reduce((sum, arr) => sum + arr.length, 0);
  const assembled = new Uint8Array(total);
  let offset = 0;
  for (const arr of results) {
    assembled.set(arr, offset);
    offset += arr.length;
  }

  return new Response(assembled.buffer, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Content-Length': String(total),
    },
  });
}

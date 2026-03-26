const SANITY_PROJECT_ID = process.env.EXPO_PUBLIC_SANITY_PROJECT_ID || '';
const SANITY_DATASET = process.env.EXPO_PUBLIC_SANITY_DATASET || 'production';
const SANITY_TOKEN = process.env.EXPO_PUBLIC_SANITY_TOKEN || '';

const SANITY_API_VERSION = '2024-01-01';

export function sanityImageUrl(ref: string): string {
  if (!ref) return '';
  const [, id, dimensions, format] = ref.split('-');
  if (!id || !dimensions || !format) return '';
  return `https://cdn.sanity.io/images/${SANITY_PROJECT_ID}/${SANITY_DATASET}/${id}-${dimensions}.${format}`;
}

export async function sanityFetch<T>(query: string): Promise<T> {
  const encoded = encodeURIComponent(query);
  const url = `https://${SANITY_PROJECT_ID}.api.sanity.io/v${SANITY_API_VERSION}/data/query/${SANITY_DATASET}?query=${encoded}`;

  console.log('[Sanity] Fetching:', query);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (SANITY_TOKEN) {
    headers['Authorization'] = `Bearer ${SANITY_TOKEN}`;
  }

  const res = await fetch(url, { headers });

  if (!res.ok) {
    const text = await res.text();
    console.error('[Sanity] Error response:', text);
    throw new Error(`Sanity fetch failed: ${res.status}`);
  }

  const json = await res.json();
  console.log('[Sanity] Result count:', json.result?.length ?? 0);
  return json.result as T;
}

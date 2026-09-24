import type {
  MediaOwnerType,
  MediaPurpose,
  MediaResponse,
  MediaVariantType,
} from '../types/media'
import { api } from './api'

export async function uploadMedia(
  purpose: MediaPurpose,
  ownerId: number | string,
  file: File,
): Promise<MediaResponse> {
  const form = new FormData()
  form.append('file', file)
  const response = await api.post<MediaResponse>('/api/media/uploads', form, {
    params: { purpose, ownerId },
  })
  return response.data
}

export async function deleteMedia(linkId: number | string): Promise<void> {
  await api.delete(`/api/media/links/${linkId}`)
}

export async function getMediaForOwner(
  ownerType: MediaOwnerType,
  ownerId: number | string,
): Promise<MediaResponse[]> {
  const response = await api.get<MediaResponse[]>(`/api/media/owners/${ownerType}/${ownerId}`)
  return response.data
}

/** One request for a whole list screen. Asking per row is N+1 over the network. */
export async function getMediaForOwners(
  purpose: MediaPurpose,
  ownerIds: Array<number | string>,
): Promise<MediaResponse[]> {
  if (ownerIds.length === 0) return []
  const response = await api.get<MediaResponse[]>('/api/media/links', {
    params: { purpose, ownerIds: ownerIds.join(',') },
  })
  return response.data
}

export function findVariantUrl(
  media: MediaResponse | null | undefined,
  variant: MediaVariantType,
): string | null {
  return media?.variants.find((candidate) => candidate.variant === variant)?.url ?? null
}

/**
 * Object-URL cache for authenticated images.
 *
 * <p>Media reads are permission-gated, so the request carries an Authorization header — and an
 * `<img src>` cannot send one. Every image is therefore fetched as a blob and handed to the `img`
 * as an object URL. This is not a workaround for a missing feature; it is what authenticated
 * binary reads look like.
 *
 * <p>The network cost is still paid only once: the server answers `immutable` with a year's
 * max-age, which the browser HTTP cache honours for `fetch`/XHR exactly as it does for `<img>`.
 * What this map avoids is re-decoding and re-allocating a blob per mount.
 *
 * <p>An object URL holds its blob in memory until revoked, so the map is capped. Without a cap a
 * long admin session browsing a large menu accumulates every image it ever rendered.
 */
const MAX_CACHED_OBJECT_URLS = 150
const objectUrlCache = new Map<string, Promise<string>>()

export function fetchMediaObjectUrl(url: string): Promise<string> {
  const cached = objectUrlCache.get(url)
  if (cached) {
    // Re-insert so the most recently used entry is last, which is what the eviction below reads.
    objectUrlCache.delete(url)
    objectUrlCache.set(url, cached)
    return cached
  }

  const pending = api
    .get<Blob>(url, { responseType: 'blob', notifyOnError: false })
    .then((response) => URL.createObjectURL(response.data))
    .catch((error) => {
      // A failed fetch must not poison the cache: the next mount should retry rather than reject
      // forever from a stale promise.
      objectUrlCache.delete(url)
      throw error
    })

  objectUrlCache.set(url, pending)
  evictOldest()
  return pending
}

function evictOldest(): void {
  while (objectUrlCache.size > MAX_CACHED_OBJECT_URLS) {
    const oldestKey = objectUrlCache.keys().next().value
    if (oldestKey === undefined) return
    const evicted = objectUrlCache.get(oldestKey)
    objectUrlCache.delete(oldestKey)
    void evicted?.then((objectUrl) => URL.revokeObjectURL(objectUrl)).catch(() => undefined)
  }
}

/**
 * Drops a single entry. Call after replacing or removing an attachment — the new file has a new
 * url, but the old one would otherwise keep its bytes alive for the rest of the session.
 */
export function releaseMediaObjectUrl(url: string | null | undefined): void {
  if (!url) return
  const cached = objectUrlCache.get(url)
  if (!cached) return
  objectUrlCache.delete(url)
  void cached.then((objectUrl) => URL.revokeObjectURL(objectUrl)).catch(() => undefined)
}

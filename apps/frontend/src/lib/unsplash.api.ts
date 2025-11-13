const BASE_URL = process.env.NEXT_PUBLIC_UNSPLASH_API_URL!;
const ACCESS_KEY = process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY!;

export type UnsplashPhoto = {
  id: string;
  urls: { small: string; full: string };
  alt_description: string;
  links: { html: string; download_location: string };
  user: { name: string; links: { html: string } };
};

export async function fetchUnsplashPhotos(
  query: string,
  page = 1,
  perPage = 12
): Promise<UnsplashPhoto[]> {
  const res = await fetch(
    `${BASE_URL}/search/photos?query=${encodeURIComponent(query)}&page=${page}&per_page=${perPage}`,
    {
      headers: { Authorization: `Client-ID ${ACCESS_KEY}` },
      cache: 'no-store',
    }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.errors?.[0] || 'Erreur API Unsplash');
  return data.results;
}

export async function triggerDownload(
  photoId: string,
  downloadLocation: string
) {
  try {
    await fetch(`${downloadLocation}?client_id=${ACCESS_KEY}`);
  } catch (e) {
    console.error('Erreur trigger download', e);
  }
}

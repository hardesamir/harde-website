import type { ImageMetadata } from 'astro';

// resolves repo paths stored by the CMS (e.g. "/src/assets/gallery/x.jpg")
// to the imported image metadata astro:assets needs
const images = import.meta.glob<{ default: ImageMetadata }>(
  '/src/assets/**/*.{jpg,jpeg,png,webp,avif}',
  { eager: true }
);

export function resolveImage(path: string): ImageMetadata {
  const entry = images[path];
  if (!entry) {
    throw new Error(
      `Image not found: "${path}". It must be a file under src/assets/ (did it get deleted in the CMS?)`
    );
  }
  return entry.default;
}

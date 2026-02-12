export function optimizeCloudinaryUrl(url: string, options: { width?: number; quality?: string; format?: string } = {}): string {
  if (!url || !url.includes('cloudinary.com')) return url;

  const { width = 800, quality = 'auto', format = 'auto' } = options;
  const transforms = `f_${format},q_${quality},w_${width},c_limit`;

  const cleaned = url.replace(/\/upload\/(?!v\d)[^\/]+\//g, '/upload/');
  return cleaned.replace('/upload/', `/upload/${transforms}/`);
}

export function thumbnailUrl(url: string): string {
  return optimizeCloudinaryUrl(url, { width: 400, quality: 'auto' });
}

export function heroUrl(url: string): string {
  return optimizeCloudinaryUrl(url, { width: 1200, quality: 'auto' });
}

export function galleryThumbUrl(url: string): string {
  return optimizeCloudinaryUrl(url, { width: 500, quality: 'auto' });
}

export function galleryFullUrl(url: string): string {
  return optimizeCloudinaryUrl(url, { width: 1200, quality: 'auto' });
}

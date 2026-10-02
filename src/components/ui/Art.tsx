import type { CSSProperties } from 'react';

import type { ArtAsset } from '../../lib/assets';

interface ArtProps {
  asset: ArtAsset;
  /** Empty for decorative images - keeps them out of the accessibility tree. */
  alt: string;
  /** Above the fold, load eagerly. Everything else should stay lazy. */
  priority?: boolean;
  className?: string;
  style?: CSSProperties;
  sizes?: string;
}

/**
 * Renders art as <picture> with AVIF -> WebP -> PNG, always setting intrinsic
 * width and height.
 *
 * The width/height attributes are the whole point: the browser derives an
 * aspect ratio from them and reserves the box before a single byte of image
 * data arrives. Without them, every lazy image below the fold would push the
 * page down as it loaded - which is exactly the layout shift that costs
 * Lighthouse points.
 *
 * Note this is width/height-as-ratio, not fixed sizing. The image still scales
 * fluidly via CSS.
 */
export function Art({ asset, alt, priority = false, className, style, sizes }: ArtProps) {
  return (
    <picture>
      <source type="image/avif" srcSet={asset.avif} sizes={sizes} />
      <source type="image/webp" srcSet={asset.webp} sizes={sizes} />
      <img
        src={asset.png}
        alt={alt}
        width={asset.width}
        height={asset.height}
        loading={priority ? 'eager' : 'lazy'}
        // async decoding keeps a large image from blocking the main thread on
        // paint. eager is only correct for the first meaningful paint.
        decoding={priority ? 'sync' : 'async'}
        // The intro video is the LCP candidate on a first visit; letting the
        // browser fetch this early avoids a second round trip.
        fetchPriority={priority ? 'high' : 'auto'}
        draggable={false}
        className={className}
        style={style}
      />
    </picture>
  );
}

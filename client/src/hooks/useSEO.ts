import { useEffect } from 'react';

interface SEOMetadata {
  title?: string;
  description?: string;
  ogImage?: string;
  ogTitle?: string;
  ogDescription?: string;
  canonicalUrl?: string;
}

export function useSEO(metadata: SEOMetadata) {
  useEffect(() => {
    // Update document title
    if (metadata.title) {
      document.title = metadata.title;
    }

    // Remove existing meta tags that we'll update
    const existingMeta = document.querySelectorAll(
      'meta[name="description"], meta[property="og:title"], meta[property="og:description"], meta[property="og:image"], link[rel="canonical"]'
    );
    existingMeta.forEach((tag) => tag.remove());

    // Add meta description
    if (metadata.description) {
      const metaDescription = document.createElement('meta');
      metaDescription.name = 'description';
      metaDescription.content = metadata.description;
      document.head.appendChild(metaDescription);
    }

    // Add OG tags
    if (metadata.ogTitle) {
      const ogTitle = document.createElement('meta');
      ogTitle.setAttribute('property', 'og:title');
      ogTitle.content = metadata.ogTitle;
      document.head.appendChild(ogTitle);
    }

    if (metadata.ogDescription) {
      const ogDescription = document.createElement('meta');
      ogDescription.setAttribute('property', 'og:description');
      ogDescription.content = metadata.ogDescription;
      document.head.appendChild(ogDescription);
    }

    if (metadata.ogImage) {
      const ogImage = document.createElement('meta');
      ogImage.setAttribute('property', 'og:image');
      ogImage.content = metadata.ogImage;
      document.head.appendChild(ogImage);
    }

    // Add canonical URL
    if (metadata.canonicalUrl) {
      const canonical = document.createElement('link');
      canonical.rel = 'canonical';
      canonical.href = metadata.canonicalUrl;
      document.head.appendChild(canonical);
    }
  }, [metadata]);
}

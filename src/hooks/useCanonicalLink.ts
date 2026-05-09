import { useEffect } from 'react';

const CANONICAL_SELECTOR = 'link[rel="canonical"]';

export const useCanonicalLink = (href?: string) => {
  useEffect(() => {
    if (!href || typeof document === 'undefined') return;

    let link = document.head.querySelector(CANONICAL_SELECTOR) as HTMLLinkElement | null;

    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      document.head.appendChild(link);
    }

    link.href = href;

    return () => {
      if (link?.href === href) {
        link.remove();
      }
    };
  }, [href]);
};

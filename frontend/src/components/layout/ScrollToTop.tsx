import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Scroll the main content area to top.
    // Assuming the main content container has a specific class or we target the window.
    // Based on AppLayout.module.scss, the main content is likely in a scrollable container.
    // We target the window for default behavior, or a specific element if necessary.
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

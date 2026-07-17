import { useLocation } from 'react-router-dom';

/**
 * Wraps its children in a div keyed to the current pathname.
 * Every route change unmounts + remounts the div, triggering the
 * CSS entrance animation from index.css (.page-enter).
 */
export default function PageTransition({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  return (
    <div key={pathname} className="page-enter" style={{ minHeight: '100%' }}>
      {children}
    </div>
  );
}

import { useTransition } from '../components/Transitions/TransitionContext';
import { useDocumentMeta } from '../hooks/useDocumentMeta';

export default function NotFound() {
  const { go } = useTransition();
  useDocumentMeta({ title: 'Page not found | Zcorebit Media', description: 'This page could not be found.', path: '/404' });
  return (
    <main id="main" className="notfound">
      <p className="overline"><span className="overline__num">(404)</span> Lost frame</p>
      <h1 className="notfound__title">This scene <em>isn’t</em> in the cut.</h1>
      <button type="button" className="glass-btn glass-btn--solid" onClick={() => go('/')}>Back to the studio →</button>
    </main>
  );
}

import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { SoundControl } from './components/AudioController/SoundControl';
import { Cursor } from './components/Cursor/Cursor';
import { Intro } from './components/Intro/Intro';
import { Header } from './components/Navigation/Header';
import { TransitionProvider } from './components/Transitions/TransitionContext';
import { ExperienceProvider, useExperience } from './context/ExperienceContext';
import { ScrollProvider } from './context/ScrollContext';
import { SoundProvider } from './context/SoundContext';
import Home from './pages/Home';
import { inertProps } from './utils/dom';

// Secondary routes are split out of the initial bundle.
const GalleryPage = lazy(() => import('./pages/GalleryPage'));
const ProjectPage = lazy(() => import('./pages/ProjectPage'));
const NotFound = lazy(() => import('./pages/NotFound'));

function Shell() {
  const { introActive, menuOpen } = useExperience();
  return (
    <TransitionProvider>
      <a href="#main" className="skip-link">Skip to content</a>
      <Header />
      <div className="app-content" {...inertProps(introActive || menuOpen)} aria-hidden={introActive || menuOpen || undefined}>
        <Suspense fallback={<div className="route-loading" aria-busy="true" />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/gallery" element={<GalleryPage />} />
            <Route path="/work/:slug" element={<ProjectPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </div>
      <SoundControl />
      {introActive && <Intro />}
      <div className="stage-frame" aria-hidden="true" />
      <Cursor />
    </TransitionProvider>
  );
}

export default function App() {
  return (
    <ExperienceProvider>
      <SoundProvider>
        <ScrollProvider>
          <Shell />
        </ScrollProvider>
      </SoundProvider>
    </ExperienceProvider>
  );
}

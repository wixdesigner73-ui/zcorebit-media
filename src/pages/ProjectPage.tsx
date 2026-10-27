import { useParams } from 'react-router-dom';
import { ProjectView } from '../components/ProjectViewer/ProjectView';
import { projects } from '../data/content';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import NotFound from './NotFound';

export default function ProjectPage() {
  const { slug } = useParams();
  const project = projects.find((p) => p.slug === slug);

  useDocumentMeta({
    title: project ? `${project.client} — ${project.title} | Zcorebit Media` : 'Project not found | Zcorebit Media',
    description: project?.description ?? 'This project could not be found.',
    path: `/work/${slug ?? ''}`,
    image: project ? `assets/images/${project.images[0]}-1280.webp` : undefined,
  });

  if (!project) return <NotFound />;
  // key: remount per project so entrance animations replay.
  return <ProjectView key={project.slug} project={project} />;
}

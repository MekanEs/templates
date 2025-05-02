// src/app/(dashboard)/projects/page.tsx
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Project } from '@/types'; // Импортируем тип

export default async function ProjectsPage() {
  const supabase = createClient();
  const { data: projects, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching projects:', error);
    // Можно показать сообщение об ошибке пользователю
  }

  return (
    <div className='container mx-auto p-4'>
      <h1 className='text-2xl font-bold mb-4'>Projects</h1>
      {/* Здесь можно добавить кнопку/форму для создания нового проекта */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
        {projects && projects.length > 0 ? (
          (projects as Project[]).map(
            (
              project, // Применяем тип
            ) => (
              <Link
                href={`/projects/${project.id}/templates`}
                key={project.id}
                className='block p-4 border rounded hover:shadow-lg transition-shadow'
              >
                <h2 className='text-xl font-semibold'>{project.name}</h2>
                <p className='text-gray-600'>{project.description}</p>
                <p className='text-sm text-gray-400 mt-2'>
                  Created: {new Date(project.created_at).toLocaleDateString()}
                </p>
              </Link>
            ),
          )
        ) : (
          <p>No projects found.</p>
        )}
      </div>
    </div>
  );
}

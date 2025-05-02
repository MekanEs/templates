// src/app/(dashboard)/projects/page.tsx
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Project } from '@/types';
import CreateProjectForm from './_components/CreateProjectForm'; // <<< Импорт формы
import DeleteProjectButton from './_components/DeleteProjectButton'; // <<< Импорт кнопки удаления

export default async function ProjectsPage() {
  const supabase = createClient();

  // <<< Получаем пользователя и его права >>>
  const { data: { user } } = await supabase.auth.getUser();
  let canEdit = false;
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('can_edit_templates')
      .eq('id', user.id)
      .single();
    canEdit = profile?.can_edit_templates ?? false;
  }
  // <<< Конец получения прав >>>

  const { data: projects, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching projects:', error);
  }

  return (
    <div className='container mx-auto p-4'>
      <h1 className='text-2xl font-bold mb-4'>Projects</h1>

      {/* <<< Форма создания проекта (только для админов) >>> */}
      <CreateProjectForm canEdit={canEdit} />

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
        {projects && projects.length > 0 ? (
          (projects as Project[]).map(
            (project) => (
              <div key={project.id} className="border rounded p-4 hover:shadow-lg transition-shadow relative"> {/* Обертка для позиционирования кнопки */}
                <Link href={`/projects/${project.id}/templates`} className='block'>
                  <h2 className='text-xl font-semibold'>{project.name}</h2>
                  <p className='text-gray-600 mt-1'>{project.description}</p>
                  <p className='text-sm text-gray-400 mt-2'>
                    Created: {new Date(project.created_at).toLocaleDateString()}
                  </p>
                </Link>
                 {/* <<< Кнопка удаления проекта (только для админов) >>> */}
                 <div className="absolute top-2 right-2"> {/* Позиционируем кнопку */}
                    <DeleteProjectButton projectId={project.id} canEdit={canEdit} />
                 </div>
              </div>
            ),
          )
        ) : (
          <p>No projects found.</p>
        )}
      </div>
    </div>
  );
}
// src/app/(dashboard)/projects/[projectId]/templates/page.tsx
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Template } from '@/types'; // Импортируем тип

interface TemplatesPageProps {
  params: { projectId: string };
}

export default async function TemplatesPage({ params }: TemplatesPageProps) {
  const supabase = createClient();
  const { projectId } = params;

  // Получаем информацию о проекте (опционально, для заголовка)
  const { data: projectData, error: projectError } = await supabase
    .from('projects')
    .select('name')
    .eq('id', projectId)
    .single();

  // Получаем шаблоны для этого проекта
  const { data: templates, error: templatesError } = await supabase
    .from('templates')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (projectError || templatesError) {
    console.error('Error fetching data:', projectError || templatesError);
    // Обработка ошибок
  }

  return (
    <div className='container mx-auto p-4'>
      <Link href='/projects' className='text-blue-500 hover:underline mb-4 block'>
        &larr; Back to Projects
      </Link>
      <h1 className='text-2xl font-bold mb-4'>Templates for: {projectData?.name ?? 'Project'}</h1>
      {/* Здесь можно добавить кнопку/форму для создания нового шаблона */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
        {templates && templates.length > 0 ? (
          (templates as Template[]).map(
            (
              template, // Применяем тип
            ) => (
              <Link
                href={`/projects/${projectId}/templates/${template.id}`}
                key={template.id}
                className='block p-4 border rounded hover:shadow-lg transition-shadow'
              >
                <h2 className='text-xl font-semibold'>{template.name}</h2>
                <p className='text-sm text-gray-400 mt-2'>
                  Updated: {new Date(template.updated_at).toLocaleString()}
                </p>
              </Link>
            ),
          )
        ) : (
          <p>No templates found for this project.</p>
        )}
      </div>
    </div>
  );
}

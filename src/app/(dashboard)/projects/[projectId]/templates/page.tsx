// src/app/(dashboard)/projects/[projectId]/templates/page.tsx
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Template } from '@/types';
import CreateTemplateForm from './_components/CreateTemplateForm'; // <<< Импорт формы
import DeleteTemplateButton from './_components/DeleteTemplateButton'; // <<< Импорт кнопки удаления

interface TemplatesPageProps {
  params: { projectId: string };
}

export default async function TemplatesPage({ params }: TemplatesPageProps) {
  const supabase = createClient();
  const { projectId } = params;

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

  // Получаем информацию о проекте
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
  }

  return (
    <div className='container mx-auto p-4'>
      <Link href='/projects' className='text-blue-500 hover:underline mb-4 block'>
        ← Back to Projects
      </Link>
      <h1 className='text-2xl font-bold mb-4'>Templates for: {projectData?.name ?? 'Project'}</h1>

      {/* <<< Форма создания шаблона (только для админов) >>> */}
      <CreateTemplateForm projectId={projectId} canEdit={canEdit} />

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
        {templates && templates.length > 0 ? (
          (templates as Template[]).map(
            (template) => (
              <div key={template.id} className="border rounded p-4 hover:shadow-lg transition-shadow relative"> {/* Обертка */}
                <Link href={`/projects/${projectId}/templates/${template.id}`} className='block'>
                  <h2 className='text-xl font-semibold'>{template.name}</h2>
                  <p className='text-sm text-gray-400 mt-2'>
                    Updated: {new Date(template.updated_at).toLocaleString()}
                  </p>
                </Link>
                {/* <<< Кнопка удаления шаблона (только для админов) >>> */}
                <div className="absolute top-2 right-2">
                    <DeleteTemplateButton templateId={template.id} projectId={projectId} canEdit={canEdit} />
                </div>
              </div>
            ),
          )
        ) : (
          <p>No templates found for this project.</p>
        )}
      </div>
    </div>
  );
}
// src/app/(dashboard)/projects/[projectId]/templates/page.tsx
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Tag, Template } from '@/types';
import CreateTemplateForm from './_components/CreateTemplateForm';
import DeleteTemplateButton from './_components/DeleteTemplateButton';
import TemplateFilter from './_components/TemplateFilter'; // <<< Импорт фильтра
import { PostgrestSingleResponse } from '@supabase/supabase-js';

interface TemplatesPageProps {
  params: { projectId: string };
  searchParams?: { // <<< Добавляем searchParams
    tags?: string;
  };
}

export default async function TemplatesPage({ params, searchParams }: TemplatesPageProps) {
  const supabase = createClient();
  const { projectId } = params;
  const filterTags = searchParams?.tags?.split(',').map(t => t.trim().toLowerCase()).filter(Boolean) ?? []; // Получаем и обрабатываем теги из URL

  // ... (получение прав canEdit)
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

  // ... (получение projectData)
   const { data: projectData, error: projectError } = await supabase
    .from('projects')
    .select('name')
    .eq('id', projectId)
    .single();

  // <<< Обновляем запрос для получения шаблонов с фильтрацией по тегам >>>


    const { data: templates, error: templatesError }:PostgrestSingleResponse< (Template & { tags?: Tag[] })[]> = await supabase
      .rpc('get_templates_by_project_and_tags', { p_project_id: projectId, p_filter_tags: filterTags })
       .order('created_at', { ascending: false });

    
      


 


  if (projectError || templatesError) {
    console.error('Error fetching data:', projectError || templatesError);
  }

  // Преобразуем данные, если tags есть (для отображения)

  return (
    <div className='container mx-auto p-4'>
      <Link href='/projects' className='text-blue-600 hover:underline mb-4 block'>
        ← Back to Projects
      </Link>
      <h1 className='text-2xl font-bold mb-1 text-gray-900 dark:text-white'>Templates for: {projectData?.name ?? 'Project'}</h1>

       {/* <<< Компонент фильтра >>> */}
      <TemplateFilter />

      {/* Форма создания шаблона */}
      <CreateTemplateForm projectId={projectId} canEdit={canEdit} />

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6'>
        {templates && templates.length > 0 ? (
          templates.map(
            (template) => (
              <div key={template.id} className="border rounded-lg p-4 hover:shadow-lg transition-shadow relative bg-white dark:bg-gray-800 dark:border-gray-700 flex flex-col justify-between"> {/* Обертка */}
                <div> {/* Контентная часть */}
                    <Link href={`/projects/${projectId}/templates/${template.id}`} className='block mb-2'>
                    <h2 className='text-xl font-semibold text-gray-900 dark:text-white'>{template.name}</h2>
                    <p className='text-sm text-gray-500 dark:text-gray-400 mt-1'>
                        Updated: {new Date(template.updated_at).toLocaleString()}
                    </p>
                    </Link>
                    
                     {/* <<< Отображение тегов >>> */}
                     {template.tags && template.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                            {template.tags.map(tag => (
                                <span key={tag} className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-full dark:bg-gray-700 dark:text-gray-300">
                                    {tag}
                                </span>
                            ))}
                        </div>
                     )}
                </div>
                {/* Кнопка удаления шаблона */}
                {canEdit && (
                    <div className="absolute top-2 right-2">
                        <DeleteTemplateButton templateId={template.id} projectId={projectId} canEdit={canEdit} />
                    </div>
                )}
              </div>
            ),
          )
        ) : (
          <p className="text-gray-600 dark:text-gray-400 col-span-full text-center py-6">
            {filterTags.length > 0 ? 'No templates found matching the selected tags.' : 'No templates found for this project.'}
          </p>
        )}
      </div>
    </div>
  );
}
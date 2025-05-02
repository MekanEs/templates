// src/app/(dashboard)/projects/[projectId]/templates/[templateId]/page.tsx
import { createClient } from '@/lib/supabase/server';
// <<< Обновляем импорт Template и добавляем Tag >>>
import { Template, Tag } from '@/types';
import TemplateEditorWrapper from './components/TemplateEditorWrapper';
import Link from 'next/link';

interface TemplateDetailPageProps {
  params: { projectId: string; templateId: string };
}

export default async function TemplateDetailPage({ params }: TemplateDetailPageProps) {
  const supabase = createClient();
  const { projectId, templateId } = params;

  // Получаем текущего пользователя
  const { data: { user } } = await supabase.auth.getUser();

  let canEdit = false;
  if (user) {
    // Если пользователь есть, получаем его профиль и права
    const { data: profile } = await supabase
      .from('profiles')
      .select('can_edit_templates')
      .eq('id', user.id)
      .single();
    canEdit = profile?.can_edit_templates ?? false;
  }

  // <<< Обновляем запрос для получения шаблона С ТЕГАМИ >>>
  const { data: templateData, error } = await supabase
    .from('templates')
    // Выбираем все поля из templates И связанные теги (id и name)
    .select(`
      *,
      tags ( id, name )
    `)
    .eq('id', templateId)
    .single();

  // Оставляем tags как массив объектов Tag, как ожидает TemplateEditorWrapper
  const template: (Template & { tags?: Tag[] }) | null = templateData ? {
      ...templateData,
      tags: templateData.tags as Tag[] // Убеждаемся, что тип соответствует
  } : null;


  if (error || !template) {
    console.error('Error fetching template with tags:', error);
    // Можно улучшить сообщение об ошибке
    return (
        <div className="container mx-auto p-4">
             <Link href={`/projects/${projectId}/templates`} className="text-blue-600 hover:underline mb-5 inline-block">← Back to Templates</Link>
             <p className="p-4 text-sm text-red-700 bg-red-100 rounded-lg border border-red-300" role="alert">
                Template not found or error loading. Error: {error?.message || 'Unknown error'}
             </p>
        </div>
    );
  }

  return (
    // Убрали контейнер отсюда, т.к. он теперь внутри Wrapper или вокруг него
    <>
        <div className="container mx-auto px-4 pt-4 pb-2"> {/* Контейнер для ссылки "Назад" */}
            <Link href={`/projects/${projectId}/templates`} className="text-blue-600 hover:underline mb-1 inline-block">← Back to Templates</Link>
        </div>
         {/* Обертка для липкого хедера и основного контента */}
        <TemplateEditorWrapper
            initialTemplate={template} // Передаем шаблон с объектами Tag
            canEdit={canEdit}
        />
    </>
  );
}
// src/app/(dashboard)/projects/[projectId]/templates/[templateId]/page.tsx
import { createClient } from '@/lib/supabase/server';
import { Template } from '@/types';
import TemplateEditorWrapper from './components/TemplateEditorWrapper';
import Link from 'next/link';

interface TemplateDetailPageProps {
  params: { projectId: string; templateId: string };
}

export default async function TemplateDetailPage({ params }: TemplateDetailPageProps) {
  const supabase = createClient(); // Передаем куки в клиент
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

  // Получаем данные шаблона
  const { data: template, error } = await supabase
    .from('templates')
    .select('*')
    .eq('id', templateId)
    .single();

  if (error || !template) {
    console.error('Error fetching template:', error);
    return <p>Template not found or error loading.</p>;
  }

  return (
    <div className="container mx-auto p-4">
      <Link href={`/projects/${projectId}/templates`} className="text-blue-500 hover:underline mb-4 block">← Back to Templates</Link>
      <h1 className="text-2xl font-bold mb-4">
        {canEdit ? 'Edit' : 'View'} Template: {template.name}
      </h1>
      {/* Передаем права в компонент-обертку */}
      <TemplateEditorWrapper
        initialTemplate={template as Template}
        canEdit={canEdit} // <<< Передаем флаг прав
      />
    </div>
  );
}
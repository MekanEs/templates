// src/lib/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from './supabase/server';
import { z } from 'zod';
import { DynamicVariable } from '@/types'; // <<< Импорт типа
import { redirect } from 'next/navigation';

// Схема для одной динамической переменной
const DynamicVariableSchema = z.object({
  name: z.string().min(1, "Variable name cannot be empty").regex(/^[A-Z0-9_]+$/, "Name must be uppercase alphanumeric characters and underscores"), // Ограничение на имя
  label: z.string().min(1, "Label cannot be empty"),
  type: z.enum(['text', 'date', 'number', 'textarea']),
  defaultValue: z.string().optional(),
});

// Обновленная схема валидации для формы
const UpdateTemplateSchema = z.object({
  templateContent: z.string().optional(),
  previewDataString: z.string().refine((data) => {
    try { JSON.parse(data); return true; } catch { return false; }
  }, { message: "Preview data must be valid JSON." }),
  // Добавляем валидацию для dynamic_variables
  dynamicVariablesString: z.string().refine((data) => {
      if (!data) return true; // Разрешаем пустую строку (означает null или [])
      try {
          const parsed = JSON.parse(data);
          // Проверяем, что это массив и каждый элемент соответствует схеме
          return Array.isArray(parsed) && parsed.every(item => DynamicVariableSchema.safeParse(item).success);
      } catch {
          return false;
      }
  }, { message: "Dynamic variables must be a valid JSON array of variable definitions." }),
});

export type ActionState = { message: string; success: boolean; errors?: z.ZodIssue[]; };

export async function updateTemplateAction(
  templateId: string,
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = createClient();

  // 1. Проверка прав (как и раньше)
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { message: 'Authentication required.', success: false };
  const { data: profile, error: profileError } = await supabase
    .from('profiles').select('can_edit_templates').eq('id', user.id).single();
  if (profileError || !profile?.can_edit_templates) return { message: 'Permission denied.', success: false };

  // 2. Валидация данных
  const rawFormData = {
      templateContent: formData.get('templateContent'),
      previewDataString: formData.get('previewDataString'),
      dynamicVariablesString: formData.get('dynamicVariablesString'), // <<< Получаем новые данные
  };
  const validatedFields = UpdateTemplateSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
     console.error("Validation Errors:", validatedFields.error.flatten().fieldErrors);
     return {
        message: 'Validation failed. Check the fields, especially Dynamic Variables format.',
        success: false,
        errors: validatedFields.error.issues,
     };
  }

  // 3. Парсинг JSON
  let previewDataJson: object | null = null;
  let dynamicVariablesJson: DynamicVariable[] | null = null; // <<< Переменная для dynamic_variables

  try {
    previewDataJson = JSON.parse(validatedFields.data.previewDataString);
    // Парсим dynamic_variables, если строка не пустая
    if (validatedFields.data.dynamicVariablesString) {
        dynamicVariablesJson = JSON.parse(validatedFields.data.dynamicVariablesString);
    }
  } catch (e) {
    console.log(e)
     return { message: 'Failed to parse JSON data.', success: false };
  }

  // 4. Обновление данных в Supabase
  const { error } = await supabase
    .from('templates')
    .update({
      content: validatedFields.data.templateContent,
      preview_data: previewDataJson,
      dynamic_variables: dynamicVariablesJson, // <<< Сохраняем dynamic_variables
    })
    .eq('id', templateId);

  if (error) {
    console.error('Supabase update error:', error);
    return { message: `Database Error: Failed to update template. ${error.message}`, success: false };
  }

  // 5. Ревалидация кеша
  revalidatePath(`/projects/.*/templates/${templateId}`, 'page');

  return { message: 'Template updated successfully!', success: true };
}
export async function duplicateTemplateAction(
    originalTemplateId: string,
    projectId: string, // Нам нужен ID проекта для ревалидации и редиректа


): Promise<ActionState> {
    const supabase = createClient();

    // 1. Проверка прав (как в updateTemplateAction)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { message: 'Authentication required.', success: false };
    const { data: profile, error: profileError } = await supabase
        .from('profiles').select('can_edit_templates').eq('id', user.id).single();
    if (profileError || !profile?.can_edit_templates) {
        console.warn(`User ${user.id} attempted to duplicate template ${originalTemplateId} without permission.`);
        return { message: 'Permission denied.', success: false };
    }

    // 2. Получение данных оригинального шаблона
    const { data: originalTemplate, error: fetchError } = await supabase
        .from('templates')
        .select('*') // Получаем все поля
        .eq('id', originalTemplateId)
        .single();

    if (fetchError || !originalTemplate) {
        console.error('Error fetching original template:', fetchError);
        return { message: 'Original template not found or error fetching.', success: false };
    }

    // 3. Подготовка данных для нового шаблона
    const newTemplateData = {
        project_id: originalTemplate.project_id, // Тот же проект
        name: `${originalTemplate.name} (Copy)`, // Добавляем "(Copy)" к имени
        content: originalTemplate.content,
        preview_data: originalTemplate.preview_data,
        dynamic_variables: originalTemplate.dynamic_variables,
        // id, created_at, updated_at будут сгенерированы автоматически
    };

    // 4. Вставка нового шаблона и получение его ID
    const { data: newTemplate, error: insertError } = await supabase
        .from('templates')
        .insert(newTemplateData)
        .select('id') // <<< Запрашиваем ID созданной записи
        .single(); // <<< Ожидаем одну запись

    if (insertError || !newTemplate) {
        console.error('Error inserting duplicate template:', insertError);
        return { message: `Database Error: Failed to duplicate template. ${insertError?.message ?? ''}`, success: false };
    }

    // 5. Ревалидация кеша списка шаблонов для этого проекта
    revalidatePath(`/projects/${projectId}/templates`, 'page');

    // 6. Перенаправление на страницу редактирования нового шаблона
    // Используем redirect из next/navigation (должен вызываться *после* успешной операции)
    redirect(`/projects/${projectId}/templates/${newTemplate.id}`);

    // Технически, из-за редиректа этот return не будет достигнут на клиенте,
    // но он нужен для соответствия типу Promise<ActionState>
    // return { message: 'Template duplicated successfully! Redirecting...', success: true };
}
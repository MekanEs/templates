// src/app/(dashboard)/projects/[projectId]/templates/[templateId]/components/TemplateEditorWrapper.tsx
'use client';

import { useState, useEffect, useActionState } from 'react';
import { Template, DynamicVariable, JSONObject } from '@/types'; // Импорт DynamicVariable
import TemplateEditor from './TemplateEditor';
import VariableInput from './VariableInput';
import TemplatePreview from './TemplatePreview';
import DynamicVariableInputs from './DynamicVariableInputs'; // <<< Импорт
import FinalTemplateOutput from './FinalTemplateOutput';   // <<< Импорт
import { ActionState, duplicateTemplateAction, updateTemplateAction } from '@/lib/actions';
import {  useFormStatus } from 'react-dom';
import DynamicVariableEditor from './DynamicVariableEditor';

interface TemplateEditorWrapperProps {
  initialTemplate: Template;
  canEdit: boolean;
}
// Начальное состояние для обеих форм
const initialActionState: ActionState = { message: '', success: false };



// <<< Новый компонент для кнопки дублирования >>>
function DuplicateButton({ canEdit }: { canEdit: boolean }) {
    const { pending } = useFormStatus(); // Статус для формы дублирования

    if (!canEdit) {
        return null; // Не показывать кнопку, если нет прав
    }

    return (
        <button
            type="submit"
            disabled={pending}
            className={`px-4 py-2 rounded text-white text-sm ${
                pending ? 'bg-yellow-400 cursor-not-allowed' : 'bg-yellow-600 hover:bg-yellow-700'
            }`}
        >
            {pending ? 'Duplicating...' : 'Duplicate'}
        </button>
    );
}
const initialState = { message: '', success: false };

function SubmitButton({ canEdit }: { canEdit: boolean }) {
  const { pending } = useFormStatus();
  if (!canEdit) return null;
  return (
    <button type="submit" disabled={pending} /* ... className ... */>
      {pending ? 'Saving...' : 'Save Template'}
    </button>
  );
}

export default function TemplateEditorWrapper({ initialTemplate, canEdit }: TemplateEditorWrapperProps) {
  // Состояния для основных редакторов
  const [templateContent, setTemplateContent] = useState(initialTemplate.content ?? '');
  const [previewDataString, setPreviewDataString] = useState(
    JSON.stringify(initialTemplate.preview_data ?? {}, null, 2)
  );
  // Состояние для редактора определений динамических переменных (только для админов)
  const [dynamicVariablesString, setDynamicVariablesString] = useState(
    JSON.stringify(initialTemplate.dynamic_variables ?? [], null, 2)
  );

  // Состояния для данных предпросмотра Handlebars
  const [previewData, setPreviewData] = useState<JSONObject>(initialTemplate.preview_data ?? {});
  const [isValidPreviewJson, setIsValidPreviewJson] = useState(true);

  // Состояния для динамических переменных (заполняемых пользователем)
  const [dynamicVariableDefinitions, setDynamicVariableDefinitions] = useState<DynamicVariable[]>(initialTemplate.dynamic_variables ?? []);
  const [dynamicVariableValues, setDynamicVariableValues] = useState<Record<string, string>>(() => {
      // Инициализация значений по умолчанию
      const initialValues: Record<string, string> = {};
      (initialTemplate.dynamic_variables ?? []).forEach(v => {
          if (v.defaultValue !== undefined) {
              initialValues[v.name] = v.defaultValue;
          } else {
              initialValues[v.name] = ''; // Инициализируем пустой строкой, если нет дефолта
          }
      });
      return initialValues;
  });
  const [isValidDynamicJson, setIsValidDynamicJson] = useState(true); // Для редактора админа

  // Обновление данных предпросмотра Handlebars при изменении JSON строки
  useEffect(() => {
    try {
      setPreviewData(JSON.parse(previewDataString));
      setIsValidPreviewJson(true);
    } catch (error) {
      console.log(error)
      setIsValidPreviewJson(false);
    }
  }, [previewDataString]);

  // Обновление определений динамических переменных (и их значений по умолчанию) при изменении JSON строки админом
  useEffect(() => {
    if (!canEdit) return; // Обновляем определения только если админ редактирует
    try {
      const parsedDefinitions: DynamicVariable[] = JSON.parse(dynamicVariablesString);
      // TODO: Добавить более строгую валидацию схемы здесь, если нужно
      setDynamicVariableDefinitions(parsedDefinitions);
      setIsValidDynamicJson(true);

      // Обновляем значения по умолчанию в dynamicVariableValues, сохраняя введенные пользователем данные, если они есть
      setDynamicVariableValues(prevValues => {
          const newValues: Record<string, string> = {};
          parsedDefinitions.forEach(v => {
              // Если значение уже было введено пользователем, сохраняем его, иначе берем дефолт или пустую строку
              newValues[v.name] = prevValues[v.name] !== undefined ? prevValues[v.name] : (v.defaultValue ?? '');
          });
          return newValues;
      });

    } catch (error) {
      console.log(error)
      setIsValidDynamicJson(false);
    }
  }, [dynamicVariablesString, canEdit]);


  // Обработчики изменений для Monaco
  const handleTemplateChange = (value: string | undefined) => setTemplateContent(value ?? '');
  const handlePreviewDataChange = (value: string | undefined) => setPreviewDataString(value ?? '');
  const handleDynamicVariablesChange = (value: string | undefined) => setDynamicVariablesString(value ?? ''); // Для редактора админа

  // Обработчик для пользовательских полей ввода
  const handleDynamicValueChange = (name: string, value: string) => {
    setDynamicVariableValues(prev => ({ ...prev, [name]: value }));
  };

  // Настройка Server Action
  const updateTemplateWithId = updateTemplateAction.bind(null, initialTemplate.id);

  const [state, formAction] = useActionState(updateTemplateWithId, initialState);

    // <<< Для дублирования >>>
    // Привязываем ID оригинального шаблона и ID проекта
    const duplicateActionBound = duplicateTemplateAction.bind(
        null,
        initialTemplate.id,
        initialTemplate.project_id // Передаем project_id
    );
    // Используем отдельное состояние для формы дублирования
    const [duplicateState, duplicateFormAction] = useActionState(duplicateActionBound, initialActionState); // null как начальное состояние, т.к. оно не используется до вызова
  return (
    <div className="space-y-6">
      {!canEdit &&  "... сообщение о view-only ... " }

      {/* Форма для сохранения (только для админов) */}
      <form action={canEdit ? formAction : undefined} className="space-y-6">
        {canEdit && (
          <>
            <input type="hidden" name="templateContent" value={templateContent} />
            <input type="hidden" name="previewDataString" value={previewDataString} />
            <input type="hidden" name="dynamicVariablesString" value={dynamicVariablesString} /> {/* <<< Передаем определения */}
          </>
        )}

        {/* Основная сетка */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

          {/* Левая колонка: Редакторы */}
          <div className="space-y-4">
            <TemplateEditor value={templateContent} onChange={handleTemplateChange}  />
            <VariableInput value={previewDataString} onChange={handlePreviewDataChange} isValidJson={isValidPreviewJson}/>
            {/* Редактор определений динамических переменных (только для админов) */}
            {canEdit && (
                <DynamicVariableEditor
                    value={dynamicVariablesString}
                    onChange={handleDynamicVariablesChange}
                    isValidJson={isValidDynamicJson}
                />
            )}
          </div>

          {/* Правая колонка: Интерактив и Результаты */}
          <div className="space-y-4">
             {/* Поля для заполнения динамических переменных (для всех) */}
             <DynamicVariableInputs
                variables={dynamicVariableDefinitions}
                values={dynamicVariableValues}
                onChange={handleDynamicValueChange}
             />
             {/* Предпросмотр Handlebars */}
             <TemplatePreview
                templateContent={templateContent}
                previewData={previewData}
                isValidJson={isValidPreviewJson}
                variableValues={dynamicVariableValues}
             />
             {/* Финальный шаблон (для всех) */}
             <FinalTemplateOutput
                originalTemplate={templateContent}
                variableValues={dynamicVariableValues}
             />
          </div>
        </div>

        {/* Кнопка сохранения и сообщения */}
        <div className="mt-4 flex items-center space-x-4">
          <SubmitButton canEdit={canEdit} />
          {state?.message && "... отображение сообщений ..." }
        </div>
      </form>
       {/* <<< Новая форма ТОЛЬКО для кнопки ДУБЛИРОВАНИЯ >>> */}
            {canEdit && ( // Показываем форму дублирования только админам
                <form action={duplicateFormAction} className="mt-2">
                    <div className="flex items-center space-x-4">
                        <DuplicateButton canEdit={canEdit} />
                        {/* Сообщение об ошибке дублирования (сообщение об успехе не увидим из-за редиректа) */}
                        {duplicateState?.message && !duplicateState.success && (
                             <p className="text-sm text-red-600">
                                {duplicateState.message}
                             </p>
                        )}
                    </div>
                     <p className="text-xs text-gray-500 mt-1">
                        Creates a copy of this template in the same project and redirects you to the new copy.
                    </p>
                </form>
            )}
    </div>
  );
}
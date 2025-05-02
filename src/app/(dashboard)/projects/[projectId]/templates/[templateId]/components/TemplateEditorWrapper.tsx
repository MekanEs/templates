// src/app/(dashboard)/projects/[projectId]/templates/[templateId]/components/TemplateEditorWrapper.tsx
'use client';

import { useState, useEffect, useActionState } from 'react';
import { Template, DynamicVariable, JSONObject, Tag } from '@/types';
import TemplateEditor from './TemplateEditor';
import TestDataEditor from './TestDataEditor'; // Используем ваше имя компонента
import TemplatePreview from './TemplatePreview';
import DynamicVariableInputs from './DynamicVariableInputs';
import FinalTemplateOutput from './FinalTemplateOutput';
import { ActionState, duplicateTemplateAction, updateTemplateAction } from '@/lib/actions';
import { useFormStatus } from 'react-dom';
import DynamicVariableEditor from './DynamicVariableEditor';

// Стили для табов
const baseTabClass = 'tab button border rounded-md px-3 py-1.5 text-sm transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-400';
const activeTabClass = 'bg-blue-100 border-blue-300 text-blue-700 font-semibold dark:bg-blue-900 dark:border-blue-700 dark:text-blue-200';
const inactiveTabClass = 'bg-white border-gray-300 hover:bg-gray-100 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:hover:bg-gray-600 dark:text-gray-300';


interface TemplateEditorWrapperProps {
  initialTemplate: Template & { tags?: Tag[] }; // Ожидаем массив объектов Tag
  canEdit: boolean;
}
// Начальное состояние для Server Actions
const initialActionState: ActionState = { message: '', success: false };

// --- Компоненты кнопок (остаются без изменений) ---
function DuplicateButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className="px-3 py-2 text-sm font-medium text-center text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-gray-200 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600 dark:focus:ring-gray-600"
      disabled={pending}
    >
      {pending ? 'Duplicating...' : 'Duplicate'}
    </button>
  );
}

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className="px-3 py-2 text-sm font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
      disabled={pending}
    >
      {pending ? 'Saving...' : 'Save Changes'}
    </button>
  );
}

// --- Основной компонент ---
export default function TemplateEditorWrapper({ initialTemplate, canEdit }: TemplateEditorWrapperProps) {
  // Состояния для редакторов и данных
  const [templateContent, setTemplateContent] = useState(initialTemplate.content ?? '');
  const [previewDataString, setPreviewDataString] = useState(
    JSON.stringify(initialTemplate.preview_data ?? {}, null, 2)
  );
  const [tagsString, setTagsString] = useState( // <<< Стейт для тегов
    initialTemplate.tags?.map(tag => tag.name).join(', ') ?? ''
  );
  const [dynamicVariablesString, setDynamicVariablesString] = useState(
    JSON.stringify(initialTemplate.dynamic_variables ?? [], null, 2)
  );

  // Состояния для UI (табы)
  const [activeTabRight, setActiveTabRight] = useState('preview'); // Табы справа
  const [activeTabLeft, setActiveTabLeft] = useState('template'); // Табы слева

  // Состояния для валидации и данных
  const [previewData, setPreviewData] = useState<JSONObject>(initialTemplate.preview_data ?? {});
  const [isValidPreviewJson, setIsValidPreviewJson] = useState(true);
  const [dynamicVariableDefinitions, setDynamicVariableDefinitions] = useState<DynamicVariable[]>(initialTemplate.dynamic_variables ?? []);
  const [dynamicVariableValues, setDynamicVariableValues] = useState<Record<string, string>>(() => {
    const initialValues: Record<string, string> = {};
    (initialTemplate.dynamic_variables ?? []).forEach(v => {
      initialValues[v.name] = v.defaultValue ?? '';
    });
    return initialValues;
  });
  const [isValidDynamicJson, setIsValidDynamicJson] = useState(true);

  // Настройка Server Actions
  const updateTemplateWithId = updateTemplateAction.bind(null, initialTemplate.id);
  const [state, formAction] = useActionState(updateTemplateWithId, initialActionState);

  const duplicateActionBound = duplicateTemplateAction.bind(null, initialTemplate.id, initialTemplate.project_id);
  const [duplicateState, duplicateFormAction] = useActionState(duplicateActionBound, initialActionState);

  // Эффекты для обновления данных из строк JSON
  useEffect(() => {
    try {
      setPreviewData(JSON.parse(previewDataString));
      setIsValidPreviewJson(true);
    } catch (error) { 
      console.error('Error parsing preview data:', error);
      setIsValidPreviewJson(false);
    }
  }, [previewDataString]);

  useEffect(() => {
    if (!canEdit) return;
    try {
      const parsedDefinitions: DynamicVariable[] = JSON.parse(dynamicVariablesString);
      setDynamicVariableDefinitions(parsedDefinitions);
      setIsValidDynamicJson(true);
      setDynamicVariableValues(prevValues => {
        const newValues: Record<string, string> = {};
        parsedDefinitions.forEach(v => {
          newValues[v.name] = prevValues[v.name] !== undefined ? prevValues[v.name] : (v.defaultValue ?? '');
        });
        return newValues;
      });
    } catch (error) {
      console.error('Error parsing dynamic variables:', error);
      setIsValidDynamicJson(false);
    }
  }, [dynamicVariablesString, canEdit]);

  // Эффект для отображения сообщения об успехе
   const [showSuccessMessage, setShowSuccessMessage] = useState(false);
   useEffect(() => {
       if (state?.success && state.message) {
           setShowSuccessMessage(true);
           const timer = setTimeout(() => {
               setShowSuccessMessage(false);
           }, 3000);
           return () => clearTimeout(timer);
       }
   }, [state]);

  // Обработчики изменений Monaco
  const handleTemplateChange = (value: string | undefined) => setTemplateContent(value ?? '');
  const handlePreviewDataChange = (value: string | undefined) => setPreviewDataString(value ?? '');
  const handleDynamicVariablesChange = (value: string | undefined) => setDynamicVariablesString(value ?? '');

  // Обработчик изменений для дин. полей ввода
  const handleDynamicValueChange = (name: string, value: string) => {
    setDynamicVariableValues(prev => ({ ...prev, [name]: value }));
  };

  return (
    // Используем контейнер здесь для правильной работы липкого хедера
    <div className="container mx-auto px-4 pb-12">
        {/* Липкий Хедер */}
        <div className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-900 py-3 border-b border-gray-200 dark:border-gray-700 -mx-4 px-4 mb-6 shadow-sm">
            <div className="container mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white truncate" title={initialTemplate.name}>
                   {initialTemplate.name}
                </h1>
                {canEdit && (
                    <div className="flex gap-2 flex-shrink-0">
                        <form action={duplicateFormAction}>
                            <DuplicateButton />
                        </form>
                        <form action={formAction}>
                            <input type="hidden" name="templateContent" value={templateContent} />
                            <input type="hidden" name="previewDataString" value={previewDataString} />
                            <input type="hidden" name="dynamicVariablesString" value={dynamicVariablesString} />
                            <input type="hidden" name="tags" value={tagsString} /> {/* <<< Передаем теги */}
                            <SaveButton />
                        </form>
                    </div>
                )}
            </div>
        </div>

        {/* Сообщения пользователю */}
        {!canEdit && <p className="mb-4 p-3 text-sm text-yellow-700 bg-yellow-100 rounded-lg border border-yellow-300 dark:bg-opacity-20 dark:text-yellow-300 dark:border-yellow-600" role="alert">View-only mode. You cannot save changes.</p>}
        {showSuccessMessage && state?.success && state.message && (
            <div className="mb-4 p-3 text-sm text-green-700 bg-green-100 rounded-lg border border-green-300 dark:bg-opacity-20 dark:text-green-300 dark:border-green-600" role="alert">
                <span className="font-medium">Success:</span> {state.message}
            </div>
        )}
        {state && !state.success && state.message && (
            <div className="mb-4 p-3 text-sm text-red-700 bg-red-100 rounded-lg border border-red-300 dark:bg-opacity-20 dark:text-red-300 dark:border-red-600" role="alert">
                <span className="font-medium">Error:</span> {state.message}
            </div>
        )}
        {duplicateState && !duplicateState.success && duplicateState.message && (
            <div className="mb-4 p-3 text-sm text-red-700 bg-red-100 rounded-lg border border-red-300 dark:bg-opacity-20 dark:text-red-300 dark:border-red-600" role="alert">
                <span className="font-medium">Duplicate Error:</span> {duplicateState.message}
            </div>
        )}

        {/* Основная сетка */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Левая Колонка: Табы Редакторов */}
            <div className="space-y-4">
                <div className='tabs flex flex-wrap gap-2'> {/* flex-wrap для переноса на маленьких экранах */}
                    <button
                        className={`${baseTabClass} ${activeTabLeft === 'template' ? activeTabClass : inactiveTabClass}`}
                        onClick={() => setActiveTabLeft('template')}
                    >
                        Template
                    </button>
                    <button
                        className={`${baseTabClass} ${activeTabLeft === 'testData' ? activeTabClass : inactiveTabClass}`}
                        onClick={() => setActiveTabLeft('testData')}
                    >
                        Test Data
                    </button>
                     {/* <<< Таб для тегов >>> */}
                    <button
                        className={`${baseTabClass} ${activeTabLeft === 'tags' ? activeTabClass : inactiveTabClass}`}
                        onClick={() => setActiveTabLeft('tags')}
                    >
                        Tags
                    </button>
                    {canEdit && (
                    <button
                        className={`${baseTabClass} ${activeTabLeft === 'dynamicDefs' ? activeTabClass : inactiveTabClass}`}
                        onClick={() => setActiveTabLeft('dynamicDefs')}
                    >
                        Dynamic Vars Defs
                    </button>
                    )}
                </div>

                {/* Контент левых табов */}
                <div className='p-4 border rounded-lg bg-white shadow-sm dark:bg-gray-800 dark:border-gray-700 min-h-[400px]'> {/* Общая рамка для контента табов */}
                    {activeTabLeft === 'template' && (
                        <TemplateEditor value={templateContent} onChange={handleTemplateChange} />
                    )}
                    {activeTabLeft === 'testData' && (
                        <TestDataEditor value={previewDataString} onChange={handlePreviewDataChange} isValidJson={isValidPreviewJson} />
                    )}
                     {/* <<< Поле ввода тегов >>> */}
                    {activeTabLeft === 'tags' && (
                         <div>
                            <label htmlFor="templateTags" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Tags (comma-separated)
                            </label>
                            <input
                                type="text"
                                id="templateTags"
                                name="tagsInput" // Имя для input, значение передается через hidden input в форме
                                value={tagsString}
                                onChange={(e) => setTagsString(e.target.value)}
                                placeholder="email, promotion, welcome"
                                disabled={!canEdit} // Отключаем для view-only
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:disabled:bg-gray-600 dark:placeholder-gray-400"
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Enter comma-separated tags. They will be saved in lowercase.
                            </p>
                        </div>
                    )}
                    {activeTabLeft === 'dynamicDefs' && canEdit && (
                        <DynamicVariableEditor
                            value={dynamicVariablesString}
                            onChange={handleDynamicVariablesChange}
                            isValidJson={isValidDynamicJson}
                        />
                    )}
                 </div>
            </div>

            {/* Правая Колонка: Табы Интерактива/Вывода */}
            <div className="space-y-4">
                <div className='tabs flex flex-wrap gap-2'>
                    <button
                        className={`${baseTabClass} ${activeTabRight === 'preview' ? activeTabClass : inactiveTabClass}`}
                        onClick={() => setActiveTabRight('preview')}
                    >
                        Preview
                    </button>
                    <button
                        className={`${baseTabClass} ${activeTabRight === 'final' ? activeTabClass : inactiveTabClass}`}
                        onClick={() => setActiveTabRight('final')}
                    >
                        Final Output
                    </button>
                     {/* <<< Таб для дин. инпутов >>> */}
                    <button
                        className={`${baseTabClass} ${activeTabRight === 'dynamicInputs' ? activeTabClass : inactiveTabClass}`}
                        onClick={() => setActiveTabRight('dynamicInputs')}
                         hidden={dynamicVariableDefinitions.length === 0} // Скрываем таб, если нет определений
                    >
                        Dynamic Inputs
                    </button>
                </div>

                {/* Контент правых табов */}
                 <div className='p-4 border rounded-lg bg-white shadow-sm dark:bg-gray-800 dark:border-gray-700 min-h-[400px]'> {/* Общая рамка */}
                    {activeTabRight === 'preview' && (
                        <TemplatePreview
                            templateContent={templateContent}
                            previewData={previewData}
                            isValidJson={isValidPreviewJson}
                            variableValues={dynamicVariableValues}
                        />
                    )}
                    {activeTabRight === 'final' && (
                        <FinalTemplateOutput
                            originalTemplate={templateContent}
                            variableValues={dynamicVariableValues}
                        />
                    )}
                    {activeTabRight === 'dynamicInputs' && dynamicVariableDefinitions.length > 0 && (
                        <DynamicVariableInputs
                            variables={dynamicVariableDefinitions}
                            values={dynamicVariableValues}
                            onChange={handleDynamicValueChange}
                        />
                    )}
                 </div>
            </div>
        </div>
    </div>
  );
}
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
import { useFormStatus } from 'react-dom';
import DynamicVariableEditor from './DynamicVariableEditor';

interface TemplateEditorWrapperProps {
  initialTemplate: Template;
  canEdit: boolean;
}
// Начальное состояние для обеих форм
const initialActionState: ActionState = { message: '', success: false };

const initialState = { message: '', success: false };

// Component to render the duplicate button, including status handling
function DuplicateButton() {
    const { pending } = useFormStatus();
    return (
        <button
            type="submit"
            className="px-3 py-2 text-sm font-medium text-center text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={pending} // Disable based on form status
        >
            {pending ? 'Duplicating...' : 'Duplicate'}
        </button>
    );
}

// Component to render the save button, including status handling
function SaveButton() {
    const { pending } = useFormStatus();
    return (
        <button
            type="submit"
            className="px-3 py-2 text-sm font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={pending} // Disable based on form status
        >
            {pending ? 'Saving...' : 'Save Changes'}
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
  const [activeTab, setActiveTab] = useState('preview');
  const [firstActiveTab, setFirstActiveTab] = useState('template');
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
      {!canEdit && <p className="text-sm text-yellow-600">View-only mode. You do not have permissions to edit this template.</p> }

      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-semibold">Edit Template: {initialTemplate.name}</h2>
        {canEdit && (
          <div className="flex gap-2">
            {/* Duplicate Button Form */}
            <form action={duplicateFormAction}>
              {/* Button component now handles its own pending state */}
              <DuplicateButton />
            </form>
            {/* Save Button Form */}
            <form action={formAction}>
              {/* Hidden inputs to ensure latest state is submitted */}
              <input type="hidden" name="templateContent" value={templateContent} />
              <input type="hidden" name="previewDataString" value={previewDataString} />
              <input type="hidden" name="dynamicVariablesString" value={dynamicVariablesString} />
              {/* Button component now handles its own pending state */}
              <SaveButton />
            </form>
          </div>
        )}
      </div>

      {/* Display Server Action Error Messages */}
      {state && !state.success && state.message && (
         <div className="p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50" role="alert">
            <span className="font-medium">Error:</span> {state.message}
         </div>
      )}
       {/* Display Duplicate Action Error Messages */}
      {duplicateState && !duplicateState.success && duplicateState.message && (
         <div className="p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50" role="alert">
            <span className="font-medium">Duplicate Error:</span> {duplicateState.message}
         </div>
      )}

      {/* Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Editors */}
        <div className="space-y-4">
          <div className='tabs flex gap-2'>
            <button className='tab button border border-gray-300 rounded-md px-2 py-1' onClick={() => setFirstActiveTab('template')}>
              TemplateEditor
            </button>
            <button className='tab button border border-gray-300 rounded-md px-2 py-1' onClick={() => setFirstActiveTab('variable')}>
              VariableInput
            </button>
            {canEdit && (
            <button className='tab button border border-gray-300 rounded-md px-2 py-1' onClick={() => setFirstActiveTab('dynamic')}>
              DynamicVariableEditor
            </button>
            )}
          </div>

          <div>
          {firstActiveTab === 'template' && (
            <TemplateEditor value={templateContent} onChange={handleTemplateChange} />
          )}
          {firstActiveTab === 'variable' && (
            <VariableInput value={previewDataString} onChange={handlePreviewDataChange} isValidJson={isValidPreviewJson}/>
          )}
          {firstActiveTab === 'dynamic' && canEdit && (
                <DynamicVariableEditor
                    value={dynamicVariablesString}
                    onChange={handleDynamicVariablesChange}
                    isValidJson={isValidDynamicJson}
                />
            )}</div>
            
          
        </div>

        {/* Right Column: Interactive Inputs & Outputs */}
        <div className="space-y-4">
            {/* Поля для заполнения динамических переменных (для всех) */}
            <DynamicVariableInputs
                variables={dynamicVariableDefinitions}
                values={dynamicVariableValues}
                onChange={handleDynamicValueChange}
            />
        <div className='tabs flex gap-2'>
          <button className='tab button border border-gray-300 rounded-md px-2 py-1' onClick={() => setActiveTab('preview')}>
            Preview
          </button>
          <button className='tab button border border-gray-300 rounded-md px-2 py-1' onClick={() => setActiveTab('final')}>
            TemplateOutput
          </button>

        </div>
        <div>
        {activeTab === 'preview' && (
          <TemplatePreview
            templateContent={templateContent}
            previewData={previewData}
            isValidJson={isValidPreviewJson}
            variableValues={dynamicVariableValues}
          />
        )}
        {activeTab === 'final' && (
          <FinalTemplateOutput
            originalTemplate={templateContent}
            variableValues={dynamicVariableValues}
          />
        )}
        </div>
           
        </div>
      </div>
    </div>
  );
}
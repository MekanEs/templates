// src/app/(dashboard)/projects/[projectId]/templates/[templateId]/components/TemplateEditor.tsx
'use client';
import Editor, { OnChange } from '@monaco-editor/react';

interface TemplateEditorProps {
  value: string;
  onChange: OnChange; // Используем тип OnChange из @monaco-editor/react
}

export default function TemplateEditor({ value, onChange,  }: TemplateEditorProps) {
  return (
    <div className='h-full'>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Handlebars Template Content (HTML Mode)
      </label>
      <div className="border rounded overflow-hidden h-[calc(100vh-200px)]"> {/* Обертка для рамки */}
        <Editor
          height="100%" // Задаем высоту
         
          language="html" // Используем режим HTML для подсветки Handlebars
          theme="vs-light" // Тема (vs-dark или своя)
          value={value}
          onChange={onChange}
          options={{
            minimap: { enabled: false }, // Отключаем миникарту
            wordWrap: 'on', // Включаем перенос строк
            fontSize: 14,
            scrollBeyondLastLine: false,
          }}
        />
      </div>
    </div>
  );
}
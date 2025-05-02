// src/app/(dashboard)/projects/[projectId]/templates/[templateId]/components/TestDataEditor.tsx
'use client';
import Editor, { OnChange } from '@monaco-editor/react';

interface TestDataEditorProps {
  value: string; // JSON строка
  onChange: OnChange;
  isValidJson: boolean;
}

export default function TestDataEditor({ value, onChange, isValidJson,  }: TestDataEditorProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Preview Data (JSON format)
      </label>
      <div className={`h-[calc(100vh-200px)] border rounded overflow-hidden ${!isValidJson ? 'border-red-500' : ''}`}>
        <Editor
          height="100%" // Высота поменьше для JSON
          language="json" // Режим JSON
          theme="vs-light"
          value={value}
          onChange={onChange}
          options={{
            minimap: { enabled: false },
            wordWrap: 'on',
            fontSize: 14,
            scrollBeyondLastLine: false,
            // Автоформатирование при вставке/вводе для JSON (опционально)
            formatOnPaste: true,
            formatOnType: true,
          }}
          // Можно добавить маркеры ошибок, если JSON невалидный
          // onValidate={(markers) => { ... }}
        />
      </div>
      {!isValidJson && (
        <p className="text-red-600 text-sm mt-1">Invalid JSON format.</p>
      )}
      <p className="text-xs text-gray-500 mt-1">
        Enter test data as a JSON object for previewing.
      </p>
    </div>
  );
}
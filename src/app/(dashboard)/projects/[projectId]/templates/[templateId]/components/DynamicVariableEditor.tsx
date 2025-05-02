// src/app/(dashboard)/projects/[projectId]/templates/[templateId]/components/DynamicVariableEditor.tsx
'use client';
import Editor, { OnChange } from '@monaco-editor/react';

interface DynamicVariableEditorProps {
  value: string; // JSON строка определений
  onChange: OnChange;
  isValidJson: boolean;
}

const exampleJson = `[
  {
    "name": "USER_NAME",
    "label": "User Name",
    "type": "text",
    "defaultValue": "Guest"
  },
  {
    "name": "EXPIRY_DATE",
    "label": "Expiry Date",
    "type": "date"
  }
]`;

export default function DynamicVariableEditor({ value, onChange, isValidJson }: DynamicVariableEditorProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Dynamic Variable Definitions (JSON format for Admins)
      </label>
      <div className={`h-[calc(100vh-200px)] border rounded overflow-hidden ${!isValidJson ? 'border-red-500' : ''}`}>
        <Editor
          height="100%"
          language="json"
          theme="vs-light"
          value={value}
          onChange={onChange}
          options={{
            minimap: { enabled: false },
            wordWrap: 'on',
            fontSize: 14,
            scrollBeyondLastLine: false,
            formatOnPaste: true,
            formatOnType: true,
          }}
        />
      </div>
      {!isValidJson && (
        <p className="text-red-600 text-sm mt-1">Invalid JSON format or structure.</p>
      )}
      <p className="text-xs text-gray-500 mt-1">
        Define variables here. Use <code className="bg-gray-200 px-1 rounded">__VARIABLE_NAME__</code> in the template above.
        Example format: <button onClick={() => navigator.clipboard.writeText(exampleJson)} className="text-blue-500 underline text-xs">Copy Example</button>
      </p>
    </div>
  );
}
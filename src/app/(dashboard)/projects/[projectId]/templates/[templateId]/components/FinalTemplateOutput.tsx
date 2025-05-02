// src/app/(dashboard)/projects/[projectId]/templates/[templateId]/components/FinalTemplateOutput.tsx
'use client';

import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react'; // Используем Monaco для отображения
import { replacePlaceholders } from '@/lib/replaceHolders';

interface FinalTemplateOutputProps {
  originalTemplate: string;
  variableValues: Record<string, string>; // Значения, введенные пользователем
}

// Функция для замены плейсхолдеров


export default function FinalTemplateOutput({ originalTemplate, variableValues }: FinalTemplateOutputProps) {
  const [finalTemplate, setFinalTemplate] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const generated = replacePlaceholders(originalTemplate, variableValues);
    setFinalTemplate(generated);
  }, [originalTemplate, variableValues]); // Пересчитываем при изменении оригинала или значений

  const handleCopy = () => {
    navigator.clipboard.writeText(finalTemplate).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Сбросить статус "скопировано" через 2 сек
    });
  };

  return (
    <div className="mt-6">
      <div className="flex justify-between items-center mb-1">
        <h3 className="text-lg font-semibold">Final Ready-to-Use Template</h3>
        <button
          onClick={handleCopy}
          className={`px-3 py-1 text-sm rounded ${
            copied
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
          }`}
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <div className="border rounded overflow-hidden">
        <Editor
          height="300px"
          language="html" // Отображаем как HTML (т.к. это все еще Handlebars)
          theme="vs-light"
          value={finalTemplate}
          options={{
            readOnly: true, // Только для чтения
            minimap: { enabled: false },
            wordWrap: 'on',
            fontSize: 14,
            scrollBeyondLastLine: false,
          }}
        />
      </div>
      <p className="text-xs text-gray-500 mt-1">
        This is the final template with placeholders like ___VARIABLE_NAME___ replaced by the values you entered above.
      </p>
    </div>
  );
}
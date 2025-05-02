// src/app/(dashboard)/projects/[projectId]/templates/[templateId]/components/DynamicVariableInputs.tsx
'use client';

import { DynamicVariable } from '@/types';

interface DynamicVariableInputsProps {
  variables: DynamicVariable[]; // Определения переменных из БД
  values: Record<string, string>; // Текущие значения из state родителя
  onChange: (name: string, value: string) => void; // Функция для обновления state родителя
}

export default function DynamicVariableInputs({ variables, values, onChange,  }: DynamicVariableInputsProps) {
  if (!variables || variables.length === 0) {
    return null; // Не рендерим ничего, если переменных нет
  }

  return (
    <div className="p-4 border rounded bg-gray-50">
      <h3 className="text-lg font-semibold mb-3">Fill Placeholders</h3>
      <div className={`space-y-3`}>
        {variables.map((variable) => (
          <div key={variable.name}>
            <label htmlFor={`dyn-var-${variable.name}`} className="block text-sm font-medium text-gray-700 mb-1">
              {variable.label} <span className="text-xs text-gray-500">(__{variable.name}__)</span>
            </label>
            {variable.type === 'textarea' ? (
              <textarea
                id={`dyn-var-${variable.name}`}
                rows={3}
                className="w-full p-2 border rounded shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                value={values[variable.name] || ''}
                onChange={(e) => onChange(variable.name, e.target.value)}
              />
            ) : (
              <input
                id={`dyn-var-${variable.name}`}
                type={variable.type} // Используем тип из определения
                className="w-full p-2 border rounded shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                value={values[variable.name] || ''}
                onChange={(e) => onChange(variable.name, e.target.value)}
              />
            )}
          </div>
        ))}
      </div>
       <p className="text-xs text-gray-500 mt-3">
        Fill in these fields to generate the final template below. These values are not saved.
      </p>
    </div>
  );
}
// src/types/index.ts
export interface Project {
  id: string;
  name: string;
  description?: string | null;
  created_at: string;
}

export interface Template {
  id: string;
  project_id: string;
  name: string;
  content?: string | null; // Handlebars code
  preview_data?: JSONObject | null; // JSON data for preview
  created_at: string;
  updated_at: string;
}
type JSONValue = string | number | boolean | JSONObject | JSONArray;

export interface JSONObject {
  [x: string]: JSONValue;
}
type JSONArray = Array<JSONValue>;

// Определение для одной динамической переменной
export interface DynamicVariable {
  name: string;       // Уникальное имя (используется в плейсхолдере __NAME__)
  label: string;      // Метка для поля ввода
  type: 'text' | 'date' | 'number' | 'textarea'; // Тип поля ввода
  defaultValue?: string; // Значение по умолчанию
}

export interface Template {
  id: string;
  project_id: string;
  name: string;
  content?: string | null;
  preview_data?: JSONObject | null;
  dynamic_variables?: DynamicVariable[] | null; // <<< Наше новое поле
  created_at: string;
  updated_at: string;
}
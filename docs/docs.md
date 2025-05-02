Отличная идея для проекта! Создание базы шаблонов Handlebars с предпросмотром и динамическими переменными для теста — полезный инструмент.

Поскольку я не могу напрямую сгенерировать и передать вам файлы целого проекта, я предоставлю вам подробную структуру проекта, ключевые фрагменты кода, шаги по настройке и объяснения, как реализовать основные функции.

**Уточняющие вопросы (на которые я сделаю предположения, если вы не ответите):**

1.  **UI-библиотека:** Вы хотите использовать какую-либо UI-библиотеку (например, Tailwind CSS, Material UI, Shadcn/ui) или предпочитаете чистый CSS/CSS-модули? (Я буду использовать Tailwind CSS для примера, так как он популярен с Next.js).
2.  **Аутентификация:** Нужна ли система входа для пользователей, чтобы только определенные пользователи могли добавлять/редактировать шаблоны и проекты? (Я предположу, что пока нет, но это можно добавить).
3.  **Редактор кода:** Какой редактор вы бы предпочли для ввода Handlebars кода? (Например, простой `<textarea>` или более продвинутый вроде Monaco Editor или CodeMirror?). Я начну с `<textarea>`, но упомяну про альтернативы.

**План генерации:**

1.  **Настройка проекта Next.js.**
2.  **Интеграция с Supabase.**
3.  **Структура базы данных Supabase.**
4.  **Структура папок и файлов проекта.**
5.  **Реализация ключевых функций:**
    *   Отображение проектов.
    *   Отображение шаблонов внутри проекта.
    *   Просмотр/редактирование шаблона.
    *   Добавление тестовых переменных (не Handlebars синтаксиса).
    *   Предпросмотр шаблона с тестовыми данными.
    *   Сохранение шаблона (как валидного Handlebars).

---

**1. Настройка проекта Next.js**

Откройте терминал и выполните команду:

```bash
npx create-next-app@latest handlebars-template-manager --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd handlebars-template-manager
```

Эта команда создаст новый проект Next.js с TypeScript, Tailwind CSS, ESLint, используя App Router и директорию `src`.

**Установка дополнительных зависимостей:**

```bash
npm install @supabase/ssr @supabase/supabase-js handlebars
# или
yarn add @supabase/ssr @supabase/supabase-js handlebars
```

*   `@supabase/ssr`: Для интеграции Supabase с Next.js (работает и на сервере, и на клиенте).
*   `@supabase/supabase-js`: Основной клиент Supabase (хотя `@supabase/ssr` предпочтительнее для Next.js).
*   `handlebars`: Для компиляции и рендеринга Handlebars шаблонов на стороне клиента или сервера для предпросмотра.

---

**2. Интеграция с Supabase**

1.  Зарегистрируйтесь или войдите в [Supabase](https://supabase.com/).
2.  Создайте новый проект.
3.  Перейдите в "Project Settings" -> "API".
4.  Скопируйте "Project URL" и "Service Role Key" (или "anon public" key, если будете использовать RLS - Row Level Security). **Service Role Key** дает полный доступ, используйте его осторожно, лучше настроить RLS и использовать **anon public** key. Для простоты примера начнем с Service Role Key, но **не храните его в коде на клиенте!** Для безопасной работы с SSR лучше использовать `anon public` key.
5.  Создайте файл `.env.local` в корне вашего проекта и добавьте ключи:

    ```.env.local
    NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
    NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
    # Если используете Service Role Key (НЕ РЕКОМЕНДУЕТСЯ для клиентского кода или небезопасных серверных операций)
    # SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
    ```

6.  **Настройте Supabase Client (SSR-friendly):**
    Создайте файл `src/lib/supabase/client.ts` (для использования в Client Components):

    ```typescript
    // src/lib/supabase/client.ts
    import { createBrowserClient } from '@supabase/ssr'

    export function createClient() {
      // Create a supabase client on the browser with project's credentials
      return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
    }
    ```

    Создайте файл `src/lib/supabase/server.ts` (для использования в Server Components, Route Handlers, Server Actions):

    ```typescript
    // src/lib/supabase/server.ts
    import { createServerClient, type CookieOptions } from '@supabase/ssr'
    import { cookies } from 'next/headers'

    export function createClient() {
      const cookieStore = cookies()

      // Create a server's supabase client with cookies
      return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get(name: string) {
              return cookieStore.get(name)?.value
            },
            set(name: string, value: string, options: CookieOptions) {
              try {
                cookieStore.set({ name, value, ...options })
              } catch (error) {
                // The `set` method was called from a Server Component.
                // This can be ignored if you have middleware refreshing
                // user sessions.
              }
            },
            remove(name: string, options: CookieOptions) {
              try {
                cookieStore.set({ name, value: '', ...options })
              } catch (error) {
                // The `delete` method was called from a Server Component.
                // This can be ignored if you have middleware refreshing
                // user sessions.
              }
            },
          },
        }
      )
    }
    ```
    *Примечание:* Для полной работы аутентификации с SSR может потребоваться Middleware (`src/middleware.ts`). Пока мы не реализуем аутентификацию, это не критично.

---

**3. Структура базы данных Supabase**

В редакторе SQL вашего проекта Supabase выполните следующие команды для создания таблиц:

```sql
-- Таблица для проектов
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Таблица для шаблонов
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE, -- Связь с проектом, удаление каскадом
  name TEXT NOT NULL,
  content TEXT, -- Здесь будет храниться Handlebars код
  preview_data JSONB, -- Здесь будут храниться тестовые данные в формате JSON
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Политики RLS (Row Level Security) - ОЧЕНЬ ВАЖНО для безопасности, если используете anon key
-- Пока отключим RLS для простоты, но в реальном проекте ОБЯЗАТЕЛЬНО настройте!
-- ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

-- Пример политики (разрешить всем читать):
-- CREATE POLICY "Allow public read access" ON projects FOR SELECT USING (true);
-- CREATE POLICY "Allow public read access" ON templates FOR SELECT USING (true);
-- Нужны будут политики для INSERT, UPDATE, DELETE, если будет аутентификация

-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггер для таблицы templates
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON templates
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

```

---

**4. Структура папок и файлов проекта**

```
handlebars-template-manager/
├── src/
│   ├── app/
│   │   ├── (dashboard)/             # Группа роутов для основной части приложения
│   │   │   ├── projects/
│   │   │   │   ├── page.tsx         # Страница со списком проектов
│   │   │   │   └── [projectId]/
│   │   │   │       ├── templates/
│   │   │   │       │   ├── [templateId]/
│   │   │   │       │   │   ├── page.tsx      # Страница просмотра/редактирования шаблона
│   │   │   │       │   │   └── components/   # Компоненты для страницы шаблона
│   │   │   │       │   │       ├── TemplateEditor.tsx
│   │   │   │       │   │       ├── VariableInput.tsx
│   │   │   │       │   │       └── TemplatePreview.tsx
│   │   │   │       │   └── page.tsx         # Страница со списком шаблонов проекта
│   │   │   │       └── layout.tsx       # Макет для страниц внутри проекта (если нужно)
│   │   │   ├── layout.tsx           # Общий макет для панели управления
│   │   │   └── page.tsx             # Главная страница панели (может редиректить на /projects)
│   │   ├── api/                     # API роуты (если нужны, альтернатива - Server Actions)
│   │   ├── layout.tsx               # Корневой макет
│   │   └── page.tsx                 # Главная страница сайта (может быть лендингом или редиректом)
│   ├── components/                  # Общие UI компоненты (Button, Input, Card, etc.)
│   │   └── ui/                      # Компоненты из shadcn/ui (если используете)
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts            # Клиент Supabase для Client Components
│   │   │   └── server.ts            # Клиент Supabase для Server Components / Actions
│   │   ├── actions.ts               # Server Actions (для CUD операций)
│   │   ├── handlebars.ts          # Утилиты для работы с Handlebars
│   │   └── utils.ts                 # Другие утилиты
│   ├── types/                       # TypeScript типы
│   │   └── index.ts                 # Определения типов (Project, Template)
│   ├── styles/
│   │   └── globals.css
│   └── middleware.ts                # Middleware (для обновления сессии Supabase и защиты роутов)
├── .env.local
├── next.config.js
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

---

**5. Реализация ключевых функций**

**Типы (src/types/index.ts):**

```typescript
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
  preview_data?: Record<string, any> | null; // JSON data for preview
  created_at: string;
  updated_at: string;
}
```

**Получение списка проектов (Server Component - src/app/(dashboard)/projects/page.tsx):**

```typescript
// src/app/(dashboard)/projects/page.tsx
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Project } from '@/types'; // Импортируем тип

export default async function ProjectsPage() {
  const supabase = createClient();
  const { data: projects, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching projects:', error);
    // Можно показать сообщение об ошибке пользователю
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Projects</h1>
      {/* Здесь можно добавить кнопку/форму для создания нового проекта */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects && projects.length > 0 ? (
          (projects as Project[]).map((project) => ( // Применяем тип
            <Link
              href={`/projects/${project.id}/templates`}
              key={project.id}
              className="block p-4 border rounded hover:shadow-lg transition-shadow"
            >
              <h2 className="text-xl font-semibold">{project.name}</h2>
              <p className="text-gray-600">{project.description}</p>
              <p className="text-sm text-gray-400 mt-2">
                Created: {new Date(project.created_at).toLocaleDateString()}
              </p>
            </Link>
          ))
        ) : (
          <p>No projects found.</p>
        )}
      </div>
    </div>
  );
}
```

**Получение списка шаблонов проекта (Server Component - src/app/(dashboard)/projects/[projectId]/templates/page.tsx):**

```typescript
// src/app/(dashboard)/projects/[projectId]/templates/page.tsx
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Template } from '@/types'; // Импортируем тип

interface TemplatesPageProps {
  params: { projectId: string };
}

export default async function TemplatesPage({ params }: TemplatesPageProps) {
  const supabase = createClient();
  const { projectId } = params;

  // Получаем информацию о проекте (опционально, для заголовка)
  const { data: projectData, error: projectError } = await supabase
    .from('projects')
    .select('name')
    .eq('id', projectId)
    .single();

  // Получаем шаблоны для этого проекта
  const { data: templates, error: templatesError } = await supabase
    .from('templates')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (projectError || templatesError) {
    console.error('Error fetching data:', projectError || templatesError);
    // Обработка ошибок
  }

  return (
    <div className="container mx-auto p-4">
      <Link href="/projects" className="text-blue-500 hover:underline mb-4 block">&larr; Back to Projects</Link>
      <h1 className="text-2xl font-bold mb-4">
        Templates for: {projectData?.name ?? 'Project'}
      </h1>
       {/* Здесь можно добавить кнопку/форму для создания нового шаблона */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates && templates.length > 0 ? (
          (templates as Template[]).map((template) => ( // Применяем тип
            <Link
              href={`/projects/${projectId}/templates/${template.id}`}
              key={template.id}
              className="block p-4 border rounded hover:shadow-lg transition-shadow"
            >
              <h2 className="text-xl font-semibold">{template.name}</h2>
              <p className="text-sm text-gray-400 mt-2">
                Updated: {new Date(template.updated_at).toLocaleString()}
              </p>
            </Link>
          ))
        ) : (
          <p>No templates found for this project.</p>
        )}
      </div>
    </div>
  );
}
```

**Страница редактирования/просмотра шаблона (src/app/(dashboard)/projects/[projectId]/templates/[templateId]/page.tsx):**

Эта страница будет содержать клиентские компоненты для интерактивности.

```typescript
// src/app/(dashboard)/projects/[projectId]/templates/[templateId]/page.tsx
import { createClient } from '@/lib/supabase/server';
import { Template } from '@/types';
import TemplateEditorWrapper from './components/TemplateEditorWrapper'; // Создадим этот компонент
import Link from 'next/link';

interface TemplateDetailPageProps {
  params: { projectId: string; templateId: string };
}

export default async function TemplateDetailPage({ params }: TemplateDetailPageProps) {
  const supabase = createClient();
  const { projectId, templateId } = params;

  const { data: template, error } = await supabase
    .from('templates')
    .select('*')
    .eq('id', templateId)
    .single();

  if (error || !template) {
    console.error('Error fetching template:', error);
    return <p>Template not found or error loading.</p>; // Или страница 404
  }

  return (
    <div className="container mx-auto p-4">
       <Link href={`/projects/${projectId}/templates`} className="text-blue-500 hover:underline mb-4 block">&larr; Back to Templates</Link>
      <h1 className="text-2xl font-bold mb-4">Edit Template: {template.name}</h1>
      {/* Передаем данные шаблона в клиентский компонент-обертку */}
      <TemplateEditorWrapper initialTemplate={template as Template} />
    </div>
  );
}
```

**Клиентский компонент-обертка (src/app/(dashboard)/projects/[projectId]/templates/[templateId]/components/TemplateEditorWrapper.tsx):**

Этот компонент будет управлять состоянием редактора, переменных и предпросмотра.

```typescript
// src/app/(dashboard)/projects/[projectId]/templates/[templateId]/components/TemplateEditorWrapper.tsx
'use client'; // Директива для клиентского компонента

import { useState, useEffect } from 'react';
import { Template } from '@/types';
import TemplateEditor from './TemplateEditor';
import VariableInput from './VariableInput';
import TemplatePreview from './TemplatePreview';
import { updateTemplateAction } from '@/lib/actions'; // Server Action для обновления
import { useFormState, useFormStatus } from 'react-dom'; // Для обработки ответа от Server Action

interface TemplateEditorWrapperProps {
  initialTemplate: Template;
}

// Начальное состояние для useFormState
const initialState = {
  message: '',
  success: false,
};

// Компонент кнопки Submit для формы, использующий useFormStatus
function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`px-4 py-2 rounded text-white ${
        pending ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
      }`}
    >
      {pending ? 'Saving...' : 'Save Template'}
    </button>
  );
}


export default function TemplateEditorWrapper({ initialTemplate }: TemplateEditorWrapperProps) {
  const [templateContent, setTemplateContent] = useState(initialTemplate.content ?? '');
  // Состояние для переменных предпросмотра (храним как строку JSON для удобства редактирования)
  const [previewDataString, setPreviewDataString] = useState(
    JSON.stringify(initialTemplate.preview_data ?? {}, null, 2) // Форматируем JSON
  );
  const [previewData, setPreviewData] = useState<Record<string, any>>(initialTemplate.preview_data ?? {});
  const [isValidJson, setIsValidJson] = useState(true);

  // Обновляем объект previewData при изменении строки JSON
  useEffect(() => {
    try {
      const parsedData = JSON.parse(previewDataString);
      setPreviewData(parsedData);
      setIsValidJson(true);
    } catch (error) {
      // Если JSON невалидный, не обновляем previewData и помечаем как невалидный
      setIsValidJson(false);
    }
  }, [previewDataString]);

  // Привязываем Server Action к ID шаблона
  const updateTemplateWithId = updateTemplateAction.bind(null, initialTemplate.id);

  // Используем useFormState для обработки ответа от Server Action
  const [state, formAction] = useFormState(updateTemplateWithId, initialState);

  return (
    // Используем form и formAction для вызова Server Action
    <form action={formAction} className="space-y-6">
       {/* Скрытые поля для передачи данных, которые не меняются напрямую в этой форме */}
       <input type="hidden" name="templateContent" value={templateContent} />
       <input type="hidden" name="previewDataString" value={previewDataString} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Левая часть: Редактор и ввод переменных */}
        <div className="space-y-4">
          <TemplateEditor
            value={templateContent}
            onChange={setTemplateContent}
          />
          <VariableInput
            value={previewDataString}
            onChange={setPreviewDataString}
            isValidJson={isValidJson}
          />
        </div>

        {/* Правая часть: Предпросмотр */}
        <TemplatePreview
          templateContent={templateContent}
          previewData={previewData}
          isValidJson={isValidJson} // Передаем валидность JSON для отображения ошибки в превью
        />
      </div>

      <div className="mt-4 flex items-center space-x-4">
         <SubmitButton />
         {/* Отображение сообщений от Server Action */}
         {state?.message && (
            <p className={`text-sm ${state.success ? 'text-green-600' : 'text-red-600'}`}>
               {state.message}
            </p>
          )}
      </div>
    </form>
  );
}
```

**Компонент редактора (src/app/(dashboard)/projects/[projectId]/templates/[templateId]/components/TemplateEditor.tsx):**

```typescript
// src/app/(dashboard)/projects/[projectId]/templates/[templateId]/components/TemplateEditor.tsx
'use client';

interface TemplateEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export default function TemplateEditor({ value, onChange }: TemplateEditorProps) {
  return (
    <div>
      <label htmlFor="templateContent" className="block text-sm font-medium text-gray-700 mb-1">
        Handlebars Template Content
      </label>
      <textarea
        id="templateContent"
        name="templateContentInternal" // Имя для textarea, не передается в action напрямую
        rows={15}
        className="w-full p-2 border rounded font-mono text-sm shadow-sm focus:ring-blue-500 focus:border-blue-500"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter your Handlebars template here... e.g., <h1>{{title}}</h1>"
      />
       {/* Примечание: Для лучшего опыта можно интегрировать Monaco Editor или CodeMirror */}
    </div>
  );
}
```

**Компонент ввода переменных (src/app/(dashboard)/projects/[projectId]/templates/[templateId]/components/VariableInput.tsx):**

```typescript
// src/app/(dashboard)/projects/[projectId]/templates/[templateId]/components/VariableInput.tsx
'use client';

interface VariableInputProps {
  value: string; // JSON строка
  onChange: (value: string) => void;
  isValidJson: boolean;
}

export default function VariableInput({ value, onChange, isValidJson }: VariableInputProps) {
  return (
    <div>
      <label htmlFor="previewData" className="block text-sm font-medium text-gray-700 mb-1">
        Preview Data (JSON format)
      </label>
      <textarea
        id="previewData"
        name="previewDataInternal" // Имя для textarea
        rows={10}
        className={`w-full p-2 border rounded font-mono text-sm shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
          !isValidJson ? 'border-red-500' : '' // Подсветка при невалидном JSON
        }`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`{\n  "title": "Example Title",\n  "items": [\n    {"name": "Item 1"},\n    {"name": "Item 2"}\n  ]\n}`}
      />
      {!isValidJson && (
        <p className="text-red-600 text-sm mt-1">Invalid JSON format.</p>
      )}
       <p className="text-xs text-gray-500 mt-1">
        Enter test data as a JSON object. This data is used only for previewing the template.
      </p>
    </div>
  );
}
```

**Утилита для Handlebars (src/lib/handlebars.ts):**

```typescript
// src/lib/handlebars.ts
import Handlebars from 'handlebars';

// Регистрируем хелперы Handlebars, если нужно
// Handlebars.registerHelper('loud', function (aString) {
//   return aString.toUpperCase()
// })

export function renderHandlebarsTemplate(templateString: string, data: object): string {
  if (!templateString) {
    return ''; // Возвращаем пустую строку, если нет шаблона
  }
  try {
    const template = Handlebars.compile(templateString);
    return template(data);
  } catch (error) {
    console.error("Handlebars compilation/rendering error:", error);
    // Возвращаем сообщение об ошибке для отображения в превью
    if (error instanceof Error) {
       return `<pre style="color: red; background-color: #fee; padding: 10px; border: 1px solid red;">Handlebars Error:\n${error.message}</pre>`;
    }
     return '<p style="color: red;">An unknown error occurred during Handlebars processing.</p>';
  }
}
```

**Компонент предпросмотра (src/app/(dashboard)/projects/[projectId]/templates/[templateId]/components/TemplatePreview.tsx):**

```typescript
// src/app/(dashboard)/projects/[projectId]/templates/[templateId]/components/TemplatePreview.tsx
'use client';

import { useState, useEffect } from 'react';
import { renderHandlebarsTemplate } from '@/lib/handlebars';

interface TemplatePreviewProps {
  templateContent: string;
  previewData: Record<string, any>;
  isValidJson: boolean; // Получаем состояние валидности JSON
}

export default function TemplatePreview({ templateContent, previewData, isValidJson }: TemplatePreviewProps) {
  const [renderedHtml, setRenderedHtml] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isValidJson) {
      setError('Preview unavailable due to invalid JSON data.');
      setRenderedHtml(''); // Очищаем предыдущий рендер
      return; // Не пытаемся рендерить с невалидным JSON
    }

    setError(null); // Сбрасываем ошибку JSON

    // Добавляем небольшую задержку (debounce) перед рендерингом,
    // чтобы не перерисовывать на каждое нажатие клавиши
    const handler = setTimeout(() => {
      const result = renderHandlebarsTemplate(templateContent, previewData);
      // Проверяем, вернула ли функция рендеринга HTML-ошибку
      if (result.startsWith('<pre style="color: red;')) {
         setError('Error rendering Handlebars template.');
         setRenderedHtml(result); // Показываем сообщение об ошибке из рендерера
      } else {
         setRenderedHtml(result);
      }

    }, 300); // Задержка 300 мс

    return () => {
      clearTimeout(handler); // Очищаем таймер при размонтировании или изменении зависимостей
    };
  }, [templateContent, previewData, isValidJson]); // Зависим от контента, данных и валидности JSON

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Live Preview</h3>
      {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
      <div
        className="border rounded p-4 bg-gray-50 min-h-[300px] overflow-auto"
        // Используем dangerouslySetInnerHTML для рендеринга HTML.
        // Убедитесь, что вы доверяете результатам Handlebars рендеринга
        // или добавьте слой санитайзинга (например, DOMPurify), если нужно.
        dangerouslySetInnerHTML={{ __html: renderedHtml }}
      />
       <p className="text-xs text-gray-500 mt-1">
        This is a preview rendered using the Handlebars template and the JSON data provided. The actual saved template remains pure Handlebars.
      </p>
    </div>
  );
}

```

**Server Action для обновления шаблона (src/lib/actions.ts):**

```typescript
// src/lib/actions.ts
'use server'; // Директива для Server Action

import { revalidatePath } from 'next/cache';
import { createClient } from './supabase/server'; // Используем серверный клиент
import { z } from 'zod'; // Для валидации данных формы

// Схема валидации для данных формы
const UpdateTemplateSchema = z.object({
  templateContent: z.string().optional(), // Содержимое шаблона
  previewDataString: z.string().refine((data) => { // Проверяем, что строка является валидным JSON
    try {
      JSON.parse(data);
      return true;
    } catch {
      return false;
    }
  }, { message: "Preview data must be valid JSON." }),
});

// Тип для состояния ответа Server Action
export type ActionState = {
  message: string;
  success: boolean;
  errors?: z.ZodIssue[];
};

export async function updateTemplateAction(
  templateId: string, // ID шаблона передается через .bind()
  prevState: ActionState, // Предыдущее состояние (для useFormState)
  formData: FormData // Данные из формы
): Promise<ActionState> {
  const supabase = createClient();

  // Извлекаем данные из FormData
  const rawFormData = {
      templateContent: formData.get('templateContent'),
      previewDataString: formData.get('previewDataString'),
  };

  // Валидируем данные с помощью Zod
  const validatedFields = UpdateTemplateSchema.safeParse(rawFormData);

  // Если валидация не прошла, возвращаем ошибки
  if (!validatedFields.success) {
    console.error("Validation failed:", validatedFields.error.flatten().fieldErrors);
    return {
      message: 'Validation failed. Please check the fields.',
      success: false,
      errors: validatedFields.error.issues,
    };
  }

  // Парсим JSON из строки перед сохранением
  let previewDataJson: object | null = null;
  try {
    previewDataJson = JSON.parse(validatedFields.data.previewDataString);
  } catch (e) {
     // Эта ошибка не должна произойти из-за валидации Zod, но на всякий случай
     console.error("JSON parsing failed after validation:", e);
     return { message: 'Failed to parse JSON data.', success: false };
  }


  // Обновляем данные в Supabase
  const { error } = await supabase
    .from('templates')
    .update({
      content: validatedFields.data.templateContent,
      preview_data: previewDataJson, // Сохраняем распарсенный JSON
      // updated_at обновится автоматически триггером
    })
    .eq('id', templateId); // Обновляем только нужный шаблон

  if (error) {
    console.error('Supabase update error:', error);
    return { message: `Database Error: Failed to update template. ${error.message}`, success: false };
  }

  // Очищаем кеш для пути шаблона, чтобы данные обновились
  revalidatePath(`/projects/.*/templates/${templateId}`); // Используем более общий путь или точный, если известен projectId
  // Возможно, также нужно ревалидировать список шаблонов
  // revalidatePath(`/projects/${projectId}/templates`);

  // Возвращаем успешный результат
  return { message: 'Template updated successfully!', success: true };
}

// --- Добавьте здесь Server Actions для создания/удаления проектов и шаблонов ---
// async function createProjectAction(...) { ... }
// async function createTemplateAction(...) { ... }
```

---

**Важные моменты и следующие шаги:**

1.  **Валидный Handlebars на выходе:** Ключевой момент вашего запроса — чтобы на выходе был валидный Handlebars. В предложенной структуре:
    *   Пользователь редактирует чистый Handlebars код в `TemplateEditor`.
    *   Тестовые данные вводятся отдельно в `VariableInput` в формате JSON.
    *   `TemplatePreview` использует `handlebars.js` для *временного* рендеринга HTML на основе шаблона и тестовых данных *только для предпросмотра*.
    *   При сохранении (`updateTemplateAction`) в базу данных (`content` поле таблицы `templates`) записывается именно *чистый Handlebars код* из `TemplateEditor`. Поле `preview_data` сохраняет JSON для удобства последующих предпросмотров. Таким образом, основной хранимый артефакт — это валидный Handlebars шаблон.
2.  **Безопасность:**
    *   **RLS (Row Level Security):** Обязательно настройте политики безопасности в Supabase, особенно если приложение будет публичным или многопользовательским. Без RLS любой, у кого есть `anon key`, сможет читать/писать данные.
    *   **Server Actions:** Использование Server Actions предпочтительнее API роутов для мутаций данных, так как они выполняются на сервере и лучше интегрируются с формами и кешированием Next.js.
    *   **Sanitization:** Если вы будете рендерить HTML из Handlebars (даже в превью), убедитесь, что данные, подставляемые в шаблон, безопасны, или используйте библиотеки типа `DOMPurify` перед `dangerouslySetInnerHTML`, если есть риск XSS-атак (например, если тестовые данные могут содержать вредоносный HTML/скрипты). Handlebars сам по себе экранирует подстановки `{{variable}}`, но не `{{{variable}}}`.
3.  **Улучшения:**
    *   **Редактор кода:** Замените `<textarea>` на Monaco Editor (`@monaco-editor/react`) или CodeMirror (`@uiw/react-codemirror`) для подсветки синтаксиса Handlebars и лучшего опыта редактирования.
    *   **Создание/Удаление:** Добавьте формы и Server Actions для создания и удаления проектов и шаблонов.
    *   **Аутентификация:** Интегрируйте Supabase Auth для управления пользователями.
    *   **Обработка ошибок:** Улучшите обработку ошибок (например, показ уведомлений пользователю).
    *   **Состояние загрузки:** Добавьте индикаторы загрузки при выполнении Server Actions.
    *   **UI:** Используйте UI-компоненты (например, из `shadcn/ui`) для более красивого и консистентного интерфейса.

Этот каркас должен дать вам хорошую основу для создания вашего менеджера Handlebars шаблонов на Next.js и Supabase. Удачи в разработке! Если у вас появятся конкретные вопросы по реализации какого-либо шага, спрашивайте.
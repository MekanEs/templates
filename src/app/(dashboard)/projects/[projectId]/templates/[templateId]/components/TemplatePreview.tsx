// src/app/(dashboard)/projects/[projectId]/templates/[templateId]/components/TemplatePreview.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { renderHandlebarsTemplate } from '@/lib/handlebars';
import { JSONObject } from '@/types';
import { replacePlaceholders } from '@/lib/replaceHolders';

interface TemplatePreviewProps {
  templateContent: string;
  previewData: JSONObject;
  isValidJson: boolean;
  variableValues: Record<string, string>; 
}

export default function TemplatePreview({ templateContent, previewData, isValidJson,variableValues}: TemplatePreviewProps) {
  const [renderedHtml, setRenderedHtml] = useState('');
  const [renderWithDV, setRenderWithDV] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
    const [finalTemplate, setFinalTemplate] = useState('');
  useEffect(() => {
    const generated = replacePlaceholders(templateContent, variableValues);
    setFinalTemplate(generated);
  }, [templateContent, variableValues]);
  useEffect(() => {
    let htmlToRender = '';
    let currentError:null|string = null;

    if (!isValidJson) {
      currentError = 'Preview unavailable due to invalid JSON data.';
      htmlToRender = `<p style="color: red; padding: 10px;">${currentError}</p>`;
    } else {
      try {
        // Добавляем небольшую задержку (debounce) перед рендерингом
        const handler = setTimeout(() => {
          let sourceToRender=templateContent
          if(renderWithDV){
            sourceToRender = finalTemplate
          }
            const result = renderHandlebarsTemplate(sourceToRender, previewData);
             // Проверяем, вернула ли функция рендеринга HTML-ошибку
             if (result.includes('Handlebars Error:')) { // Проверяем наличие строки ошибки
                currentError = 'Error rendering Handlebars template.';
                htmlToRender = result; // Показываем сообщение об ошибке из рендерера
             } else {
                htmlToRender = result; // Успешный рендер
             }
             setError(currentError);
             setRenderedHtml(htmlToRender);

        }, 300); // Задержка 300 мс

        // Очистка таймера при размонтировании или изменении зависимостей
        return () => clearTimeout(handler);

      } catch (e) { // Ловим ошибки рендеринга, если renderHandlebarsTemplate их не обработал
          console.error("Preview rendering error:", e);
          currentError = 'An unexpected error occurred during preview rendering.';
          htmlToRender = `<p style="color: red; padding: 10px;">${currentError}</p>`;
      }
    }

     setError(currentError);
     setRenderedHtml(htmlToRender);

  }, [templateContent, previewData, isValidJson, renderWithDV, finalTemplate]); // Зависим от контента, данных и валидности JSON


  // Используем srcDoc для установки содержимого iframe
  // Это безопаснее и проще, чем манипулировать document iframe
  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Live Preview</h3>
      {error && !renderedHtml.includes('Handlebars Error:') && ( // Показываем общую ошибку, если она не в самом HTML
         <p className="text-red-600 text-sm mb-2">{error}</p>
      )}
      <div className='p-2 border'>
        <label htmlFor="render with dynamic variable">render with dynamic variable</label>
        <input onChange={(e)=>setRenderWithDV(e.target.checked)} type="checkbox" name="render with dynamic variable" id="" checked={renderWithDV}/>
      </div>
      <iframe
        ref={iframeRef}
        title="Template Preview"
        srcDoc={renderedHtml || '<p>Loading preview...</p>'} // Устанавливаем HTML содержимое
        className="mt-2 border rounded bg-white w-full min-h-[400px] lg:min-h-[calc(400px+230px)]" // Увеличим высоту, т.к. редакторы стали выше
        sandbox="allow-same-origin" // Ограничиваем возможности iframe для безопасности, разрешаем только same-origin
        frameBorder="0"
      />
       <p className="text-xs text-gray-500 mt-1">
        Preview rendered inside an isolated iframe.
      </p>
    </div>
  );
}
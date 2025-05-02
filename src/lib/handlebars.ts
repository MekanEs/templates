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
    console.error('Handlebars compilation/rendering error:', error);
    // Возвращаем сообщение об ошибке для отображения в превью
    if (error instanceof Error) {
      return `<pre style="color: red; background-color: #fee; padding: 10px; border: 1px solid red;">Handlebars Error:\n${error.message}</pre>`;
    }
    return '<p style="color: red;">An unknown error occurred during Handlebars processing.</p>';
  }
}

export function replacePlaceholders(template: string, values: Record<string, string>): string {
  let result = template;
  for (const name in values) {
    // Используем new RegExp для создания динамического регулярного выражения
    // 'g' флаг для глобальной замены (всех вхождений)
    const placeholderRegex = new RegExp(`__${name}__`, 'g');
    result = result.replace(placeholderRegex, values[name] || ''); // Заменяем на значение или пустую строку
  }
  return result;
}
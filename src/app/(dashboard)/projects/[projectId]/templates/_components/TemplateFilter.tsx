// src/app/(dashboard)/projects/[projectId]/templates/_components/TemplateFilter.tsx
'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useState, useEffect,  } from 'react';
import { useDebouncedCallback } from 'use-debounce'; // npm install use-debounce

export default function TemplateFilter() {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const router = useRouter();

    // Состояние для input
    const [tagInput, setTagInput] = useState(() => searchParams.get('tags') || '');

    // Debounced функция для обновления URL
    const updateURL = useDebouncedCallback((term: string) => {
        const params = new URLSearchParams(searchParams);
        if (term) {
            params.set('tags', term.trim().toLowerCase());
        } else {
            params.delete('tags');
        }
        router.replace(`${pathname}?${params.toString()}`); // Используем replace для не добавления в историю браузера
    }, 500); // Задержка 500ms

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const term = event.target.value;
        setTagInput(term);
        updateURL(term);
    };

     // Синхронизируем инпут, если URL изменился извне (например, кнопкой "назад")
     useEffect(() => {
        setTagInput(searchParams.get('tags') || '');
     }, [searchParams]);


    return (
        <div className="mb-6">
            <label htmlFor="tag-search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Filter by Tags (comma-separated):
            </label>
            <input
                type="search" // Используем type="search" для возможности очистки
                id="tag-search"
                value={tagInput}
                onChange={handleInputChange}
                placeholder="e.g., email, welcome"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
        </div>
    );
}
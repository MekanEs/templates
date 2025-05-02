// src/app/(dashboard)/projects/_components/DeleteProjectButton.tsx
'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { deleteProjectAction, ActionState } from '@/lib/actions';

const initialState: ActionState = { message: '', success: false };

function SubmitDeleteButton() {
    const { pending } = useFormStatus();
    return (
        <button
            type="submit"
            disabled={pending}
            className="px-2 py-1 text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-500 disabled:opacity-50"
        >
            {pending ? 'Deleting...' : 'Delete'}
        </button>
    );
}

export default function DeleteProjectButton({ projectId, canEdit }: { projectId: string, canEdit: boolean }) {
    // Привязываем ID проекта к экшену
    const deleteActionBound = deleteProjectAction.bind(null, projectId);
    const [state, formAction] = useActionState(deleteActionBound, initialState);

    if (!canEdit) return null; // Не рендерим кнопку, если нет прав

    const handleDeleteClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        if (!window.confirm(`Are you sure you want to delete this project and ALL its templates? This action cannot be undone.`)) {
            e.preventDefault(); // Отменяем отправку формы, если пользователь нажал "Отмена"
        }
    };

    return (
        <form action={formAction} className="inline-block ml-2">
             {/* Добавляем обработчик onClick для подтверждения */}
            <SubmitDeleteButton />
            {state?.message && !state.success && ( // Показываем только ошибки
                <p className="text-xs text-red-600 ml-2 inline">{state.message}</p>
            )}
        </form>
    );
}
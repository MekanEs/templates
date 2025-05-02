// src/app/(dashboard)/projects/[projectId]/templates/_components/DeleteTemplateButton.tsx
'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { deleteTemplateAction, ActionState } from '@/lib/actions';

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

export default function DeleteTemplateButton({ templateId, projectId, canEdit }: { templateId: string, projectId: string, canEdit: boolean }) {
    // Привязываем ID шаблона и проекта
    const deleteActionBound = deleteTemplateAction.bind(null, templateId, projectId);
    const [state, formAction] = useActionState(deleteActionBound, initialState);

    if (!canEdit) return null;

    const handleDeleteClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        if (!window.confirm('Are you sure you want to delete this template?')) {
            e.preventDefault();
        }
    };

    return (
        <form action={formAction} className="inline-block ml-2">
             <button type="submit" onClick={handleDeleteClick} disabled={useFormStatus().pending} className="px-2 py-1 text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-500 disabled:opacity-50">
                {useFormStatus().pending ? 'Deleting...' : 'Delete'}
            </button>
            {state?.message && !state.success && (
                <p className="text-xs text-red-600 ml-2 inline">{state.message}</p>
            )}
            {/* Сообщение об успехе можно показать, т.к. редиректа нет */}
             {state?.message && state.success && (
                <p className="text-xs text-green-600 ml-2 inline">{state.message}</p>
            )}
        </form>
    );
}
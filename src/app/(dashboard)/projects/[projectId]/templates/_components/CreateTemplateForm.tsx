// src/app/(dashboard)/projects/[projectId]/templates/_components/CreateTemplateForm.tsx
'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { createTemplateAction, ActionState } from '@/lib/actions';
import { useEffect, useRef } from 'react';

const initialState: ActionState = { message: '', success: false };

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <button
            type="submit"
            disabled={pending}
            className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
        >
            {pending ? 'Creating...' : 'Create Template'}
        </button>
    );
}

export default function CreateTemplateForm({ projectId, canEdit }: { projectId: string, canEdit: boolean }) {
    const [state, formAction] = useActionState(createTemplateAction, initialState);
    const formRef = useRef<HTMLFormElement>(null);

    // Примечание: Редирект происходит в Server Action, поэтому сброс формы здесь не так критичен,
    // но оставим на случай, если редирект не сработает из-за ошибки.
    useEffect(() => {
        if (state.success) {
            formRef.current?.reset();
        }
    }, [state.success]);

    if (!canEdit) return null;

    return (
        <div className="mb-6 p-4 border rounded bg-gray-50">
            <h2 className="text-lg font-semibold mb-3">Create New Template</h2>
            <form ref={formRef} action={formAction} className="space-y-3">
                {/* Скрытое поле для передачи ID проекта */}
                <input type="hidden" name="projectId" value={projectId} />
                <div>
                    <label htmlFor="templateName" className="block text-sm font-medium text-gray-700">
                        Template Name <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        id="templateName"
                        name="name"
                        required
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                </div>
                <div className="flex items-center space-x-4">
                    <SubmitButton />
                    {state?.message && !state.success && ( // Показываем только ошибки
                        <p className="text-sm text-red-600">{state.message}</p>
                    )}
                    {/* Сообщение об успехе не увидим из-за редиректа */}
                </div>
            </form>
        </div>
    );
}
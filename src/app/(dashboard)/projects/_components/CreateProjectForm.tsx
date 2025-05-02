// src/app/(dashboard)/projects/_components/CreateProjectForm.tsx
'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { createProjectAction, ActionState } from '@/lib/actions';
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
            {pending ? 'Creating...' : 'Create Project'}
        </button>
    );
}

export default function CreateProjectForm({ canEdit }: { canEdit: boolean }) {
    const [state, formAction] = useActionState(createProjectAction, initialState);
    const formRef = useRef<HTMLFormElement>(null);

    useEffect(() => {
        // Сбрасываем форму после успешного создания
        if (state.success) {
            formRef.current?.reset();
        }
    }, [state.success]);

    if (!canEdit) return null; // Не рендерим форму, если нет прав

    return (
        <div className="mb-6 p-4 border rounded bg-gray-50">
            <h2 className="text-lg font-semibold mb-3">Create New Project</h2>
            <form ref={formRef} action={formAction} className="space-y-3">
                <div>
                    <label htmlFor="projectName" className="block text-sm font-medium text-gray-700">
                        Project Name <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        id="projectName"
                        name="name"
                        required
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                </div>
                <div>
                    <label htmlFor="projectDescription" className="block text-sm font-medium text-gray-700">
                        Description (Optional)
                    </label>
                    <textarea
                        id="projectDescription"
                        name="description"
                        rows={2}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                </div>
                <div className="flex items-center space-x-4">
                    <SubmitButton />
                    {state?.message && (
                        <p className={`text-sm ${state.success ? 'text-green-600' : 'text-red-600'}`}>
                            {state.message}
                        </p>
                    )}
                </div>
            </form>
        </div>
    );
}
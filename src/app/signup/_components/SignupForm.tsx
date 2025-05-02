// src/app/signup/_components/SignupForm.tsx
'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { signupAction } from '../../../lib/authActions'; // Создадим этот Server Action

const initialState = {
  message: '',
  success: false,
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
    >
      {pending ? 'Creating account...' : 'Create account'}
    </button>
  );
}

export default function SignupForm() {
  const [state, formAction] = useFormState(signupAction, initialState);

  return (
    <form className="mt-8 space-y-6" action={formAction}>
      <div className="rounded-md shadow-sm -space-y-px">
        {/* Поле Email */}
        <div>
          <label htmlFor="email-address" className="sr-only">Email address</label>
          <input
            id="email-address"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
            placeholder="Email address"
          />
        </div>
        {/* Поле Password */}
        <div>
          <label htmlFor="password" className="sr-only">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={6} // Минимальная длина пароля (согласуйте с настройками Supabase)
            className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
            placeholder="Password (min. 6 characters)"
          />
        </div>
      </div>

      {/* Отображение сообщений */}
      {state?.message && (
        <p className={`text-sm text-center ${state.success ? 'text-green-600' : 'text-red-600'}`}>
          {state.message}
        </p>
      )}

      <div>
        <SubmitButton />
      </div>
    </form>
  );
}
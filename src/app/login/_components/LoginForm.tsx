// src/app/login/_components/LoginForm.tsx
'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation'; // Для редиректа после успеха
import { loginAction } from '@/lib/authActions';

// Начальное состояние для useFormState
const initialState = {
  message: '',
  success: false,
  redirectTo: '', // Поле для URL редиректа
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
    >
      {pending ? 'Signing in...' : 'Sign in'}
    </button>
  );
}

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, formAction] = useFormState(loginAction, initialState);

  // Получаем URL для редиректа из параметров запроса (если пришли из middleware)
  const redirectedFrom = searchParams.get('redirectedFrom') || '/projects'; // По умолчанию на /projects

  // Эффект для редиректа после успешного входа
  useEffect(() => {
    if (state?.success && state.redirectTo) {
      router.push(state.redirectTo);
    }
  }, [state, router]);


  return (
    <form className="mt-8 space-y-6" action={formAction}>
      {/* Скрытое поле для передачи URL редиректа в Server Action */}
      <input type="hidden" name="redirectTo" value={redirectedFrom} />

      {/* Поле Email */}
      <div className="rounded-md shadow-sm -space-y-px">
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
            autoComplete="current-password"
            required
            className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
            placeholder="Password"
          />
        </div>
      </div>

       {/* Отображение ошибок */}
       {state?.message && !state.success && (
         <p className="text-sm text-red-600 text-center">{state.message}</p>
       )}
       {/* Можно добавить сообщение об успехе, но редирект обычно лучше */}
       {/* {state?.message && state.success && (
         <p className="text-sm text-green-600 text-center">{state.message}</p>
       )} */}


      {/* <div className="flex items-center justify-between">
        <div className="text-sm">
          <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
            Forgot your password?
          </a>
        </div>
      </div> */}

      <div>
        <SubmitButton />
      </div>
    </form>
  );
}
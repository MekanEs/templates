// src/lib/authActions.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { z } from 'zod';

// Тип для состояния ответа Server Action
interface AuthActionState {
  message: string;
  success: boolean;
  redirectTo?: string; // Для редиректа после логина
}

// Схема валидации для логина
const LoginSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(1, { message: "Password cannot be empty." }),
  redirectTo: z.string().optional(), // URL для редиректа
});

// Схема валидации для регистрации
const SignupSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  // Согласуйте min(6) с настройками Supabase Auth -> Templates -> Minimum password length
  password: z.string().min(6, { message: "Password must be at least 6 characters long." }),
});


// --- Login Action ---
export async function loginAction(
  prevState: AuthActionState | null,
  formData: FormData
): Promise<AuthActionState> {
  const supabase = createClient();

  const rawFormData = Object.fromEntries(formData.entries());
  const validatedFields = LoginSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    // Собираем ошибки валидации
    const errorMessage = validatedFields.error.issues.map(issue => issue.message).join(', ');
    return { message: `Validation failed: ${errorMessage}`, success: false };
  }

  const { email, password, redirectTo } = validatedFields.data;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error('Login error:', error.message);
    return { message: error.message || 'Invalid login credentials.', success: false };
  }

  // Успешный вход - возвращаем URL для редиректа
  // Редирект будет выполнен на клиенте через useEffect в LoginForm
  return { message: 'Login successful!', success: true, redirectTo: redirectTo || '/projects' };

  // Альтернатива: прямой редирект из Server Action (но тогда сообщение об успехе не увидим)
  // redirect(redirectTo || '/projects');
}


// --- Signup Action ---
export async function signupAction(
  prevState: AuthActionState | null,
  formData: FormData
): Promise<AuthActionState> {
  const supabase = createClient();

  const rawFormData = Object.fromEntries(formData.entries());
  const validatedFields = SignupSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    const errorMessage = validatedFields.error.issues.map(issue => issue.message).join(', ');
    return { message: `Validation failed: ${errorMessage}`, success: false };
  }

  const { email, password } = validatedFields.data;

  if (!email.endsWith('@jetmail.cc')) {
    return { message: 'Registration is only allowed for jetmail.cc addresses.', success: false };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // (Опционально) Сюда можно добавить URL для подтверждения email, если он отличается от Site URL в настройках Supabase
      // emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    console.error('Signup error:', error.message);
    // Обрабатываем специфичные ошибки Supabase
    if (error.message.includes("User already registered")) {
         return { message: "This email is already registered. Try logging in.", success: false };
    }
     if (error.message.includes("Password should be at least 6 characters")) {
         return { message: "Password is too short (minimum 6 characters).", success: false };
    }
    return { message: error.message || 'Could not create account.', success: false };
  }

  // Проверяем, нужно ли подтверждение email
  const needsConfirmation = data.user?.identities?.length === 0 || data.user?.email_confirmed_at === null;

  if (needsConfirmation) {
     return { message: 'Account created! Please check your email to confirm your registration.', success: true };
  } else {
     // Если подтверждение не требуется (или отключено), можно сразу редиректить или сообщить об успехе
     // redirect('/projects'); // Или
     return { message: 'Account created successfully!', success: true };
  }
}


// --- Logout Action ---
export async function logoutAction(): Promise<void> { // Не возвращает состояние, просто редиректит
    const supabase = createClient();

    const { error } = await supabase.auth.signOut();

    if (error) {
        console.error('Logout error:', error);
        // Редирект даже при ошибке, т.к. сессия скорее всего невалидна
    }

    // Перенаправляем на главную или страницу входа после выхода
    redirect('/login');
}
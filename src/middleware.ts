// src/middleware.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Создаем клиент Supabase для Middleware
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          // If the cookie is updated, update the cookies for the request and response
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({ // Важно пересоздать response, если куки меняются
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          // If the cookie is removed, update the cookies for the request and response
          request.cookies.delete(name)
           response = NextResponse.next({ // Важно пересоздать response, если куки меняются
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  // Обновляем сессию пользователя на основе куки. Это важно!
  const { data: { session } } = await supabase.auth.getSession();

  // --- Логика защиты роутов ---
  const { pathname } = request.nextUrl;

  // Список публичных путей (не требуют аутентификации)
  const publicPaths = ['/', '/login', '/signup', '/auth/callback']; // Добавим /auth/callback позже, если нужны OAuth

  // Проверяем, является ли текущий путь защищенным
  const isProtectedRoute = !publicPaths.some(path => pathname === path || (path !== '/' && pathname.startsWith(path)));

  // Если пользователь не аутентифицирован и пытается зайти на защищенный роут
  if (!session && isProtectedRoute) {
    // Перенаправляем на страницу входа, сохраняя исходный URL для редиректа после логина
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/login';
    redirectUrl.searchParams.set('redirectedFrom', pathname); // Сохраняем исходный путь
    return NextResponse.redirect(redirectUrl);
  }

  // Если пользователь аутентифицирован и пытается зайти на страницу входа/регистрации
  if (session && (pathname === '/login' || pathname === '/signup')) {
     // Перенаправляем на страницу проектов
     return NextResponse.redirect(new URL('/projects', request.url));
  }

  // Во всех остальных случаях продолжаем запрос/ответ
  return response;
}

// Конфигурация Middleware: указываем пути, на которые он будет срабатывать
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
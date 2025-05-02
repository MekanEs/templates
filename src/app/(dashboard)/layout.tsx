// Пример для src/app/(dashboard)/layout.tsx (если хотите кнопку только в защищенной части)
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import LogoutButton from '@/components/LogoutButton'; // Создадим этот компонент

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div>
      <header className="bg-white shadow-sm">
        <nav className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div>
            <Link href="/projects" className="text-xl font-semibold text-gray-800">
              Template Manager
            </Link>
            {/* Дополнительные ссылки навигации дашборда */}
          </div>
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <span className="text-sm text-gray-600 hidden sm:inline">
                  {user.email}
                </span>
                <LogoutButton />
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm font-medium text-gray-700 hover:text-blue-600">
                  Login
                </Link>
                <Link href="/signup" className="text-sm font-medium text-white bg-blue-600 px-3 py-1 rounded hover:bg-blue-700">
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>
      <main>{children}</main>
    </div>
  );
}